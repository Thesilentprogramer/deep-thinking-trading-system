from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deep_thinking.graph import graph, config
from deep_thinking.state import AgentState, InvestDebateState, RiskDebateState
from deep_thinking.utils import SignalProcessor, Reflector, evaluate_ground_truth, Audit
from deep_thinking.llm import quick_thinking_llm, deep_thinking_llm
from deep_thinking.memory import bull_memory, bear_memory, trader_memory, risk_manager_memory
from deep_thinking import database as db
from langchain_core.messages import HumanMessage
import datetime
import uvicorn
import threading
import uuid

app = FastAPI(title="Deep Thinking Trading System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    ticker: str
    date: str = None  # Optional, defaults to 2 days ago

class AnalyzeResponse(BaseModel):
    run_id: str
    status: str

# Initialize MongoDB on startup
db.init_db()

def execute_graph_thread(run_id: str, ticker: str, trade_date: str):
    try:
        print(f"\n{'='*60}")
        print(f"  Starting analysis for {ticker} on {trade_date} (run: {run_id})")
        print(f"{'='*60}")
        
        updated_state = AgentState(
            messages=[HumanMessage(content=f"Analyze {ticker} for trading on {trade_date}")],
            company_of_interest=ticker,
            trade_date=trade_date,
            investment_debate_state={'history': '', 'current_response': '', 'count': 0, 'bull_history': '', 'bear_history': '', 'judge_decision': ''},
            risk_debate_state={'history': '', 'latest_speaker': '','current_risky_response': '', 'current_safe_response': '', 'current_neutral_response': '', 'count': 0, 'risky_history': '', 'safe_history': '', 'neutral_history': '', 'judge_decision': ''},
            market_report="", sentiment_report="", news_report="", fundamentals_report="",
            investment_plan="", trader_investment_plan="", final_trade_decision=""
        )
        
        graph_config = {"recursion_limit": config['max_recur_limit']}
        
        # Use invoke to get the complete final state
        print("  Running graph pipeline...")
        final_state = graph.invoke(updated_state, config=graph_config)
        print("  ✓ Graph pipeline completed")
        
        # Post-processing
        print("  Processing final signal...")
        signal_processor = SignalProcessor(quick_thinking_llm)
        
        final_decision = final_state.get('final_trade_decision', '')
        if not final_decision:
            final_decision = "HOLD - No decision was produced by the pipeline."
        
        final_signal = signal_processor.process_signal(final_decision)
        print(f"  Final Signal: {final_signal}")
        
        # Extract reports dict for storage
        invest_state = final_state.get("investment_debate_state", {})
        risk_state = final_state.get("risk_debate_state", {})
        
        reports = {
            "market_report": final_state.get("market_report", ""),
            "sentiment_report": final_state.get("sentiment_report", ""),
            "news_report": final_state.get("news_report", ""),
            "fundamentals_report": final_state.get("fundamentals_report", ""),
            "bull_case": invest_state.get("bull_history", "") if isinstance(invest_state, dict) else "",
            "bear_case": invest_state.get("bear_history", "") if isinstance(invest_state, dict) else "",
            "research_verdict": final_state.get("investment_plan", ""),
            "trader_plan": final_state.get("trader_investment_plan", ""),
            "risk_debate": risk_state.get("history", "") if isinstance(risk_state, dict) else "",
            "final_decision": final_state.get("final_trade_decision", ""),
        }
        
        # Save to MongoDB
        db.complete_run(run_id, reports, final_signal)
        print(f"  ✅ Analysis complete for {ticker}! (saved to MongoDB)\n")
        
    except Exception as e:
        import traceback
        print(f"  ❌ Error in run {run_id}: {e}")
        traceback.print_exc()
        db.fail_run(run_id, str(e))

@app.get("/")
def read_root():
    return {"message": "Deep Thinking Trading System API is running. Use /docs to view the API documentation."}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_stock(request: AnalyzeRequest):
    run_id = str(uuid.uuid4())
    
    trade_date = request.date
    if not trade_date:
        trade_date = (datetime.date.today() - datetime.timedelta(days=2)).strftime('%Y-%m-%d')
    
    # Create run in MongoDB
    db.create_run(run_id, request.ticker, trade_date)
    
    thread = threading.Thread(target=execute_graph_thread, args=(run_id, request.ticker, trade_date))
    thread.start()
    
    return {"run_id": run_id, "status": "started"}

@app.get("/api/status/{run_id}")
async def get_status(run_id: str):
    run = db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run ID not found")
    
    if run["status"] == "completed":
        reports = run.get("reports", {})
        return {
            "status": "completed",
            "market_report": reports.get("market_report", ""),
            "sentiment_report": reports.get("sentiment_report", ""),
            "news_report": reports.get("news_report", ""),
            "fundamentals_report": reports.get("fundamentals_report", ""),
            "bull_case": reports.get("bull_case", ""),
            "bear_case": reports.get("bear_case", ""),
            "research_verdict": reports.get("research_verdict", ""),
            "trader_plan": reports.get("trader_plan", ""),
            "risk_debate": reports.get("risk_debate", ""),
            "final_decision": reports.get("final_decision", ""),
            "final_signal": run.get("final_signal", "HOLD"),
        }
    
    if run["status"] == "failed":
        return {"status": "failed", "error": run.get("error", "Unknown error")}
    
    return {"status": run["status"]}

@app.get("/api/history")
async def get_history():
    """Return all past analysis runs, newest first."""
    runs = db.get_all_runs()
    # Convert _id to id for frontend compatibility
    result = []
    for run in runs:
        result.append({
            "id": run["_id"],
            "ticker": run.get("ticker", ""),
            "trade_date": run.get("trade_date", ""),
            "status": run.get("status", ""),
            "final_signal": run.get("final_signal"),
            "created_at": run.get("created_at", ""),
            "completed_at": run.get("completed_at"),
            "error": run.get("error"),
        })
    return result

@app.delete("/api/history/{run_id}")
async def delete_history(run_id: str):
    """Delete a specific analysis run."""
    deleted = db.delete_run(run_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"message": "Deleted", "run_id": run_id}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

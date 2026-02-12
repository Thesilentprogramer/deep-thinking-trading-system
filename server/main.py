from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deep_thinking.graph import graph, config
from deep_thinking.state import AgentState, InvestDebateState, RiskDebateState
from deep_thinking.utils import SignalProcessor, Reflector, evaluate_ground_truth, Audit
from deep_thinking.llm import quick_thinking_llm, deep_thinking_llm
from deep_thinking.memory import bull_memory, bear_memory, trader_memory, risk_manager_memory
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

# In-memory store for run results (for simplicity in this demo)
# In production, use Redis or a database.
run_results = {}

@app.get("/")
def read_root():
    return {"message": "Deep Thinking Trading System API is running. Use /docs to view the API documentation."}

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
        
        # Store results
        run_results[run_id] = {
            "status": "completed",
            "final_state": final_state,
            "final_signal": final_signal
        }
        print(f"  ✅ Analysis complete for {ticker}!\n")
        
    except Exception as e:
        import traceback
        print(f"  ❌ Error in run {run_id}: {e}")
        traceback.print_exc()
        run_results[run_id] = {"status": "failed", "error": str(e)}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_stock(request: AnalyzeRequest):
    run_id = str(uuid.uuid4())
    
    trade_date = request.date
    if not trade_date:
        trade_date = (datetime.date.today() - datetime.timedelta(days=2)).strftime('%Y-%m-%d')
        
    run_results[run_id] = {"status": "running"}
    
    thread = threading.Thread(target=execute_graph_thread, args=(run_id, request.ticker, trade_date))
    thread.start()
    
    return {"run_id": run_id, "status": "started"}

@app.get("/api/status/{run_id}")
async def get_status(run_id: str):
    if run_id not in run_results:
        raise HTTPException(status_code=404, detail="Run ID not found")
    
    result = run_results[run_id]
    
    # If completed, filter the payload to be JSON serializable and frontend-friendly
    if result["status"] == "completed":
        state = result["final_state"]
        # Safely access nested state objects
        invest_state = state.get("investment_debate_state", {})
        risk_state = state.get("risk_debate_state", {})
        
        response_data = {
            "status": "completed",
            "market_report": state.get("market_report", ""),
            "sentiment_report": state.get("sentiment_report", ""),
            "news_report": state.get("news_report", ""),
            "fundamentals_report": state.get("fundamentals_report", ""),
            "bull_case": invest_state.get("bull_history", "") if isinstance(invest_state, dict) else "",
            "bear_case": invest_state.get("bear_history", "") if isinstance(invest_state, dict) else "",
            "research_verdict": state.get("investment_plan", ""),
            "trader_plan": state.get("trader_investment_plan", ""),
            "risk_debate": risk_state.get("history", "") if isinstance(risk_state, dict) else "",
            "final_decision": state.get("final_trade_decision", ""),
            "final_signal": result.get("final_signal", "HOLD")
        }
        return response_data
        
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

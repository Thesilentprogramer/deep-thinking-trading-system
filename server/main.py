from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deep_thinking.graph import graph, config
from deep_thinking.state import AgentState, InvestDebateState, RiskDebateState
from deep_thinking.utils import SignalProcessor, Reflector, evaluate_ground_truth, Audit
from deep_thinking.llm import quick_thinking_llm, deep_thinking_llm
from deep_thinking.memory import bull_memory, bear_memory, trader_memory, risk_manager_memory
from deep_thinking import database as db
from deep_thinking.api_tracker import tracker as api_tracker
from langchain_core.messages import HumanMessage
from sse_starlette.sse import EventSourceResponse
import datetime
import uvicorn
import threading
import asyncio
import uuid
import json
import yfinance as yf
from stockstats import wrap as stockstats_wrap

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

# ──────────────────────────────────────────────────────────────
#  SSE Event Bus — in-memory queues keyed by run_id
# ──────────────────────────────────────────────────────────────
_event_queues: dict[str, asyncio.Queue] = {}
_event_loop: asyncio.AbstractEventLoop = None

@app.on_event("startup")
async def _capture_loop():
    global _event_loop
    _event_loop = asyncio.get_running_loop()

def _push_event(run_id: str, event_type: str, data: dict):
    """Thread-safe: push an SSE event from the graph thread into the async queue."""
    q = _event_queues.get(run_id)
    if q and _event_loop:
        _event_loop.call_soon_threadsafe(q.put_nowait, {"event": event_type, "data": data})


# ──────────────────────────────────────────────────────────────
#  Map graph node names → pipeline stage for the frontend
# ──────────────────────────────────────────────────────────────
NODE_TO_REPORT = {
    "Market Analyst":    ("market_report",    "Market Analyst"),
    "Social Analyst":    ("sentiment_report", "Social Analyst"),
    "News Analyst":      ("news_report",      "News Analyst"),
    "Fundamentals Analyst": ("fundamentals_report", "Fundamentals Analyst"),
    "Bull Researcher":   ("bull_case",        "Bull Researcher"),
    "Bear Researcher":   ("bear_case",        "Bear Researcher"),
    "Research Manager":  ("research_verdict", "Research Manager"),
    "Trader":            ("trader_plan",      "Trader"),
    "Risky Analyst":     ("risk_debate",      "Risky Analyst"),
    "Safe Analyst":      ("risk_debate",      "Safe Analyst"),
    "Neutral Analyst":   ("risk_debate",      "Neutral Analyst"),
    "Risk Judge":        ("final_decision",   "Risk Judge"),
}

# Frontend step IDs expected by ThinkingProcess.jsx
FRONTEND_STEPS = [
    "Market Analyst", "Social Analyst", "News Analyst",
    "Fundamentals Analyst", "Research Manager", "Trader", "Risk Judge"
]

def _node_to_frontend_step(node_name: str) -> str:
    """Return the frontend step name that should become active after this node completes."""
    mapping = {
        "Market Analyst": "Social Analyst",
        "Social Analyst": "News Analyst",
        "News Analyst": "Fundamentals Analyst",
        "Fundamentals Analyst": "Research Manager",
        "Bull Researcher": "Research Manager",
        "Bear Researcher": "Research Manager",
        "Research Manager": "Trader",
        "Trader": "Risk Judge",
        "Risky Analyst": "Risk Judge",
        "Safe Analyst": "Risk Judge",
        "Neutral Analyst": "Risk Judge",
        "Risk Judge": "completed",
    }
    return mapping.get(node_name, node_name)


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
        
        # ── Use graph.stream() instead of graph.invoke() ──
        print("  Running graph pipeline (streaming)...")
        final_state = {}
        for chunk in graph.stream(updated_state, config=graph_config):
            # chunk is a dict: { node_name: state_update }
            for node_name, state_update in chunk.items():
                final_state.update(state_update)
                print(f"  ✓ Node completed: {node_name}")

                # Build the report fragment for this node
                report_data = {}
                node_info = NODE_TO_REPORT.get(node_name)
                if node_info:
                    report_field, _ = node_info
                    if report_field == "bull_case":
                        invest_state = state_update.get("investment_debate_state", {})
                        if isinstance(invest_state, dict):
                            report_data["bull_case"] = invest_state.get("bull_history", "")
                    elif report_field == "bear_case":
                        invest_state = state_update.get("investment_debate_state", {})
                        if isinstance(invest_state, dict):
                            report_data["bear_case"] = invest_state.get("bear_history", "")
                    elif report_field == "risk_debate":
                        risk_state = state_update.get("risk_debate_state", {})
                        if isinstance(risk_state, dict):
                            report_data["risk_debate"] = risk_state.get("history", "")
                    elif report_field == "final_decision":
                        report_data["final_decision"] = state_update.get("final_trade_decision", "")
                    elif report_field == "trader_plan":
                        report_data["trader_plan"] = state_update.get("trader_investment_plan", "")
                    elif report_field == "research_verdict":
                        report_data["research_verdict"] = state_update.get("investment_plan", "")
                    else:
                        report_data[report_field] = state_update.get(report_field, "")

                completed_step = node_name if node_name in FRONTEND_STEPS else None
                next_step = _node_to_frontend_step(node_name)

                _push_event(run_id, "node_complete", {
                    "node": node_name,
                    "completed_step": completed_step,
                    "next_step": next_step,
                    "reports": report_data,
                })

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
            "research_debate": invest_state.get("history", "") if isinstance(invest_state, dict) else "",
            "research_verdict": final_state.get("investment_plan", ""),
            "trader_plan": final_state.get("trader_investment_plan", ""),
            "risk_debate": risk_state.get("history", "") if isinstance(risk_state, dict) else "",
            "final_decision": final_state.get("final_trade_decision", ""),
        }
        
        # Push final completion event
        _push_event(run_id, "analysis_complete", {
            "final_signal": final_signal,
            "reports": reports,
        })

        # Save to MongoDB
        db.complete_run(run_id, reports, final_signal)
        print(f"  ✅ Analysis complete for {ticker}! (saved to MongoDB)\n")
        
    except Exception as e:
        import traceback
        print(f"  ❌ Error in run {run_id}: {e}")
        traceback.print_exc()
        _push_event(run_id, "error", {"error": str(e)})
        db.fail_run(run_id, str(e))
    finally:
        # Clean up queue after a short delay (let SSE client drain)
        def _cleanup():
            import time
            time.sleep(5)
            _event_queues.pop(run_id, None)
        threading.Thread(target=_cleanup, daemon=True).start()


@app.get("/")
def read_root():
    return {"message": "Deep Thinking Trading System API is running. Use /docs to view the API documentation."}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_stock(request: AnalyzeRequest):
    run_id = str(uuid.uuid4())
    
    trade_date = request.date
    if not trade_date:
        trade_date = (datetime.date.today() - datetime.timedelta(days=2)).strftime('%Y-%m-%d')
    
    # Create SSE queue for this run
    _event_queues[run_id] = asyncio.Queue()

    # Create run in MongoDB
    db.create_run(run_id, request.ticker, trade_date)
    
    thread = threading.Thread(target=execute_graph_thread, args=(run_id, request.ticker, trade_date))
    thread.start()
    
    return {"run_id": run_id, "status": "started"}


# ──────────────────────────────────────────────────────────────
#  SSE Streaming endpoint
# ──────────────────────────────────────────────────────────────
@app.get("/api/stream/{run_id}")
async def stream_analysis(run_id: str, request: Request):
    """Server-Sent Events endpoint. Each event carries a node completion or final result."""
    q = _event_queues.get(run_id)

    # If no queue, check if the run already completed
    if not q:
        run = db.get_run(run_id)
        if run and run["status"] == "completed":
            # Send a single "already_complete" event with full data
            async def _completed_gen():
                reports = run.get("reports", {})
                yield {
                    "event": "analysis_complete",
                    "data": json.dumps({
                        "final_signal": run.get("final_signal", "HOLD"),
                        "reports": reports,
                    })
                }
            return EventSourceResponse(_completed_gen())
        if run and run["status"] == "failed":
            async def _failed_gen():
                yield {
                    "event": "error",
                    "data": json.dumps({"error": run.get("error", "Unknown error")})
                }
            return EventSourceResponse(_failed_gen())
        # Still might be starting up — create a temporary queue 
        q = asyncio.Queue()
        _event_queues[run_id] = q

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    evt = await asyncio.wait_for(q.get(), timeout=30)
                    yield {
                        "event": evt["event"],
                        "data": json.dumps(evt["data"])
                    }
                    if evt["event"] in ("analysis_complete", "error"):
                        break
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield {"event": "keepalive", "data": "{}"}
        except asyncio.CancelledError:
            pass

    return EventSourceResponse(event_generator())


# ──────────────────────────────────────────────────────────────
#  Existing Polling Endpoint (fallback)
# ──────────────────────────────────────────────────────────────
@app.get("/api/status/{run_id}")
async def get_status(run_id: str):
    run = db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run ID not found")
    
    if run["status"] == "completed":
        reports = run.get("reports", {})
        return {
            "status": "completed",
            "ticker": run.get("ticker", ""),
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
        return {"status": "failed", "ticker": run.get("ticker", ""), "error": run.get("error", "Unknown error")}
    
    return {"status": run["status"], "ticker": run.get("ticker", "")}

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


# ──────────────────────────────────────────────────────────────
#  Financial Metrics Endpoint (existing)
# ──────────────────────────────────────────────────────────────
@app.get("/api/metrics/{ticker}")
async def get_metrics(ticker: str):
    """Get key financial metrics for a stock from yfinance."""
    try:
        t = yf.Ticker(ticker.upper())
        info = t.info
        if not info or info.get("regularMarketPrice") is None:
            raise HTTPException(status_code=404, detail=f"No data found for {ticker}")

        def fmt_num(val):
            if val is None: return "N/A"
            if abs(val) >= 1e12: return f"${val/1e12:.2f}T"
            if abs(val) >= 1e9: return f"${val/1e9:.2f}B"
            if abs(val) >= 1e6: return f"${val/1e6:.2f}M"
            return f"${val:,.2f}"

        def fmt_pct(val):
            if val is None: return "N/A"
            return f"{val * 100:.2f}%"

        def fmt_ratio(val):
            if val is None: return "N/A"
            return f"{val:.2f}"

        # Compute ROIC
        roic_val = None
        try:
            ebit = info.get("ebitda")
            total_debt = info.get("totalDebt", 0) or 0
            equity = info.get("totalStockholderEquity") or (info.get("bookValue", 0) or 0) * (info.get("sharesOutstanding", 0) or 0)
            if ebit and (total_debt + equity) > 0:
                roic_val = ebit / (total_debt + equity)
        except Exception:
            pass

        return {
            "ticker": ticker.upper(),
            "company_name": info.get("shortName", ticker.upper()),
            "metrics": [
                {"label": "MARKET CAP", "value": fmt_num(info.get("marketCap"))},
                {"label": "ENT. VALUE", "value": fmt_num(info.get("enterpriseValue"))},
                {"label": "P/E RATIO", "value": fmt_ratio(info.get("trailingPE"))},
                {"label": "DIVIDEND YLD", "value": fmt_pct(info.get("dividendYield"))},
                {"label": "FREE CASH FLOW", "value": fmt_num(info.get("freeCashflow")), "highlight": True},
                {"label": "ROIC", "value": fmt_pct(roic_val)},
                {"label": "D/E RATIO", "value": fmt_ratio(info.get("debtToEquity"))},
                {"label": "EPS", "value": f"${fmt_ratio(info.get('trailingEps'))}"},
                {"label": "ROE", "value": fmt_pct(info.get("returnOnEquity"))},
                {"label": "EBIT MARGIN", "value": fmt_pct(info.get("operatingMargins"))},
                {"label": "GROSS MARGIN", "value": fmt_pct(info.get("grossMargins"))},
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────
#  Chart Data Endpoint (NEW)
# ──────────────────────────────────────────────────────────────
@app.get("/api/chart-data/{ticker}")
async def get_chart_data(ticker: str, period: str = "6mo"):
    """Return OHLCV + technical indicators formatted for lightweight-charts."""
    try:
        stock = yf.Ticker(ticker.upper())
        df = stock.history(period=period)
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data for {ticker}")

        # Flatten multi-level columns if present (yfinance sometimes returns MultiIndex)
        if hasattr(df.columns, 'levels'):
            df.columns = df.columns.get_level_values(0)

        # Calculate indicators via stockstats
        stock_df = stockstats_wrap(df.copy())
        try:
            _ = stock_df['close_20_sma']
            _ = stock_df['close_50_sma']
            _ = stock_df['rsi_14']
            _ = stock_df['boll_ub']
            _ = stock_df['boll_lb']
        except Exception:
            pass  # If indicators fail, we still return candles

        def to_ts(idx):
            return idx.strftime('%Y-%m-%d')

        candles = []
        volume = []
        sma20 = []
        sma50 = []
        rsi = []
        boll_upper = []
        boll_lower = []

        for i, row in df.iterrows():
            t = to_ts(i)
            o = float(row.get('Open', 0))
            h = float(row.get('High', 0))
            l = float(row.get('Low', 0))
            c = float(row.get('Close', 0))
            v = float(row.get('Volume', 0))

            candles.append({"time": t, "open": round(o, 2), "high": round(h, 2), "low": round(l, 2), "close": round(c, 2)})
            color = "rgba(74,222,128,0.4)" if c >= o else "rgba(248,113,113,0.4)"
            volume.append({"time": t, "value": v, "color": color})

            # Indicators from stockstats
            try:
                s20 = float(stock_df.loc[i, 'close_20_sma'])
                if not (s20 != s20):  # NaN check
                    sma20.append({"time": t, "value": round(s20, 2)})
            except Exception:
                pass
            try:
                s50 = float(stock_df.loc[i, 'close_50_sma'])
                if not (s50 != s50):
                    sma50.append({"time": t, "value": round(s50, 2)})
            except Exception:
                pass
            try:
                r = float(stock_df.loc[i, 'rsi_14'])
                if not (r != r):
                    rsi.append({"time": t, "value": round(r, 2)})
            except Exception:
                pass
            try:
                bu = float(stock_df.loc[i, 'boll_ub'])
                bl = float(stock_df.loc[i, 'boll_lb'])
                if not (bu != bu):
                    boll_upper.append({"time": t, "value": round(bu, 2)})
                if not (bl != bl):
                    boll_lower.append({"time": t, "value": round(bl, 2)})
            except Exception:
                pass

        return {
            "ticker": ticker.upper(),
            "candles": candles,
            "volume": volume,
            "sma20": sma20,
            "sma50": sma50,
            "rsi": rsi,
            "boll_upper": boll_upper,
            "boll_lower": boll_lower,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────
#  API Quota Endpoint (NEW)
# ──────────────────────────────────────────────────────────────
@app.get("/api/quota")
async def get_quota():
    """Return current API usage for all tracked providers."""
    return {"providers": api_tracker.get_usage()}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

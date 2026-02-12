from datetime import datetime, timedelta
import yfinance as yf
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

class SignalProcessor:
    # This class is responsible for parsing the final LLM output into a clean, machine-readable signal.
    def __init__(self, llm):
        self.llm = llm

    def process_signal(self, full_signal: str) -> str:
        messages = [
            ("system", "You are an assistant designed to extract the final investment decision: SELL, BUY, or HOLD from a financial report. Respond with only the single-word decision."),
            ("human", full_signal),
        ]
        result = self.llm.invoke(messages).content.strip().upper()
        # Basic validation to ensure the output is one of the three expected signals.
        if result in ["BUY", "SELL", "HOLD"]:
            return result
        return "ERROR_UNPARSABLE_SIGNAL"

class Reflector:
    # This class orchestrates the learning process for the agents.
    def __init__(self, llm):
        self.llm = llm
        self.reflection_prompt = """You are an expert financial analyst. Review the trading decision/analysis, the market context, and the financial outcome.
        - First, determine if the decision was correct or incorrect based on the outcome.
        - Analyze the most critical factors that led to the success or failure.
        - Finally, formulate a concise, one-sentence lesson or heuristic that can be used to improve future decisions in similar situations.
        
        Market Context & Analysis: {situation}
        Outcome (Profit/Loss): {returns_losses}"""

    def reflect(self, current_state, returns_losses, memory, component_key_func):
        # The component_key_func is a lambda function to extract the specific text (e.g., bull's debate history) to reflect on.
        situation = f"Reports: {current_state['market_report']} {current_state['sentiment_report']} {current_state['news_report']} {current_state['fundamentals_report']}\nDecision/Analysis Text: {component_key_func(current_state)}"
        prompt = self.reflection_prompt.format(situation=situation, returns_losses=returns_losses)
        result = self.llm.invoke(prompt).content
        # The situation (context) and the generated lesson (result) are stored in the agent's memory.
        memory.add_situations([(situation, result)])

def evaluate_ground_truth(ticker, trade_date, signal):
    try:
        start_date = datetime.strptime(trade_date, "%Y-%m-%d").date()
        # Check data for the next 8 calendar days to increase chance of getting 5 trading days
        end_date = start_date + timedelta(days=8)
        
        data = yf.download(ticker, start=start_date.isoformat(), end=end_date.isoformat(), progress=False)
        if len(data) < 5:
            return f"Insufficient data for ground truth evaluation. Found only {len(data)} days."
        
        # Ensure the first row corresponds to the trade_date or the next trading day
        first_trading_day_index = 0
        while data.index[first_trading_day_index].date() < start_date:
            first_trading_day_index += 1
            if first_trading_day_index >= len(data) - 5: return "Could not align trade date."
        
        open_price = data['Open'].iloc[first_trading_day_index]
        close_price_5_days_later = data['Close'].iloc[first_trading_day_index + 4]
        try:
          performance = ((close_price_5_days_later - open_price) / open_price) * 100
        except:
          # Handle series operations if yfinance returns series
           performance = ((close_price_5_days_later.iloc[0] - open_price.iloc[0]) / open_price.iloc[0]) * 100 if hasattr(close_price_5_days_later, 'iloc') else ((close_price_5_days_later - open_price) / open_price) * 100

        result = "INCORRECT DECISION"
        # Define success criteria: >1% for BUY, <-1% for SELL, within +/-1% for HOLD
        if (signal == "BUY" and performance > 1) or \
           (signal == "SELL" and performance < -1) or \
           (signal == "HOLD" and -1 <= performance <= 1):
            result = "CORRECT DECISION"
            
        return (
            f"----- Ground Truth Evaluation Report -----\n"
            f"Agent Signal: {signal} on {trade_date}\n"
            f"Opening Price on {data.index[first_trading_day_index].strftime('%Y-%m-%d')}: ${open_price:.2f}\n"
            f"Closing Price 5 days later ({data.index[first_trading_day_index+4].strftime('%Y-%m-%d')}): ${close_price_5_days_later:.2f}\n"
            f"Actual Market Performance: {performance:+.2f}%\n"
            f"Evaluation Result: {result}"
        )
    except Exception as e:
        return f"Ground truth evaluation failed: {e}"

class Audit(BaseModel):
    is_consistent: bool = Field(description="Whether the report is factually consistent with the data.")
    discrepancies: list[str] = Field(description="A list of any identified discrepancies.")
    justification: str = Field(description="A brief justification for the audit result.")

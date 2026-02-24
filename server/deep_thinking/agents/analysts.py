from langchain_core.messages import HumanMessage
from ..llm import quick_thinking_llm
from ..tools import toolkit
from ..state import AgentState

def _is_indian_ticker(ticker: str) -> str:
    """Detect if a ticker is an Indian stock. Returns 'NSE', 'BSE', or None."""
    ticker_upper = ticker.upper()
    if ticker_upper.endswith('.NS'):
        return 'NSE'
    if ticker_upper.endswith('.BO'):
        return 'BSE'
    return None

def create_analyst_node(llm, system_message, tool_functions, output_field):
    """
    Creates an analyst node that directly calls its tools and then asks the LLM
    to write a report based on the tool output. This avoids reliance on
    bind_tools / tool_calls which may not be supported by all LLM providers.
    """
    def analyst_node(state):
        ticker = state["company_of_interest"]
        trade_date = state["trade_date"]
        exchange = _is_indian_ticker(ticker)
        
        # Determine which tools to use based on exchange
        if exchange:
            active_tools = _get_indian_tools(tool_functions, output_field, exchange)
        else:
            active_tools = tool_functions
        
        # Step 1: Call all assigned tools to gather data
        tool_outputs = []
        for tool_fn in active_tools:
            try:
                # Each tool expects specific arguments. We use sensible defaults.
                if tool_fn.name == "get_yfinance_data":
                    result = tool_fn.invoke({"symbol": ticker, "start_date": _get_start_date(trade_date), "end_date": trade_date})
                elif tool_fn.name == "get_technical_indicators":
                    result = tool_fn.invoke({"symbol": ticker, "start_date": _get_start_date(trade_date), "end_date": trade_date})
                elif tool_fn.name == "get_finnhub_news":
                    result = tool_fn.invoke({"ticker": ticker, "start_date": _get_start_date(trade_date, days=7), "end_date": trade_date})
                elif tool_fn.name == "get_social_media_sentiment":
                    result = tool_fn.invoke({"ticker": ticker, "trade_date": trade_date})
                elif tool_fn.name == "get_fundamental_analysis":
                    result = tool_fn.invoke({"ticker": ticker, "trade_date": trade_date})
                elif tool_fn.name == "get_macroeconomic_news":
                    result = tool_fn.invoke({"trade_date": trade_date})
                elif tool_fn.name == "get_company_facts":
                    result = tool_fn.invoke({"ticker": ticker})
                elif tool_fn.name == "get_earnings_releases":
                    result = tool_fn.invoke({"ticker": ticker})
                elif tool_fn.name == "get_interest_rates":
                    result = tool_fn.invoke({})
                elif tool_fn.name == "get_key_financial_metrics":
                    result = tool_fn.invoke({"ticker": ticker})
                elif tool_fn.name == "get_indian_stock_quote":
                    result = tool_fn.invoke({"symbol": ticker})
                elif tool_fn.name == "get_indian_stock_daily":
                    result = tool_fn.invoke({"symbol": ticker})
                elif tool_fn.name == "get_indian_stock_overview":
                    result = tool_fn.invoke({"symbol": ticker})
                else:
                    result = tool_fn.invoke({"symbol": ticker})
                
                tool_outputs.append(f"--- {tool_fn.name} ---\n{result}")
            except Exception as e:
                tool_outputs.append(f"--- {tool_fn.name} ---\nError: {e}")

        all_data = "\n\n".join(tool_outputs)
        
        # Step 2: Ask the LLM to analyze the data and write a report
        exchange_note = ""
        if exchange == 'NSE':
            exchange_note = "\nNote: This is an NSE (National Stock Exchange of India) listed stock. Prices are in INR (₹)."
        elif exchange == 'BSE':
            exchange_note = "\nNote: This is a BSE (Bombay Stock Exchange) listed stock. Prices are in INR (₹)."

        prompt = f"""{system_message}

The company is: {ticker}
The date for analysis is: {trade_date}{exchange_note}

Here is the data gathered from your tools:
{all_data}

Based on this data, write a comprehensive analysis report with your findings, including a summary table."""

        print(f"  [{output_field}] Calling LLM for report...")
        response = llm.invoke(prompt)
        report = response.content
        print(f"  [{output_field}] Report generated ({len(report)} chars)")
        
        return {
            "messages": [HumanMessage(content=f"{output_field} completed")],
            output_field: report
        }

    return analyst_node


def _get_indian_tools(original_tools, output_field, exchange):
    """Replace yfinance-based tools with Alpha Vantage tools for Indian tickers."""
    if output_field == "market_report":
        # For market analysis: use Alpha Vantage quote + daily data
        return [toolkit.get_indian_stock_quote, toolkit.get_indian_stock_daily]
    
    elif output_field == "fundamentals_report":
        # For fundamentals: use Alpha Vantage overview + web search
        indian_tools = [toolkit.get_indian_stock_quote, toolkit.get_indian_stock_overview]
        # Keep web-based tools that work for any ticker
        for t in original_tools:
            if t.name in ['get_fundamental_analysis', 'get_company_facts']:
                indian_tools.append(t)
        return indian_tools
    
    # For sentiment and news — these are web-search based and work globally
    return original_tools


def _get_start_date(trade_date: str, days: int = 30) -> str:
    """Helper to calculate a start date N days before the trade_date."""
    from datetime import datetime, timedelta
    dt = datetime.strptime(trade_date, "%Y-%m-%d")
    start = dt - timedelta(days=days)
    return start.strftime("%Y-%m-%d")


# --- Analyst Definitions ---

market_analyst_system_message = "You are a trading assistant specialized in analyzing financial markets. Your role is to analyze a stock's price action, momentum, and volatility using the technical indicators and historical data provided."

social_analyst_system_message = "You are a social media analyst. Your job is to analyze public sentiment and social media discussions for a specific company and write a comprehensive sentiment report."

news_analyst_system_message = "You are a news researcher analyzing recent news and trends. Write a comprehensive report on the current state of the world relevant for trading and macroeconomics."

fundamentals_analyst_system_message = """You are a researcher analyzing fundamental information about a company.
You have access to structured financial metrics (Market Cap, P/E, D/E, EPS, ROE, ROIC, margins, FCF, etc.) as well as web-sourced analysis and company facts.
Write a comprehensive report on the company's financial health, valuation, profitability, and leverage.
Include a summary table of key metrics at the top of your report."""

# Create the nodes
market_analyst_node = create_analyst_node(
    quick_thinking_llm, market_analyst_system_message,
    [toolkit.get_yfinance_data, toolkit.get_technical_indicators],
    "market_report"
)

social_analyst_node = create_analyst_node(
    quick_thinking_llm, social_analyst_system_message,
    [toolkit.get_social_media_sentiment],
    "sentiment_report"
)

news_analyst_node = create_analyst_node(
    quick_thinking_llm, news_analyst_system_message,
    [toolkit.get_finnhub_news, toolkit.get_macroeconomic_news, toolkit.get_interest_rates],
    "news_report"
)

fundamentals_analyst_node = create_analyst_node(
    quick_thinking_llm, fundamentals_analyst_system_message,
    [toolkit.get_key_financial_metrics, toolkit.get_fundamental_analysis, toolkit.get_company_facts, toolkit.get_earnings_releases],
    "fundamentals_report"
)

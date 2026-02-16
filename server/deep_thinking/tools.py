import os
import requests as http_requests
import yfinance as yf
import finnhub
import pandas as pd
from typing import Annotated
from langchain_core.tools import tool
from langchain_tavily import TavilySearch
from stockstats import wrap as stockstats_wrap
from .config import config

# --- Tool Implementations ---

@tool
def get_yfinance_data(
    symbol: Annotated[str, "ticker symbol of the company"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """Retrieve the stock price data for a given ticker symbol from Yahoo Finance."""
    try:
        ticker = yf.Ticker(symbol.upper())
        data = ticker.history(start=start_date, end=end_date)
        if data.empty:
            return f"No data found for symbol '{symbol}' between {start_date} and {end_date}"
        return data.to_csv()
    except Exception as e:
        return f"Error fetching Yahoo Finance data: {e}"

@tool
def get_technical_indicators(
    symbol: Annotated[str, "ticker symbol of the company"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """Retrieve key technical indicators for a stock using stockstats library."""
    try:
        df = yf.download(symbol, start=start_date, end=end_date, progress=False)
        if df.empty:
            return "No data to calculate indicators."
        stock_df = stockstats_wrap(df)
        indicators = stock_df[['macd', 'rsi_14', 'boll', 'boll_ub', 'boll_lb', 'close_50_sma', 'close_200_sma']]
        return indicators.tail().to_csv() # Return last 5 days for brevity
    except Exception as e:
        return f"Error calculating stockstats indicators: {e}"

@tool
def get_finnhub_news(ticker: str, start_date: str, end_date: str) -> str:
    """Get company news from Finnhub within a date range."""
    try:
        finnhub_client = finnhub.Client(api_key=os.environ["FINNHUB_API_KEY"])
        news_list = finnhub_client.company_news(ticker, _from=start_date, to=end_date)
        news_items = []
        for news in news_list[:5]: # Limit to 5 results
            news_items.append(f"Headline: {news['headline']}\nSummary: {news['summary']}")
        return "\n\n".join(news_items) if news_items else "No Finnhub news found."
    except Exception as e:
        return f"Error fetching Finnhub news: {e}"

# The following three tools use Tavily for live, real-time web search.
tavily_tool = TavilySearch(max_results=3)

@tool
def get_social_media_sentiment(ticker: str, trade_date: str) -> str:
    """Performs a live web search for social media sentiment regarding a stock."""
    query = f"social media sentiment and discussions for {ticker} stock around {trade_date}"
    return tavily_tool.invoke({"query": query})

@tool
def get_fundamental_analysis(ticker: str, trade_date: str) -> str:
    """Performs a live web search for recent fundamental analysis of a stock."""
    query = f"fundamental analysis and key financial metrics for {ticker} stock published around {trade_date}"
    return tavily_tool.invoke({"query": query})

@tool
def get_macroeconomic_news(trade_date: str) -> str:
    """Performs a live web search for macroeconomic news relevant to the stock market."""
    query = f"macroeconomic news and market trends affecting the stock market on {trade_date}"
    return tavily_tool.invoke({"query": query})

# --- Financial Datasets API Tools ---
_FDS_BASE = "https://api.financialdatasets.ai"

def _fds_headers():
    return {"X-API-KEY": os.environ.get("FINANCIAL_DATASETS_API_KEY", "")}

@tool
def get_company_facts(ticker: str) -> str:
    """Get structured company facts (sector, industry, market cap, employees, etc.) from Financial Datasets API."""
    try:
        url = f"{_FDS_BASE}/company/facts?ticker={ticker.upper()}"
        resp = http_requests.get(url, headers=_fds_headers(), timeout=15)
        resp.raise_for_status()
        facts = resp.json().get("company_facts")
        if not facts:
            return f"No company facts found for {ticker}"
        # Format key facts into readable text
        lines = [f"{k}: {v}" for k, v in facts.items() if v is not None]
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching company facts: {e}"

@tool
def get_earnings_releases(ticker: str) -> str:
    """Get recent earnings press releases for a company from Financial Datasets API."""
    try:
        url = f"{_FDS_BASE}/earnings/press-releases/?ticker={ticker.upper()}"
        resp = http_requests.get(url, headers=_fds_headers(), timeout=15)
        if resp.status_code == 400:
            msg = resp.json().get("message", "Ticker not available for earnings press releases")
            return f"No earnings data: {msg}"
        resp.raise_for_status()
        releases = resp.json().get("press_releases", [])
        if not releases:
            return f"No earnings press releases found for {ticker}"
        # Return latest 3 releases
        items = []
        for r in releases[:3]:
            items.append(f"Date: {r.get('date', 'N/A')}\n{r.get('title', '')}\n{r.get('content', '')[:500]}")
        return "\n---\n".join(items)
    except Exception as e:
        return f"Error fetching earnings releases: {e}"

@tool
def get_interest_rates() -> str:
    """Get latest interest rates from all major central banks worldwide from Financial Datasets API."""
    try:
        url = f"{_FDS_BASE}/macro/interest-rates/snapshot"
        resp = http_requests.get(url, headers=_fds_headers(), timeout=15)
        resp.raise_for_status()
        rates = resp.json().get("interest_rates", [])
        if not rates:
            return "No interest rate data available"
        lines = []
        for r in rates:
            lines.append(f"{r.get('name', r.get('bank', 'Unknown'))}: {r.get('rate', 'N/A')}% (as of {r.get('date', 'N/A')})")
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching interest rates: {e}"

# --- Toolkit Class ---
class Toolkit:
    def __init__(self, config):
        self.config = config
        self.get_yfinance_data = get_yfinance_data
        self.get_technical_indicators = get_technical_indicators
        self.get_finnhub_news = get_finnhub_news
        self.get_social_media_sentiment = get_social_media_sentiment
        self.get_fundamental_analysis = get_fundamental_analysis
        self.get_macroeconomic_news = get_macroeconomic_news
        self.get_company_facts = get_company_facts
        self.get_earnings_releases = get_earnings_releases
        self.get_interest_rates = get_interest_rates

toolkit = Toolkit(config)
print(f"Toolkit class defined and instantiated with live data tools.")

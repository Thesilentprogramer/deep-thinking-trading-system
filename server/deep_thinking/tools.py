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

@tool
def get_key_financial_metrics(ticker: str) -> str:
    """Get key financial metrics for a stock: Market Cap, Enterprise Value, P/E Ratio,
    Dividend Yield, Free Cash Flow, ROIC, D/E Ratio, EPS, ROE, EBIT Margin, Gross Margin."""
    try:
        t = yf.Ticker(ticker.upper())
        info = t.info
        if not info or info.get("regularMarketPrice") is None:
            return f"No financial data found for {ticker}"

        def fmt_num(val, prefix="", suffix="", decimals=2):
            if val is None:
                return "N/A"
            if abs(val) >= 1e12:
                return f"{prefix}{val/1e12:.{decimals}f}T{suffix}"
            if abs(val) >= 1e9:
                return f"{prefix}{val/1e9:.{decimals}f}B{suffix}"
            if abs(val) >= 1e6:
                return f"{prefix}{val/1e6:.{decimals}f}M{suffix}"
            return f"{prefix}{val:,.{decimals}f}{suffix}"

        def fmt_pct(val):
            if val is None:
                return "N/A"
            return f"{val * 100:.2f}%"

        def fmt_ratio(val):
            if val is None:
                return "N/A"
            return f"{val:.2f}"

        # Compute ROIC: EBIT / (Total Debt + Total Equity)
        roic = None
        try:
            ebit = info.get("ebitda")  # approximation
            total_debt = info.get("totalDebt", 0) or 0
            total_equity = info.get("totalStockholderEquity") or info.get("bookValue", 0) * info.get("sharesOutstanding", 0)
            if ebit and (total_debt + total_equity) > 0:
                roic = ebit / (total_debt + total_equity)
        except Exception:
            pass

        metrics = [
            f"Company: {info.get('shortName', ticker.upper())}",
            f"Sector: {info.get('sector', 'N/A')} | Industry: {info.get('industry', 'N/A')}",
            f"",
            f"Market Cap:        {fmt_num(info.get('marketCap'), prefix='$')}",
            f"Enterprise Value:  {fmt_num(info.get('enterpriseValue'), prefix='$')}",
            f"P/E Ratio:         {fmt_ratio(info.get('trailingPE'))}",
            f"Forward P/E:       {fmt_ratio(info.get('forwardPE'))}",
            f"Dividend Yield:    {fmt_pct(info.get('dividendYield'))}",
            f"Free Cash Flow:    {fmt_num(info.get('freeCashflow'), prefix='$')}",
            f"ROIC:              {fmt_pct(roic)}",
            f"D/E Ratio:         {fmt_ratio(info.get('debtToEquity'))}",
            f"EPS (TTM):         ${fmt_ratio(info.get('trailingEps'))}",
            f"ROE:               {fmt_pct(info.get('returnOnEquity'))}",
            f"EBIT Margin:       {fmt_pct(info.get('operatingMargins'))}",
            f"Gross Margin:      {fmt_pct(info.get('grossMargins'))}",
            f"Revenue:           {fmt_num(info.get('totalRevenue'), prefix='$')}",
            f"Net Income:        {fmt_num(info.get('netIncomeToCommon'), prefix='$')}",
            f"52-Week High:      ${info.get('fiftyTwoWeekHigh', 'N/A')}",
            f"52-Week Low:       ${info.get('fiftyTwoWeekLow', 'N/A')}",
            f"Current Price:     ${info.get('currentPrice', info.get('regularMarketPrice', 'N/A'))}",
        ]
        return "\n".join(metrics)
    except Exception as e:
        return f"Error fetching financial metrics: {e}"

# --- Indian Stock Market Tools (Alpha Vantage API) ---

_AV_BASE = "https://www.alphavantage.co/query"

def _av_api_key():
    return os.environ.get("ALPHA_VANTAGE_API", "")

@tool
def get_indian_stock_quote(symbol: str) -> str:
    """Get real-time stock quote via Alpha Vantage. Works for Indian stocks (NSE/BSE) and global stocks.
    For NSE stocks use symbols like 'RELIANCE.BSE' or 'TCS.BSE'. For US stocks use 'AAPL'."""
    try:
        # Alpha Vantage uses .BSE suffix for Indian stocks
        clean_symbol = symbol.upper().strip()
        # Convert .NS to .BSE (Alpha Vantage convention) and .BO to .BSE
        if clean_symbol.endswith('.NS'):
            clean_symbol = clean_symbol.replace('.NS', '.BSE')
        elif clean_symbol.endswith('.BO'):
            clean_symbol = clean_symbol.replace('.BO', '.BSE')
        
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": clean_symbol,
            "apikey": _av_api_key(),
        }
        resp = http_requests.get(_AV_BASE, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        
        if "Error Message" in data:
            return f"Alpha Vantage error: {data['Error Message']}"
        if "Note" in data:
            return f"Alpha Vantage rate limit: {data['Note']}"
        
        quote = data.get("Global Quote", {})
        if not quote:
            return f"No quote data found for '{symbol}'. Try using the format RELIANCE.BSE for Indian stocks."
        
        lines = [
            f"Symbol: {quote.get('01. symbol', symbol)}",
            f"",
            f"Price: {quote.get('05. price', 'N/A')}",
            f"Open: {quote.get('02. open', 'N/A')}",
            f"High: {quote.get('03. high', 'N/A')}",
            f"Low: {quote.get('04. low', 'N/A')}",
            f"Previous Close: {quote.get('08. previous close', 'N/A')}",
            f"Change: {quote.get('09. change', 'N/A')} ({quote.get('10. change percent', 'N/A')})",
            f"Volume: {quote.get('06. volume', 'N/A')}",
            f"Latest Trading Day: {quote.get('07. latest trading day', 'N/A')}",
        ]
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching stock quote: {e}"

@tool
def get_indian_stock_daily(symbol: str) -> str:
    """Get daily historical price data via Alpha Vantage. Works for Indian (NSE/BSE) and global stocks.
    Returns the last 10 trading days of OHLCV data."""
    try:
        clean_symbol = symbol.upper().strip()
        if clean_symbol.endswith('.NS'):
            clean_symbol = clean_symbol.replace('.NS', '.BSE')
        elif clean_symbol.endswith('.BO'):
            clean_symbol = clean_symbol.replace('.BO', '.BSE')

        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": clean_symbol,
            "outputsize": "compact",
            "apikey": _av_api_key(),
        }
        resp = http_requests.get(_AV_BASE, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        
        if "Error Message" in data:
            return f"Alpha Vantage error: {data['Error Message']}"
        if "Note" in data:
            return f"Alpha Vantage rate limit: {data['Note']}"
        
        ts = data.get("Time Series (Daily)", {})
        if not ts:
            return f"No daily data found for '{symbol}'."
        
        # Get last 10 days
        dates = sorted(ts.keys(), reverse=True)[:10]
        lines = [f"Daily Historical Data for {clean_symbol} (Last {len(dates)} days):"]
        for date in dates:
            d = ts[date]
            lines.append(
                f"  {date}: Open={d.get('1. open','N/A')} "
                f"High={d.get('2. high','N/A')} "
                f"Low={d.get('3. low','N/A')} "
                f"Close={d.get('4. close','N/A')} "
                f"Volume={d.get('5. volume','N/A')}"
            )
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching daily data: {e}"

@tool
def get_indian_stock_overview(symbol: str) -> str:
    """Get company overview/fundamentals via Alpha Vantage. Includes Market Cap, P/E, EPS, 
    Dividend Yield, Revenue, Profit Margin, etc. Works for Indian (NSE/BSE) and global stocks."""
    try:
        clean_symbol = symbol.upper().strip()
        if clean_symbol.endswith('.NS'):
            clean_symbol = clean_symbol.replace('.NS', '.BSE')
        elif clean_symbol.endswith('.BO'):
            clean_symbol = clean_symbol.replace('.BO', '.BSE')

        params = {
            "function": "OVERVIEW",
            "symbol": clean_symbol,
            "apikey": _av_api_key(),
        }
        resp = http_requests.get(_AV_BASE, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        
        if "Error Message" in data:
            return f"Alpha Vantage error: {data['Error Message']}"
        if "Note" in data:
            return f"Alpha Vantage rate limit: {data['Note']}"
        if not data or data.get("Symbol") is None:
            return f"No overview data found for '{symbol}'."
        
        lines = [
            f"Company: {data.get('Name', 'N/A')}",
            f"Symbol: {data.get('Symbol', symbol)}",
            f"Exchange: {data.get('Exchange', 'N/A')}",
            f"Sector: {data.get('Sector', 'N/A')}",
            f"Industry: {data.get('Industry', 'N/A')}",
            f"",
            f"Market Cap: {data.get('MarketCapitalization', 'N/A')}",
            f"P/E Ratio: {data.get('PERatio', 'N/A')}",
            f"Forward P/E: {data.get('ForwardPE', 'N/A')}",
            f"PEG Ratio: {data.get('PEGRatio', 'N/A')}",
            f"EPS: {data.get('EPS', 'N/A')}",
            f"Dividend Yield: {data.get('DividendYield', 'N/A')}",
            f"Book Value: {data.get('BookValue', 'N/A')}",
            f"",
            f"Revenue (TTM): {data.get('RevenueTTM', 'N/A')}",
            f"Gross Profit (TTM): {data.get('GrossProfitTTM', 'N/A')}",
            f"EBITDA: {data.get('EBITDA', 'N/A')}",
            f"Profit Margin: {data.get('ProfitMargin', 'N/A')}",
            f"Operating Margin: {data.get('OperatingMarginTTM', 'N/A')}",
            f"ROE: {data.get('ReturnOnEquityTTM', 'N/A')}",
            f"ROA: {data.get('ReturnOnAssetsTTM', 'N/A')}",
            f"",
            f"52-Week High: {data.get('52WeekHigh', 'N/A')}",
            f"52-Week Low: {data.get('52WeekLow', 'N/A')}",
            f"50-Day MA: {data.get('50DayMovingAverage', 'N/A')}",
            f"200-Day MA: {data.get('200DayMovingAverage', 'N/A')}",
            f"Beta: {data.get('Beta', 'N/A')}",
            f"",
            f"Description: {(data.get('Description', 'N/A') or 'N/A')[:300]}...",
        ]
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching company overview: {e}"


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
        self.get_key_financial_metrics = get_key_financial_metrics
        # Indian / global market tools (Alpha Vantage)
        self.get_indian_stock_quote = get_indian_stock_quote
        self.get_indian_stock_daily = get_indian_stock_daily
        self.get_indian_stock_overview = get_indian_stock_overview

toolkit = Toolkit(config)
print(f"Toolkit class defined and instantiated with live data tools.")


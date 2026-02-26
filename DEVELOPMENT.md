# Deep Thinking Trading System — Development Notes

## What This App Really Does

The Deep Thinking Trading System is a **multi-agent AI pipeline** that mimics how an institutional investment team operates. Instead of a single AI giving you a stock recommendation, it runs **12 specialized agents** that each have a distinct role — just like a real trading desk.


### The Core Idea

When you enter a ticker (e.g. `AAPL`), the system kicks off this pipeline:

1. **Data Gathering** — Four analyst agents independently pull live data:
   - **Market Analyst**: Fetches price history, calculates technical indicators (RSI, MACD, Bollinger Bands, moving averages) from Yahoo Finance.
   - **Social Sentiment Analyst**: Searches the web for social buzz, Reddit/Twitter sentiment, and public opinion via Tavily.
   - **News Analyst**: Pulls breaking news and recent headlines from Finnhub.
   - **Fundamentals Analyst**: Gathers financial statements, P/E ratios, revenue, margins, balance sheet data, and 11 key financial metrics from Yahoo Finance.

2. **Adversarial Research Debate** — Two researchers with opposing biases debate the data:
   - **Bull Researcher**: Builds the strongest possible *buy* case.
   - **Bear Researcher**: Builds the strongest possible *sell/avoid* case.
   - **Research Manager**: Reads both arguments and synthesizes a balanced investment plan.

3. **Trade Execution** — The **Trader** agent takes the research plan and proposes a concrete, actionable trade (entry price, position size, stop-loss, take-profit).

4. **Risk Assessment** — Three risk analysts with different risk appetites debate the trade:
   - **Risky Analyst**: Argues for aggressive positioning.
   - **Safe Analyst**: Argues for capital preservation.
   - **Neutral Analyst**: Balances both perspectives.
   - **Risk Judge**: Makes the **final binding decision** — BUY, SELL, or HOLD — with full justification.

The entire process takes ~2-3 minutes and produces a comprehensive analysis with a clear verdict.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + Vite, Lucide icons, react-markdown, Three.js |
| **Backend** | FastAPI, LangGraph, LangChain |
| **Database** | MongoDB Atlas (persistent analysis history) |
| **LLM** | NVIDIA NIM API (`google/gemma-3-27b-it`) |
| **Data APIs** | Yahoo Finance, Finnhub, Tavily Search, Financial Datasets API, Alpha Vantage (Indian/global) |
| **UI Theme** | Biocipher (Syne + Inter, pure black, thin borders, 3D wireframe hero) |

---

## Recent Changes (Feb 27, 2026)

### SSE Real-Time Streaming
- **Server-Sent Events**: Replaced polling with a live SSE event bus (`asyncio.Queue`) on the backend at `/api/stream/{run_id}`.
- **Progressive UI**: The frontend now uses `EventSource` to render agent outputs progressively as they complete, eliminating the 2-3 minute wait for the final report.

### API Quota Tracking
- **Thread-safe counters**: Added `api_tracker.py` to monitor rate-limited APIs (Alpha Vantage, Finnhub, Tavily).
- **Quota Dashboard**: New `/api/quota` endpoint feeds a live `ApiQuota.jsx` sidebar widget showing remaining limits via progress bars.

### Interactive Price Charts
- **Lightweight Charts**: Integrated `lightweight-charts` for high-performance HTML5 canvas visualization.
- **Technical Overlays**: Added toggleable SMA 20/50, Bollinger Bands, and a synced RSI (14) sub-chart.
- **Timeline Selector**: Added 1M, 3M, 6M, 1Y toggles that dynamically refetch scoped data via query parameter `?period=X`.

### Confidence Scoring Gauge
- **Explicit Scoring**: Updated `Risk Judge` prompt to output a strict 0-100% confidence score based on agent consensus.
- **Visual Gauge**: Replaced plain text scores with a color-coded circular SVG gauge (Green/Yellow/Red) rendered directly under the Final Verdict signal badge.

---

## Previous Changes (Feb 25, 2026)

### Biocipher UI Redesign
- **Design System Overhaul**: Replaced Neobrutalism with Biocipher — pure black (`#060606`) background, `1px rgba(255,255,255,0.1)` borders, no shadows.
- **Typography**: Switched from Space Grotesk + JetBrains Mono → **Syne** (headings) + **Inter** (body) at font-weight 300-400.
- **3D Wireframe Hero**: Animated Three.js torus knot wireframe on the dashboard, matching the Biocipher reference design.
- **Pill Buttons**: All buttons now pill-shaped (`border-radius: 999px`) with transparent backgrounds and thin outlines.
- **Grid-Line Layout**: Feature cards and tables use thin-line dividers instead of chunky bordered blocks.
- **Signal Badges**: BUY/SELL/HOLD keep functional green/red/yellow colors but as subtle outline pills.
- **New Dependencies**: `three`, `@react-three/fiber`, `@react-three/drei` for 3D rendering.

### SELL Signal Bias Fix
- **Model Switch**: `stepfun-ai/step-3.5-flash` → `google/gemma-3-27b-it` — less conservative, better reasoning.
- **Debate Rounds Increased**: Bull/Bear rounds `1` → `3`, Risk rounds `1` → `2`. The bull case now has room to build a compelling argument.
- **Structured Scoring System**: All agents now use numeric 1-10 scoring:
  - Bull/Bear analysts provide CONVICTION/RISK scores.
  - Research Manager scores on Growth, Value, Momentum, Risk → average determines BUY/HOLD/SELL threshold.
  - Portfolio Manager uses Upside/Downside/Confidence scoring with explicit decision logic.
- **Trader Prompt Rewritten**: Now faithfully translates research team's recommendation instead of second-guessing.
- **SignalProcessor Improved**: 3-tier extraction — (1) regex score parsing → (2) keyword matching → (3) LLM with anti-SELL-bias prompt. Defaults to HOLD on ambiguity.

### Indian Stock Support (NSE/BSE)
- **Alpha Vantage API**: Replaced broken `stock-nse-india` and `bsedata` with Alpha Vantage REST API — works for both Indian and global stocks, no separate server needed.
- **New Tools**: `get_indian_stock_quote` (real-time quotes), `get_indian_stock_daily` (10-day OHLCV), `get_indian_stock_overview` (fundamentals: P/E, EPS, margins, etc.).
- **Auto-Detection**: Analysts auto-detect `.NS`/`.BO` tickers and route to Alpha Vantage tools. Symbols auto-convert to `.BSE` format.
- **Rate Limit**: Free tier allows 25 requests/day. Warning shown on frontend when Indian exchange is selected.

### Exchange Selector
- **30+ Global Exchanges**: Dropdown organized by region (Americas, Europe, Asia-Pacific, Middle East & Africa).
- **Auto-Suffix**: Selecting an exchange auto-appends the correct suffix (e.g., `.NS`, `.L`, `.HK`) to the ticker.
- **Ticker Preview**: Shows the full ticker with suffix before submitting.
- **Indian Exchange Warnings**: Orange warning banner when NSE or BSE is selected, with setup instructions.

---

## Previous Changes (Feb 17, 2026)

### Neobrutalism UI Redesign *(now replaced by Biocipher)*
- Complete `index.css` rewrite with neobrutalism design system
- Fonts: Space Grotesk + JetBrains Mono
- 2px solid borders + 4px flat offset shadows, dark navy backgrounds
- ⚠️ *Replaced by Biocipher redesign on Feb 25 — see above*

### Markdown Rendering Fix
- `MarketReport.jsx` now wraps the Final Verdict section in `<ReactMarkdown>` — was previously raw text
- All report accordion sections properly render bold, lists, tables, code blocks, and blockquotes
- Markdown content has explicit `color: var(--text-primary)` for visibility on dark backgrounds

### Financial Ratios Grid (Live Feed)
- New `/api/metrics/{ticker}` backend endpoint that returns 11 formatted metrics from yfinance
- New `FinancialRatios.jsx` component renders a grid-cell layout
- Metrics: Market Cap, Enterprise Value, P/E Ratio, Dividend Yield, Free Cash Flow, ROIC, D/E Ratio, EPS, ROE, EBIT Margin, Gross Margin

### MongoDB Persistent Storage
- Analysis history stored in MongoDB Atlas (replaced in-memory dict)
- `database.py` module for CRUD operations with SSL cert handling via `certifi`
- `/api/history` GET and `/api/history/{run_id}` DELETE endpoints
- `HistoryPage.jsx` rewritten to consume new API with signal badges, clickable rows, delete

### Enhanced Fundamental Analysis
- New `get_key_financial_metrics` tool in `tools.py` using yfinance `.info`
- Tool wired into the Fundamentals Analyst agent
- Updated analyst system prompt to emphasize structured metrics analysis

### Ticker State Fix
- `/api/status/{run_id}` now returns `ticker` in all response states
- `AnalysisPage.jsx` uses stateful ticker — updates from API response instead of defaulting to "STOCK"

---

## Issues We Faced During Development

### 1. LLM Provider Migration (Gemini → NVIDIA)
- **Problem**: The original codebase was built on Google Gemini. We switched to NVIDIA's API (which hosts various open-source models) for flexibility.
- **What broke**: Import paths, API initialization, embedding models — everything needed rewiring.
- **Fix**: Replaced `langchain-google-genai` with `langchain-openai` and configured it to point to NVIDIA's OpenAI-compatible endpoint (`https://integrate.api.nvidia.com/v1`).

### 2. `bind_tools` Incompatibility with NVIDIA Models
- **Problem**: The original code used LangChain's `bind_tools()` protocol, where the LLM decides which tools to call by emitting structured `tool_calls`. NVIDIA-hosted models (like `step-3.5-flash`) don't reliably support this protocol.
- **Symptom**: Analysts would run but return empty reports because the LLM never emitted valid tool calls.
- **Fix**: Completely rewrote all analyst nodes to **call tools directly** in Python code, then pass the raw data to the LLM for report generation. This makes the pipeline provider-agnostic.

### 3. Graph Routing Conflicts (Shared ToolNode)
- **Problem**: The LangGraph workflow had all four analysts sharing a single `ToolNode`. When multiple `add_edge()` calls pointed to the same node, later edges silently overwrote earlier ones, causing analysts to be skipped.
- **Fix**: Removed the shared `ToolNode` entirely. Each analyst now handles its own tool calls internally.

### 4. `kimi-k2.5` (Reasoning Model) Timeouts
- **Problem**: Research Manager and Risk Judge used `moonshotai/kimi-k2.5` which took 10+ minutes on large prompts.
- **Fix**: Switched to `stepfun-ai/step-3.5-flash`, which completes in seconds.

### 5. `KeyError: 'investment_debate_state'` on Status Endpoint
- **Problem**: `graph.stream()` only returned the last node's incremental output, not the full state.
- **Fix**: Switched to `graph.invoke()` and changed all bracket access to `.get()`.

### 6. SSL Certificate Errors (macOS)
- **Problem**: `pymongo` connection to MongoDB Atlas failed with `CERTIFICATE_VERIFY_FAILED` on macOS.
- **Fix**: Added `certifi` dependency and passed `tlsCAFile=certifi.where()` to `MongoClient`.

### 7. Deprecated `TavilySearchResults`
- **Status**: ⚠️ Still present. Should be updated to `from langchain_tavily import TavilySearch`.
from langchain_tavily import TavilySearch

---

## Current Known Issues

### 🟡 Alpha Vantage Rate Limits
Free tier allows 25 API requests/day. For heavy use of Indian stocks, consider upgrading to a paid Alpha Vantage plan.

### 🟡 SELL Bias — Needs Live Testing
The SELL bias fix has been implemented (scored prompts, model switch, increased rounds) but needs real-world testing to confirm the bias is resolved.

---

## Features We Can Add

### High Priority
- [ ] **Watchlist & Alerts** — Save a watchlist of tickers, schedule daily/weekly auto-analyses, and push results via email or browser notifications.
- [ ] **Backtesting Module** — Run the pipeline on historical dates and track accuracy. Builds trust and helps tune prompts.

### Medium Priority
- [ ] **Side-by-Side Comparison** — Analyze 2-3 tickers simultaneously with a comparison table (scores, valuation, risk). "RELIANCE vs TCS?"
- [ ] **PDF/Report Export** — One-click branded PDF export of the full analysis using `html2pdf` or `puppeteer`.
- [ ] **Sector Heatmap** — Auto-analyze top stocks in a sector and display a BUY/HOLD/SELL heatmap across the sector.
- [ ] **Custom Risk Profile** — Let users set risk tolerance (aggressive/moderate/conservative) before analysis, dynamically adjusting the Portfolio Manager's thresholds.
- [ ] **Custom Model Selection** — Let users pick which LLM model to use from a dropdown.
- [ ] **Email/Notification Alerts** — Scheduled analyses with results emailed or pushed via webhook.

### Nice to Have
- [ ] **Multi-Timeframe Analysis** — Analyze across daily, weekly, and monthly timeframes (short-term SELL but long-term BUY).
- [ ] **Options Strategy Suggestions** — Suggest specific options plays (covered calls, bull spreads) based on current options chain data.
- [ ] **Portfolio Mode** — Input existing holdings, analyze overall risk exposure, concentration, and suggest rebalancing.
- [ ] **Analysis Sharing** — Shareable public links for analyses ("share this report" with a unique URL).
- [ ] **Dark/Light Theme Toggle** — Currently locked to dark Biocipher. Some users prefer light mode for reading long reports.
- [ ] **Sector Comparison** — Compare target stock against sector peers automatically.
- [ ] **News Sentiment Timeline** — Visualize sentiment changes over the past week/month.
- [ ] **API Rate Limiting & Caching** — Cache API responses, add rate limiting.
- [ ] **Docker Deployment** — Containerize the full stack for one-command deployment.
- [ ] **Authentication** — Add user login for personal analysis history.

### Completed Features
- [x] **Real-Time Streaming (SSE)** — ✅ Live streaming of agent outputs via EventSource.
- [x] **Interactive Price Charts** — ✅ integrated `lightweight-charts` with MA, Bollinger Bands, RSI overlays, and Timeline Toggles.
- [x] **Confidence Scoring Dashboard** — ✅ Visual 0-100% consensus gauge on the Final Verdict.
- [x] **API Quota Tracking** — ✅ Live API limit tracking dashboard widget.
- [x] **UI Redesign** — ✅ Biocipher dark monochrome theme (Syne + Inter, Three.js wireframe hero, pill buttons).
- [x] **Report Markdown Rendering** — ✅ ReactMarkdown with remark-gfm for all report sections.
- [x] **Financial Ratios Grid** — ✅ Live metrics fetched from `/api/metrics/{ticker}`.
- [x] **Persistent History** — ✅ MongoDB Atlas with full CRUD.
- [x] **SELL Bias Fix** — ✅ Scored prompts, model switch to gemma-3-27b-it, increased debate rounds.
- [x] **Stock Exchange Selector** — ✅ 30+ exchanges with auto-suffix.
- [x] **Indian Stock API** — ✅ Alpha Vantage API for NSE/BSE stocks (no separate server needed).

---

*Last updated: February 27, 2026*

# Deep Thinking Trading System 🧠 📈 

A sophisticated multi-agent AI system for financial analysis, powered by **NVIDIA AI** and orchestrated with **LangGraph**. It features a modern, premium **React** frontend and a robust **FastAPI** backend.

> [!NOTE]
> This project is inspired by the research paper: [**TradingAgents: Multi-Agents LLM Financial Trading Framework**](https://arxiv.org/pdf/2412.20138).


![UI Preview](https://github.com/Thesilentprogramer/deep-thinking-trading-system/blob/main/ui-preview.png)
## 🚀 Features

- **Multi-Agent Architecture**: Separate agents for Market Data, News, Social Sentiment, Fundamentals, Research, Trading, and Risk Management.
- **Adversarial Debates**: Bull vs. Bear and Risk Management debates to stress-test investment ideas.
- **Live Data**: Real-time integration with Yahoo Finance, Finnhub, Tavily Search, Alpha Vantage, and Financial Datasets.
- **NVIDIA Powered**: Uses NVIDIA-hosted LLMs (via OpenAI-compatible API) for deep reasoning and fast data processing.
- **Premium UI**: Dark-themed, glassmorphic React dashboard to visualize the agent's thought process.

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, LangGraph, LangChain, NVIDIA AI API
- **Frontend**: React, Vite, Vanilla CSS (Premium Design), Lucide Icons
- **Data Sources**: Yahoo Finance, Finnhub, Tavily, Alpha Vantage, Financial Datasets

## 📦 Installation

### Prerequisites

- Python 3.10+
- Node.js 16+
- API Keys (copy `.env.example` to `.env` and fill in your keys):
    - `NVIDIA_API_KEY` — [NVIDIA Build](https://build.nvidia.com/) (required)
    - `TAVILY_API_KEY` — [Tavily](https://tavily.com/) (required for web search)
    - `FINNHUB_API_KEY` — [Finnhub](https://finnhub.io/) (required for financial news)
    - `ALPHA_VANTAGE_API` — [Alpha Vantage](https://www.alphavantage.co/support/#api-key) (required for Indian/global stock data)
    - `FINANCIAL_DATASETS_API_KEY` — [Financial Datasets](https://financialdatasets.ai/) (optional)

### 1. Backend Setup

1. Navigate to the root directory.
2. Create virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   source server/venv/bin/activate
   pip install -r server/requirements.txt
   python server/main.py
   ```
   Or directly:
   ```bash
   server/venv/bin/python server/main.py
   ```
   The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Development Server:
   ```bash
   npm run dev
   ```
   Access the UI at `http://localhost:5173`.

## 🏗️ Architecture

The system follows a Client-Server architecture:

1. **Client**: The React app sends a request with a Ticker Symbol to the FastAPI backend.
2. **Server**: Triggered by the API, `langgraph` initiates the workflow:
    - **Analyst Team**: Gathers raw data.
    - **Research Team**: Bull and Bear agents debate the data; Manager synthesizes a plan.
    - **Trader**: Proposes a trade execution.
    - **Risk Team**: Debates the safety of the trade; Portfolio Manager makes the final decision.
3. **Response**: The final decision and all intermediate reports are sent back to the Client for display.

## 📝 License

MIT

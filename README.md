# Deep Thinking Trading System 🧠 📈 

A sophisticated multi-agent AI system for financial analysis, powered by **Google Gemini** and orchestrated with **LangGraph**. It features a modern, premium **React** frontend and a robust **FastAPI** backend.

![UI Preview](https://via.placeholder.com/800x400?text=Deep+Thinking+Trading+System+UI+Preview)

## 🚀 Features

- **Multi-Agent Architecture**: Separate agents for Market Data, News, Social Sentiment, Fundamentals, Research, Trading, and Risk Management.
- **Adversarial Debates**: Bull vs. Bear and Risk Management debates to stress-test investment ideas.
- **Live Data**: Real-time integration with Yahoo Finance, Finnhub, and Tavily Search.
- **Gemini Powered**: Uses Google's Gemini Pro for deep reasoning and Gemini Flash for fast data processing.
- **Premium UI**: Dark-themed, glassmorphic React dashboard to visualize the agent's thought process.

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, LangGraph, LangChain, Google Generative AI
- **Frontend**: React, Vite, Vanilla CSS (Premium Design), Lucide Icons
- **Data Sources**: Yahoo Finance, Finnhub, Tavily

## 📦 Installation

### Prerequisites

- Python 3.10+
- Node.js 16+
- API Keys:
    - `GOOGLE_API_KEY` (Get from Google AI Studio)
    - `TAVILY_API_KEY` (For web search)
    - `FINNHUB_API_KEY` (For financial news)

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

import financedatabase as fd
ta.py is a Python package for dealing with financial technical analysis.



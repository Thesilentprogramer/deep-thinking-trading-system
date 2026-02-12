import { useState, useEffect } from 'react'
import { Search, Activity, Zap, Shield, TrendingUp, AlertCircle, Brain } from 'lucide-react'
import ThinkingProcess from './components/ThinkingProcess'
import MarketReport from './components/MarketReport'
import './index.css'

function App() {
  const [ticker, setTicker] = useState('')
  const [tradeDate, setTradeDate] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [runId, setRunId] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  // Mock tracking of steps for now since streaming isn't fully implemented in backend yet
  const [activeStep, setActiveStep] = useState(null)
  const [completedSteps, setCompletedSteps] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ticker) return

    setIsRunning(true)
    setResult(null)
    setError(null)
    setCompletedSteps([])
    setActiveStep('Market Analyst') // Start with first step

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, date: tradeDate || undefined }),
      })

      if (!response.ok) throw new Error('Failed to start analysis')

      const data = await response.json()
      setRunId(data.run_id)

      // Start polling for status
      pollStatus(data.run_id)

      // Simulate visual progress for the demo (since we aren't streaming yet)
      simulateProgress()

    } catch (err) {
      setError(err.message)
      setIsRunning(false)
    }
  }

  const simulateProgress = () => {
    const steps = [
      'Market Analyst', 'Social Analyst', 'News Analyst', 'Fundamentals Analyst',
      'Research Manager', 'Trader', 'Risk Judge'
    ];
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (!isRunning && currentIndex >= steps.length) {
        clearInterval(interval);
        return;
      }

      if (currentIndex < steps.length) {
        setCompletedSteps(prev => [...prev, steps[currentIndex]]);
        currentIndex++;
        if (currentIndex < steps.length) {
          setActiveStep(steps[currentIndex]);
        } else {
          setActiveStep('completed');
        }
      }
    }, 3000); // Advance step every 3 seconds visually
  }

  const pollStatus = async (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/status/${id}`)
        const data = await response.json()

        if (data.status === 'completed') {
          clearInterval(interval)
          setResult(data)
          setIsRunning(false)
          setActiveStep('completed')
          setCompletedSteps([
            'Market Analyst', 'Social Analyst', 'News Analyst', 'Fundamentals Analyst',
            'Research Manager', 'Trader', 'Risk Judge'
          ])
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setError(data.error || 'Analysis failed')
          setIsRunning(false)
        }
      } catch (err) {
        console.error("Polling error", err)
      }
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-20">
      {/* Header */}
      <header className="border-b border-glass-border bg-bg-secondary sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center shadow-lg shadow-accent-blue/20">
              <Activity className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                DeepThinking
              </h1>
              <p className="text-xs text-accent-blue font-medium tracking-wider">TRADING SYSTEM</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <a href="#" className="hover:text-white transition-colors">Dashboard</a>
            <a href="#" className="hover:text-white transition-colors">History</a>
            <a href="#" className="hover:text-white transition-colors">Settings</a>
          </nav>
        </div>
      </header>

      <main className="container mt-12">
        {/* Search Section */}
        <section className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            AI-Powered <span className="text-gradient">Financial Intelligence</span>
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            Orchestrate a team of autonomous AI agents to analyze markets, debate strategies, and manage risk in real-time.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="Enter Ticker (e.g., AAPL, NVDA)"
                className="input pl-12 h-14 bg-bg-card border-glass-border focus:ring-2 focus:ring-accent-blue/50 uppercase tracking-wide font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={isRunning || !ticker}
              className="btn h-14 px-8 text-lg shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40"
            >
              {isRunning ? 'Analyzing...' : 'Start Analysis'} <Zap size={20} className={isRunning ? 'animate-pulse' : ''} />
            </button>
          </form>
        </section>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200 animate-fadeIn">
            <AlertCircle />
            <p>{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        {(isRunning || result) && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn">
            {/* Left Sidebar: Thinking Process */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ThinkingProcess activeStep={activeStep} completedSteps={completedSteps} />

                <div className="card mt-6 bg-bg-secondary border-none">
                  <h4 className="font-semibold mb-4 text-text-secondary text-sm uppercase tracking-wider">System Status</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
                    <span className="text-sm">Engine Online</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse"></div>
                    <span className="text-sm">Live Data Feed Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content: Report */}
            <div className="lg:col-span-3">
              {result ? (
                <MarketReport data={result} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                  <div className="w-24 h-24 mb-6 relative">
                    <div className="absolute inset-0 border-4 border-accent-blue/20 rounded-full animate-pulse-ring"></div>
                    <div className="absolute inset-4 border-4 border-accent-purple/40 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain className="text-accent-blue animate-pulse" size={32} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Analyzing {ticker.toUpperCase()}...</h3>
                  <p className="text-text-secondary max-w-md">
                    Our multi-agent system is currently gathering real-time data, debating market conditions, and formulating a risk-adjusted strategy.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

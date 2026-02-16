import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Zap, TrendingUp, BarChart3, Shield, Brain } from 'lucide-react'

const features = [
    {
        icon: BarChart3,
        title: 'Technical Analysis',
        description: 'RSI, MACD, Bollinger Bands, and moving averages from live market data.',
        color: 'var(--accent-blue)',
    },
    {
        icon: Brain,
        title: 'AI Sentiment',
        description: 'Social media buzz, Reddit/Twitter sentiment, and public opinion analysis.',
        color: 'var(--accent-purple)',
    },
    {
        icon: TrendingUp,
        title: 'Fundamental Research',
        description: 'P/E ratios, revenue trends, margins, and balance sheet health checks.',
        color: 'var(--accent-green)',
    },
    {
        icon: Shield,
        title: 'Risk Assessment',
        description: 'Multi-agent risk debate with risky, safe, and neutral analysts.',
        color: 'var(--accent-red)',
    },
]

function DashboardPage() {
    const [ticker, setTicker] = useState('')
    const [tradeDate, setTradeDate] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!ticker) return

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch('http://localhost:8000/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: ticker.toUpperCase(), date: tradeDate || undefined }),
            })

            if (!response.ok) throw new Error('Failed to start analysis')

            const data = await response.json()
            // Navigate to the analysis page with the run ID
            navigate(`/analysis/${data.run_id}`, { state: { ticker: ticker.toUpperCase() } })
        } catch (err) {
            setError(err.message)
            setIsSubmitting(false)
        }
    }

    return (
        <div className="page-content">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-badge">
                    <Zap size={14} />
                    Multi-Agent AI Pipeline
                </div>
                <h2 className="hero-title">
                    AI-Powered <span className="text-gradient">Financial Intelligence</span>
                </h2>
                <p className="hero-subtitle">
                    Orchestrate a team of autonomous AI agents to analyze markets, debate strategies, and manage risk — all in real-time.
                </p>

                <form onSubmit={handleSubmit} className="search-form">
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            placeholder="Enter Ticker (e.g., AAPL, NVDA)"
                            className="input search-input"
                        />
                    </div>
                    <div className="date-input-wrapper">
                        <input
                            type="date"
                            value={tradeDate}
                            onChange={(e) => setTradeDate(e.target.value)}
                            className="input date-input"
                            placeholder="Trade date (optional)"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || !ticker}
                        className="btn btn-primary"
                    >
                        {isSubmitting ? 'Starting...' : 'Analyze'} <Zap size={18} className={isSubmitting ? 'animate-pulse' : ''} />
                    </button>
                </form>

                {error && (
                    <div className="error-toast">
                        <p>{error}</p>
                    </div>
                )}
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <h3 className="section-title">How It Works</h3>
                <div className="features-grid">
                    {features.map((feature) => (
                        <div key={feature.title} className="feature-card card">
                            <div className="feature-icon" style={{ background: `${feature.color}20`, color: feature.color }}>
                                <feature.icon size={24} />
                            </div>
                            <h4 className="feature-title">{feature.title}</h4>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pipeline Visual */}
            <section className="pipeline-section">
                <h3 className="section-title">The Analysis Pipeline</h3>
                <div className="pipeline-steps">
                    {['Data Gathering', 'Bull vs Bear Debate', 'Trade Proposal', 'Risk Assessment', 'Final Verdict'].map((step, i) => (
                        <div key={step} className="pipeline-step">
                            <div className="pipeline-number">{i + 1}</div>
                            <span className="pipeline-label">{step}</span>
                            {i < 4 && <div className="pipeline-connector" />}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default DashboardPage

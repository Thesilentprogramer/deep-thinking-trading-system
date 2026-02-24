import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Zap, TrendingUp, BarChart3, Shield, Brain, Globe, AlertTriangle } from 'lucide-react'

const EXCHANGES = [
    { label: '── Americas ──', value: '', disabled: true },
    { label: 'NYSE / NASDAQ (US)', value: '', suffix: '' },
    { label: 'TSX (Canada)', value: 'TSX', suffix: '.TO' },
    { label: 'BVMF (Brazil)', value: 'BVMF', suffix: '.SA' },
    { label: 'BMV (Mexico)', value: 'BMV', suffix: '.MX' },
    { label: '── Europe ──', value: '', disabled: true },
    { label: 'LSE (London)', value: 'LSE', suffix: '.L' },
    { label: 'XETRA (Germany)', value: 'XETRA', suffix: '.DE' },
    { label: 'Euronext Paris', value: 'EPA', suffix: '.PA' },
    { label: 'Euronext Amsterdam', value: 'AMS', suffix: '.AS' },
    { label: 'SIX (Switzerland)', value: 'SIX', suffix: '.SW' },
    { label: 'Borsa Italiana (Milan)', value: 'BIT', suffix: '.MI' },
    { label: 'BME (Madrid)', value: 'BME', suffix: '.MC' },
    { label: 'OMX Stockholm', value: 'STO', suffix: '.ST' },
    { label: 'Oslo Børs', value: 'OSE', suffix: '.OL' },
    { label: 'ISE (Ireland)', value: 'ISE', suffix: '.IR' },
    { label: '── Asia-Pacific ──', value: '', disabled: true },
    { label: 'NSE (India)', value: 'NSE', suffix: '.NS' },
    { label: 'BSE (India)', value: 'BSE', suffix: '.BO' },
    { label: 'HKEX (Hong Kong)', value: 'HKEX', suffix: '.HK' },
    { label: 'SSE (Shanghai)', value: 'SSE', suffix: '.SS' },
    { label: 'SZSE (Shenzhen)', value: 'SZSE', suffix: '.SZ' },
    { label: 'TSE (Tokyo)', value: 'TSE', suffix: '.T' },
    { label: 'KRX (Korea)', value: 'KRX', suffix: '.KS' },
    { label: 'KOSDAQ (Korea)', value: 'KOSDAQ', suffix: '.KQ' },
    { label: 'ASX (Australia)', value: 'ASX', suffix: '.AX' },
    { label: 'SGX (Singapore)', value: 'SGX', suffix: '.SI' },
    { label: 'TWSE (Taiwan)', value: 'TWSE', suffix: '.TW' },
    { label: 'IDX (Indonesia)', value: 'IDX', suffix: '.JK' },
    { label: 'SET (Thailand)', value: 'SET', suffix: '.BK' },
    { label: 'Bursa Malaysia', value: 'KLSE', suffix: '.KL' },
    { label: '── Middle East & Africa ──', value: '', disabled: true },
    { label: 'TASE (Israel)', value: 'TASE', suffix: '.TA' },
    { label: 'Tadawul (Saudi Arabia)', value: 'TADAWUL', suffix: '.SR' },
    { label: 'JSE (South Africa)', value: 'JSE', suffix: '.JO' },
]

const INDIAN_EXCHANGES = ['NSE', 'BSE']

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
    const [exchange, setExchange] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const selectedExchange = EXCHANGES.find(e => e.value === exchange && !e.disabled)
    const isIndianExchange = INDIAN_EXCHANGES.includes(exchange)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!ticker) return

        setIsSubmitting(true)
        setError(null)

        // Build the full ticker with exchange suffix
        let fullTicker = ticker.toUpperCase().trim()
        if (selectedExchange && selectedExchange.suffix) {
            // Don't double-append if user already typed the suffix
            if (!fullTicker.endsWith(selectedExchange.suffix.toUpperCase())) {
                fullTicker += selectedExchange.suffix
            }
        }

        try {
            const response = await fetch('http://localhost:8000/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: fullTicker, date: tradeDate || undefined }),
            })

            if (!response.ok) throw new Error('Failed to start analysis')

            const data = await response.json()
            // Navigate to the analysis page with the run ID
            navigate(`/analysis/${data.run_id}`, { state: { ticker: fullTicker } })
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
                    <div className="search-row">
                        <div className="search-input-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value)}
                                placeholder={isIndianExchange ? 'Enter Symbol (e.g., RELIANCE, TCS)' : 'Enter Ticker (e.g., AAPL, NVDA)'}
                                className="input search-input"
                            />
                        </div>
                        <div className="exchange-select-wrapper">
                            <Globe className="exchange-icon" size={18} />
                            <select
                                value={exchange}
                                onChange={(e) => setExchange(e.target.value)}
                                className="input exchange-select"
                            >
                                {EXCHANGES.map((ex, i) => (
                                    <option
                                        key={`${ex.value}-${i}`}
                                        value={ex.value}
                                        disabled={ex.disabled}
                                        className={ex.disabled ? 'exchange-group-label' : ''}
                                    >
                                        {ex.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="search-row">
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
                    </div>

                    {/* Exchange suffix preview */}
                    {selectedExchange && selectedExchange.suffix && ticker && (
                        <div className="ticker-preview">
                            Full ticker: <strong>{ticker.toUpperCase()}{selectedExchange.suffix}</strong>
                        </div>
                    )}
                </form>

                {/* Indian exchange warning */}
                {isIndianExchange && (
                    <div className="indian-exchange-warning">
                        <AlertTriangle size={16} />
                        <span>
                            {exchange === 'NSE'
                                ? 'Indian stock data uses Alpha Vantage API. Symbols are auto-converted (e.g., RELIANCE.NS → RELIANCE.BSE). Free tier: 25 requests/day.'
                                : 'Indian stock data uses Alpha Vantage API. Symbols are auto-converted (e.g., TCS.BO → TCS.BSE). Free tier: 25 requests/day.'}
                        </span>
                    </div>
                )}

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

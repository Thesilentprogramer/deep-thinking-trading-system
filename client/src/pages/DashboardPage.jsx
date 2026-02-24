import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { Search, Zap, TrendingUp, BarChart3, Shield, Brain, Globe, AlertTriangle, Activity } from 'lucide-react'
import * as THREE from 'three'

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

/* -- Three.js Wireframe Sphere -- */
function WireframeSphere() {
    const meshRef = useRef()
    const geometry = useMemo(() => new THREE.TorusKnotGeometry(1.2, 0.4, 128, 32), [])

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.15
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.1
        }
    })

    return (
        <mesh ref={meshRef} geometry={geometry}>
            <meshBasicMaterial wireframe color="#ffffff" opacity={0.15} transparent />
        </mesh>
    )
}

const features = [
    {
        icon: BarChart3,
        title: 'Technical Analysis',
        description: 'RSI, MACD, Bollinger Bands, and moving averages from live market data.',
    },
    {
        icon: Brain,
        title: 'AI Sentiment',
        description: 'Social media buzz, Reddit/Twitter sentiment, and public opinion analysis.',
    },
    {
        icon: TrendingUp,
        title: 'Fundamental Research',
        description: 'P/E ratios, revenue trends, margins, and balance sheet health checks.',
    },
    {
        icon: Shield,
        title: 'Risk Assessment',
        description: 'Multi-agent risk debate with risky, safe, and neutral analysts.',
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

        let fullTicker = ticker.toUpperCase().trim()
        if (selectedExchange && selectedExchange.suffix) {
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
            navigate(`/analysis/${data.run_id}`, { state: { ticker: fullTicker } })
        } catch (err) {
            setError(err.message)
            setIsSubmitting(false)
        }
    }

    return (
        <div className="page-content">
            {/* Hero Section — Grid Layout like Biocipher */}
            <div className="hero-grid">
                <div className="hero-left">
                    <div>
                        <h2 className="hero-title">
                            AI-Powered<br />
                            Financial<br />
                            <span className="text-gradient">Intelligence.</span>
                        </h2>
                    </div>

                    <div>
                        <form onSubmit={handleSubmit} className="search-form">
                            <div className="search-row">
                                <div className="search-input-wrapper">
                                    <Search className="search-icon" size={18} />
                                    <input
                                        type="text"
                                        value={ticker}
                                        onChange={(e) => setTicker(e.target.value)}
                                        placeholder={isIndianExchange ? 'Symbol (e.g., RELIANCE)' : 'Ticker (e.g., AAPL)'}
                                        className="input search-input"
                                    />
                                </div>
                                <div className="exchange-select-wrapper">
                                    <Globe className="exchange-icon" size={16} />
                                    <select
                                        value={exchange}
                                        onChange={(e) => setExchange(e.target.value)}
                                        className="input exchange-select"
                                    >
                                        {EXCHANGES.map((ex, i) => (
                                            <option key={`${ex.value}-${i}`} value={ex.value} disabled={ex.disabled}>
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
                                    />
                                </div>
                                <button type="submit" disabled={isSubmitting || !ticker} className="btn btn-primary">
                                    {isSubmitting ? 'Starting...' : 'Analyze'} →
                                </button>
                            </div>

                            {selectedExchange && selectedExchange.suffix && ticker && (
                                <div className="ticker-preview">
                                    Full ticker: <strong>{ticker.toUpperCase()}{selectedExchange.suffix}</strong>
                                </div>
                            )}
                        </form>

                        {isIndianExchange && (
                            <div className="indian-exchange-warning">
                                <AlertTriangle size={14} />
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
                    </div>
                </div>

                <div className="hero-right">
                    <Canvas camera={{ position: [0, 0, 4], fov: 50 }} style={{ width: '100%', height: '100%' }}>
                        <ambientLight intensity={0.5} />
                        <WireframeSphere />
                    </Canvas>
                </div>
            </div>

            {/* Tagline */}
            <div className="hero-tagline">
                <div className="tagline-icon">
                    <Activity size={16} />
                </div>
                <p className="tagline-text">
                    Orchestrate a team of autonomous AI agents to analyze markets, debate strategies, and manage risk — all in real-time.
                </p>
            </div>

            {/* Features Grid — thin-line dividers */}
            <section className="features-section">
                <div className="features-grid">
                    {features.map((feature) => (
                        <div key={feature.title} className="feature-card">
                            <div className="feature-icon">
                                <feature.icon size={18} />
                            </div>
                            <h4 className="feature-title">{feature.title}</h4>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pipeline Visual */}
            <section className="pipeline-section">
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

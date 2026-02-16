import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Brain } from 'lucide-react'
import ThinkingProcess from '../components/ThinkingProcess'
import MarketReport from '../components/MarketReport'

function AnalysisPage() {
    const { runId } = useParams()
    const location = useLocation()
    const ticker = location.state?.ticker || 'STOCK'

    const [isRunning, setIsRunning] = useState(true)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [activeStep, setActiveStep] = useState('Market Analyst')
    const [completedSteps, setCompletedSteps] = useState([])

    // Simulate visual progress
    useEffect(() => {
        const steps = [
            'Market Analyst', 'Social Analyst', 'News Analyst', 'Fundamentals Analyst',
            'Research Manager', 'Trader', 'Risk Judge'
        ]
        let currentIndex = 0

        const interval = setInterval(() => {
            if (result || error) {
                clearInterval(interval)
                return
            }

            if (currentIndex < steps.length) {
                setCompletedSteps(prev => [...prev, steps[currentIndex]])
                currentIndex++
                if (currentIndex < steps.length) {
                    setActiveStep(steps[currentIndex])
                } else {
                    setActiveStep('completed')
                }
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [result, error])

    // Poll for status
    useEffect(() => {
        if (!runId) return

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/status/${runId}`)
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
                console.error('Polling error', err)
            }
        }, 2000)

        return () => clearInterval(interval)
    }, [runId])

    return (
        <div className="page-content">
            {/* Back Navigation */}
            <div className="analysis-header">
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} />
                    <span>Back to Dashboard</span>
                </Link>
                <div className="analysis-ticker-badge">
                    Analyzing <strong>{ticker}</strong>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-toast">
                    <AlertCircle />
                    <p>{error}</p>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="analysis-grid">
                {/* Left Sidebar: Thinking Process */}
                <div className="analysis-sidebar">
                    <div className="sticky-sidebar">
                        <ThinkingProcess activeStep={activeStep} completedSteps={completedSteps} />

                        <div className="card status-card">
                            <h4 className="status-title">System Status</h4>
                            <div className="status-item">
                                <div className="status-dot status-dot-green" />
                                <span>Engine Online</span>
                            </div>
                            <div className="status-item">
                                <div className="status-dot status-dot-blue" />
                                <span>Live Data Feed Active</span>
                            </div>
                            <div className="status-item">
                                <div className={`status-dot ${isRunning ? 'status-dot-yellow' : 'status-dot-green'}`} />
                                <span>{isRunning ? 'Processing...' : 'Complete'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content: Report */}
                <div className="analysis-main">
                    {result ? (
                        <MarketReport data={result} />
                    ) : (
                        <div className="loading-state">
                            <div className="loading-spinner-container">
                                <div className="spinner-ring-outer" />
                                <div className="spinner-ring-inner" />
                                <div className="spinner-icon">
                                    <Brain className="text-accent-blue animate-pulse" size={32} />
                                </div>
                            </div>
                            <h3 className="loading-title">Analyzing {ticker}...</h3>
                            <p className="loading-subtitle">
                                Our multi-agent system is currently gathering real-time data, debating market conditions, and formulating a risk-adjusted strategy.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AnalysisPage

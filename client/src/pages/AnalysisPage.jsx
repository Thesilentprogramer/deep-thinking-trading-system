import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Brain } from 'lucide-react'
import ThinkingProcess from '../components/ThinkingProcess'
import MarketReport from '../components/MarketReport'
import ApiQuota from '../components/ApiQuota'

function AnalysisPage() {
    const { runId } = useParams()
    const location = useLocation()
    const [ticker, setTicker] = useState(location.state?.ticker || '')

    const [isRunning, setIsRunning] = useState(true)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [activeStep, setActiveStep] = useState('Market Analyst')
    const [completedSteps, setCompletedSteps] = useState([])

    // Partial reports accumulated during streaming
    const partialReports = useRef({})

    // SSE Streaming — replaces polling
    useEffect(() => {
        if (!runId) return

        const evtSource = new EventSource(`http://localhost:8000/api/stream/${runId}`)

        evtSource.addEventListener('node_complete', (e) => {
            try {
                const data = JSON.parse(e.data)

                // Update thinking process steps
                if (data.completed_step) {
                    setCompletedSteps(prev => {
                        if (prev.includes(data.completed_step)) return prev
                        return [...prev, data.completed_step]
                    })
                }
                if (data.next_step) {
                    setActiveStep(data.next_step)
                }

                // Accumulate partial reports for progressive reveal
                if (data.reports) {
                    partialReports.current = { ...partialReports.current, ...data.reports }
                    setResult(prev => ({
                        ...(prev || {}),
                        ...partialReports.current,
                        _streaming: true,
                    }))
                }
            } catch (err) {
                console.error('SSE parse error:', err)
            }
        })

        evtSource.addEventListener('analysis_complete', (e) => {
            try {
                const data = JSON.parse(e.data)
                setResult({
                    ...data.reports,
                    final_signal: data.final_signal,
                    _streaming: false,
                })
                setIsRunning(false)
                setActiveStep('completed')
                setCompletedSteps([
                    'Market Analyst', 'Social Analyst', 'News Analyst', 'Fundamentals Analyst',
                    'Research Manager', 'Trader', 'Risk Judge'
                ])
                if (data.reports?.ticker) setTicker(data.reports.ticker)
            } catch (err) {
                console.error('SSE complete parse error:', err)
            }
            evtSource.close()
        })

        evtSource.addEventListener('error', (e) => {
            // Check if this is an SSE data error event
            if (e.data) {
                try {
                    const data = JSON.parse(e.data)
                    setError(data.error || 'Analysis failed')
                } catch {
                    setError('Analysis failed')
                }
            }
            // EventSource auto-reconnects on network errors, but if we got a data error, close
            if (e.data) {
                setIsRunning(false)
                evtSource.close()
            }
        })

        // Handle EventSource connection errors (server down, etc.)
        evtSource.onerror = () => {
            // If we already have a completed result, don't show error
            if (result && !result._streaming) return
            // EventSource will auto-retry, but after many failures we fall back
        }

        return () => evtSource.close()
    }, [runId])

    // Fallback: if SSE doesn't connect within 10s, try polling
    useEffect(() => {
        if (!runId || result || error) return
        const timeout = setTimeout(async () => {
            if (result || error) return
            try {
                const res = await fetch(`http://localhost:8000/api/status/${runId}`)
                const data = await res.json()
                if (data.status === 'completed') {
                    setResult(data)
                    setIsRunning(false)
                    setActiveStep('completed')
                    setCompletedSteps([
                        'Market Analyst', 'Social Analyst', 'News Analyst', 'Fundamentals Analyst',
                        'Research Manager', 'Trader', 'Risk Judge'
                    ])
                    if (data.ticker) setTicker(data.ticker)
                } else if (data.status === 'failed') {
                    setError(data.error || 'Analysis failed')
                    setIsRunning(false)
                }
            } catch { /* ignore */ }
        }, 10000)
        return () => clearTimeout(timeout)
    }, [runId, result, error])

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

                        <ApiQuota />
                    </div>
                </div>

                {/* Right Content: Report */}
                <div className="analysis-main">
                    {result ? (
                        <MarketReport data={result} ticker={ticker} streaming={!!result._streaming} />
                    ) : (
                        <div className="loading-state">
                            <div className="loading-spinner-container">
                                <div className="spinner-ring-outer" />
                                <div className="spinner-ring-inner" />
                                <div className="spinner-icon">
                                    <Brain className="animate-pulse" size={24} style={{ opacity: 0.4 }} />
                                </div>
                            </div>
                            <h3 className="loading-title">Analyzing {ticker}...</h3>
                            <p className="loading-subtitle">
                                Multi-agent system is gathering real-time data, debating market conditions, and formulating a risk-adjusted strategy.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AnalysisPage

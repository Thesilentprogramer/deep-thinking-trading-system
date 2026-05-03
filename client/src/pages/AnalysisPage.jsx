import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Brain, Mail, Check, Loader2 } from 'lucide-react'
import ThinkingProcess from '../components/ThinkingProcess'
import MarketReport from '../components/MarketReport'
import ApiQuota from '../components/ApiQuota'
import { API_BASE_URL } from '../config'
import { api } from '../apiClient'

function AnalysisPage() {
    const { runId } = useParams()
    const location = useLocation()
    const [ticker, setTicker] = useState(location.state?.ticker || '')

    const [isRunning, setIsRunning] = useState(true)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [activeStep, setActiveStep] = useState('Market Analyst')
    const [completedSteps, setCompletedSteps] = useState([])
    
    const [isMailing, setIsMailing] = useState(false)
    const [mailSent, setMailSent] = useState(false)

    // Partial reports accumulated during streaming
    const partialReports = useRef({})

    // SSE Streaming
    useEffect(() => {
        if (!runId) return

        const evtSource = new EventSource(`${API_BASE_URL}/api/stream/${runId}`)

        evtSource.addEventListener('node_complete', (e) => {
            try {
                const data = JSON.parse(e.data)
                if (data.completed_step) {
                    setCompletedSteps(prev => {
                        if (prev.includes(data.completed_step)) return prev
                        return [...prev, data.completed_step]
                    })
                }
                if (data.next_step) setActiveStep(data.next_step)
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
            if (e.data) {
                try {
                    const data = JSON.parse(e.data)
                    setError(data.error || 'Analysis failed')
                } catch {
                    setError('Analysis failed')
                }
                setIsRunning(false)
                evtSource.close()
            }
        })

        return () => evtSource.close()
    }, [runId])

    // Fallback Polling
    useEffect(() => {
        if (!runId || result || error) return
        const timeout = setTimeout(async () => {
            if (result || error) return
            try {
                const data = await api.getStatus(runId)
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

    const handleMail = async () => {
        setIsMailing(true)
        try {
            await api.mailReport(runId)
            setMailSent(true)
            setTimeout(() => setMailSent(false), 3000)
        } catch (err) {
            console.error('Mail error:', err)
            alert('Failed to send email. Check your Notification Server.')
        } finally {
            setIsMailing(false)
        }
    }

    return (
        <div className="page-content">
            <div className="analysis-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} />
                    <span>Back to Dashboard</span>
                </Link>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="analysis-ticker-badge">
                        Analyzing <strong>{ticker}</strong>
                    </div>

                    {!isRunning && (
                        <button 
                            className={`mail-report-btn ${mailSent ? 'sent' : ''}`}
                            onClick={handleMail}
                            disabled={isMailing || mailSent}
                        >
                            {isMailing ? <Loader2 className="animate-spin" size={16} /> : 
                             mailSent ? <Check size={16} /> : <Mail size={16} />}
                            <span>{mailSent ? 'Sent!' : 'Email Report'}</span>
                        </button>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .mail-report-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 8px;
                    color: #60a5fa;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .mail-report-btn:hover:not(:disabled) {
                    background: rgba(59, 130, 246, 0.2);
                    border-color: #3b82f6;
                    transform: translateY(-1px);
                }
                .mail-report-btn.sent {
                    background: rgba(16, 185, 129, 0.1);
                    border-color: rgba(16, 185, 129, 0.3);
                    color: #34d399;
                }
                .mail-report-btn:disabled {
                    opacity: 0.7;
                    cursor: default;
                }
            `}} />

            {error && (
                <div className="error-toast">
                    <AlertCircle />
                    <p>{error}</p>
                </div>
            )}

            <div className="analysis-grid">
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

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Search, Trash2, TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw, Loader } from 'lucide-react'
import { API_BASE_URL } from '../config'

function HistoryPage() {
    const [runs, setRuns] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const fetchHistory = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE_URL}/api/history`)
            if (!res.ok) throw new Error('Failed to fetch history')
            const data = await res.json()
            setRuns(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [])

    const handleDelete = async (e, runId) => {
        e.stopPropagation()
        if (!window.confirm('Delete this analysis run?')) return

        try {
            const res = await fetch(`${API_BASE_URL}/api/history/${runId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            setRuns(prev => prev.filter(r => r.id !== runId))
        } catch (err) {
            setError(err.message)
        }
    }

    const handleRowClick = (run) => {
        if (run.status === 'completed') {
            navigate(`/analysis/${run.id}`, { state: { ticker: run.ticker } })
        }
    }

    const getSignalBadge = (signal) => {
        if (!signal) return null
        const upper = signal.toUpperCase()
        if (upper.includes('BUY')) {
            return (
                <span className="signal-badge signal-buy">
                    <TrendingUp size={12} /> BUY
                </span>
            )
        }
        if (upper.includes('SELL')) {
            return (
                <span className="signal-badge signal-sell">
                    <TrendingDown size={12} /> SELL
                </span>
            )
        }
        return (
            <span className="signal-badge signal-hold">
                <Minus size={12} /> HOLD
            </span>
        )
    }

    const getStatusBadge = (status) => {
        const base = {
            display: 'inline-flex',
            fontSize: '0.7rem',
            fontWeight: 400,
            padding: '0.15rem 0.5rem',
            borderRadius: '999px',
            letterSpacing: '0.05em',
            border: '1px solid',
        }
        if (status === 'completed') return <span style={{ ...base, color: 'var(--accent-green)', borderColor: 'rgba(74,222,128,0.25)' }}>Completed</span>
        if (status === 'running') return <span style={{ ...base, color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Running</span>
        if (status === 'failed') return <span style={{ ...base, color: 'var(--accent-red)', borderColor: 'rgba(248,113,113,0.25)' }}>Failed</span>
        return <span style={base}>{status}</span>
    }

    const formatDate = (isoStr) => {
        if (!isoStr) return '—'
        try {
            const d = new Date(isoStr)
            return d.toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            })
        } catch {
            return isoStr
        }
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h2 className="page-title">
                        <Clock size={20} />
                        Analysis History
                    </h2>
                    <p className="page-subtitle">Review and compare past analysis runs.</p>
                </div>
                <button className="btn-ghost" onClick={fetchHistory} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'animate-pulse' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="error-toast">
                    <AlertCircle size={16} />
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="loading-state" style={{ padding: '3rem 0' }}>
                    <Loader size={24} className="animate-pulse" style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p className="loading-subtitle">Loading history...</p>
                </div>
            ) : runs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Search size={40} />
                    </div>
                    <h3 className="empty-state-title">No Analysis History</h3>
                    <p className="empty-state-text">Run your first analysis from the Dashboard.</p>
                </div>
            ) : (
                <div className="history-table-wrapper">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Trade Date</th>
                                <th>Signal</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {runs.map(run => (
                                <tr
                                    key={run.id}
                                    onClick={() => handleRowClick(run)}
                                >
                                    <td><span className="history-ticker">{run.ticker}</span></td>
                                    <td>{run.trade_date}</td>
                                    <td>{getSignalBadge(run.final_signal)}</td>
                                    <td>{getStatusBadge(run.status)}</td>
                                    <td className="history-date">{formatDate(run.created_at)}</td>
                                    <td>
                                        <button
                                            className="history-delete-btn"
                                            onClick={(e) => handleDelete(e, run.id)}
                                            title="Delete run"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default HistoryPage

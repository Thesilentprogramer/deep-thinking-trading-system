import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Search, Trash2, TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw } from 'lucide-react'

function HistoryPage() {
    const [runs, setRuns] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const fetchHistory = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('http://localhost:8000/api/history')
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
            const res = await fetch(`http://localhost:8000/api/history/${runId}`, { method: 'DELETE' })
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
                    <TrendingUp size={14} /> BUY
                </span>
            )
        }
        if (upper.includes('SELL')) {
            return (
                <span className="signal-badge signal-sell">
                    <TrendingDown size={14} /> SELL
                </span>
            )
        }
        return (
            <span className="signal-badge signal-hold">
                <Minus size={14} /> HOLD
            </span>
        )
    }

    const getStatusBadge = (status) => {
        if (status === 'completed') return <span className="status-badge status-completed">Completed</span>
        if (status === 'running') return <span className="status-badge status-running">Running</span>
        if (status === 'failed') return <span className="status-badge status-failed">Failed</span>
        return <span className="status-badge">{status}</span>
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
                        <Clock size={28} className="text-accent-purple" />
                        Analysis History
                    </h2>
                    <p className="page-subtitle">Review and compare past analysis runs.</p>
                </div>
                <button className="btn btn-ghost" onClick={fetchHistory} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="error-toast">
                    <AlertCircle size={18} />
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="loading-state" style={{ padding: '3rem 0' }}>
                    <RefreshCw size={32} className="animate-spin text-accent-blue" />
                    <p className="loading-subtitle">Loading history...</p>
                </div>
            ) : runs.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">
                        <Search size={48} />
                    </div>
                    <h3>No Analysis History Yet</h3>
                    <p>Your completed analyses will appear here. Start by running an analysis from the Dashboard.</p>
                </div>
            ) : (
                <div className="history-table-container card">
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
                                    className={`history-row ${run.status === 'completed' ? 'history-row-clickable' : ''}`}
                                    onClick={() => handleRowClick(run)}
                                >
                                    <td className="ticker-cell">
                                        <span className="ticker-name">{run.ticker}</span>
                                    </td>
                                    <td>{run.trade_date}</td>
                                    <td>{getSignalBadge(run.final_signal)}</td>
                                    <td>{getStatusBadge(run.status)}</td>
                                    <td className="date-cell">{formatDate(run.created_at)}</td>
                                    <td>
                                        <button
                                            className="btn-icon btn-icon-danger"
                                            onClick={(e) => handleDelete(e, run.id)}
                                            title="Delete run"
                                        >
                                            <Trash2 size={16} />
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

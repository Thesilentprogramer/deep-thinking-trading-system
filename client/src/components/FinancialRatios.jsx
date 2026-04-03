import { useState, useEffect } from 'react'
import { Loader } from 'lucide-react'
import { API_BASE_URL } from '../config'

function FinancialRatios({ ticker }) {
    const [metrics, setMetrics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!ticker) return

        const fetchMetrics = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`${API_BASE_URL}/api/metrics/${ticker}`)
                if (!res.ok) throw new Error('Failed to fetch metrics')
                const data = await res.json()
                setMetrics(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchMetrics()
    }, [ticker])

    if (loading) {
        return (
            <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <Loader size={16} className="animate-pulse" style={{ display: 'inline-block', marginRight: '0.5rem', opacity: 0.4 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 300 }}>Loading metrics...</span>
            </div>
        )
    }

    if (error || !metrics) return null

    return (
        <div>
            <div className="ratios-grid">
                {metrics.metrics.map((m, i) => (
                    <div key={i} className="ratio-card">
                        <span className="ratio-label">{m.label}</span>
                        <span className={`ratio-value ${m.highlight ? 'highlight' : ''}`}>
                            {m.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FinancialRatios

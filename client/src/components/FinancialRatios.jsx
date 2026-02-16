import { useState, useEffect } from 'react'
import { BarChart3, RefreshCw } from 'lucide-react'

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
                const res = await fetch(`http://localhost:8000/api/metrics/${ticker}`)
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
            <div className="ratios-section">
                <h3 className="ratios-title">
                    <BarChart3 size={20} className="text-accent-green" />
                    Financial Ratios (Live Feed)
                </h3>
                <div className="ratios-loading">
                    <RefreshCw size={20} className="animate-spin text-accent-blue" />
                    <span>Loading metrics for {ticker}...</span>
                </div>
            </div>
        )
    }

    if (error || !metrics) return null

    return (
        <div className="ratios-section">
            <h3 className="ratios-title">
                <BarChart3 size={20} className="text-accent-green" />
                Financial Ratios (Live Feed)
            </h3>
            <div className="ratios-grid">
                {metrics.metrics.map((m, i) => (
                    <div key={i} className="ratio-card">
                        <span className="ratio-label">{m.label}</span>
                        <span className={`ratio-value ${m.highlight ? 'ratio-value-highlight' : ''}`}>
                            {m.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FinancialRatios

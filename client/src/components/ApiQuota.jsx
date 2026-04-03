import { useState, useEffect } from 'react';
import { Wifi, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../config';

function ApiQuota() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuota = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/quota`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setProviders(data.providers || []);
            } catch {
                setProviders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchQuota();
        // Refresh every 30s
        const interval = setInterval(fetchQuota, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading || providers.length === 0) return null;

    // Only show providers that have limits or usage > 0
    const visible = providers.filter(p => p.limit || p.used > 0);
    if (visible.length === 0) return null;

    return (
        <div className="card quota-card">
            <h4 className="quota-title">
                <Wifi size={13} />
                API Usage
            </h4>
            <div className="quota-list">
                {visible.map(p => {
                    const pct = p.limit ? (p.used / p.limit) * 100 : 0;
                    const colorClass = !p.limit ? 'quota-green'
                        : pct > 80 ? 'quota-red'
                            : pct > 50 ? 'quota-yellow'
                                : 'quota-green';

                    return (
                        <div key={p.provider} className="quota-item">
                            <div className="quota-item-header">
                                <span className="quota-label">{p.label}</span>
                                <span className="quota-count">
                                    {p.used}{p.limit ? ` / ${p.limit}` : ''} <span className="quota-window">/{p.window}</span>
                                </span>
                            </div>
                            {p.limit && (
                                <div className="quota-bar-bg">
                                    <div className={`quota-bar-fill ${colorClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                            )}
                            {p.limit && pct > 80 && (
                                <div className="quota-warning">
                                    <AlertTriangle size={10} />
                                    <span>{pct >= 100 ? 'Limit reached' : 'Approaching limit'}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ApiQuota;

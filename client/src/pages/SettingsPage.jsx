import { Settings, Cpu, Globe, Database } from 'lucide-react'

function SettingsPage() {
    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h2 className="page-title">
                        <Settings size={20} />
                        Settings
                    </h2>
                    <p className="page-subtitle">System configuration overview.</p>
                </div>
            </div>

            <div className="settings-grid">
                <div className="settings-card">
                    <Cpu size={16} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                    <div className="settings-label">LLM Model</div>
                    <div className="settings-value">google/gemma-3-27b-it</div>
                </div>

                <div className="settings-card">
                    <Globe size={16} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                    <div className="settings-label">API Provider</div>
                    <div className="settings-value">NVIDIA NIM</div>
                </div>

                <div className="settings-card">
                    <Database size={16} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                    <div className="settings-label">Data Sources</div>
                    <div className="settings-value">Yahoo Finance, Finnhub, Tavily, Alpha Vantage</div>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage

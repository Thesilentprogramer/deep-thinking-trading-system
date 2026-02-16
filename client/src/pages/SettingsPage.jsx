import { Settings, Cpu, Database, Globe } from 'lucide-react'

function SettingsPage() {
    return (
        <div className="page-content">
            <div className="page-header">
                <h2 className="page-title">
                    <Settings size={28} className="text-accent-blue" />
                    Settings
                </h2>
                <p className="page-subtitle">Configure your trading analysis preferences.</p>
            </div>

            <div className="settings-grid">
                <div className="card settings-card">
                    <div className="settings-card-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)' }}>
                        <Cpu size={24} />
                    </div>
                    <h3>LLM Model</h3>
                    <p className="settings-value">microsoft/phi-4-mini-flash-reasoning</p>
                    <span className="settings-badge">Active</span>
                </div>

                <div className="card settings-card">
                    <div className="settings-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>
                        <Globe size={24} />
                    </div>
                    <h3>API Provider</h3>
                    <p className="settings-value">NVIDIA NIM</p>
                    <span className="settings-badge">Connected</span>
                </div>

                <div className="card settings-card">
                    <div className="settings-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)' }}>
                        <Database size={24} />
                    </div>
                    <h3>Data Sources</h3>
                    <p className="settings-value">Yahoo Finance, Finnhub, Tavily, Financial Datasets</p>
                    <span className="settings-badge">Live</span>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage

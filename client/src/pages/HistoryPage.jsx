import { Clock, Search } from 'lucide-react'

function HistoryPage() {
    return (
        <div className="page-content">
            <div className="page-header">
                <h2 className="page-title">
                    <Clock size={28} className="text-accent-purple" />
                    Analysis History
                </h2>
                <p className="page-subtitle">Review and compare past analysis runs.</p>
            </div>

            <div className="empty-state card">
                <div className="empty-icon">
                    <Search size={48} />
                </div>
                <h3>No Analysis History Yet</h3>
                <p>Your completed analyses will appear here. Start by running an analysis from the Dashboard.</p>
            </div>
        </div>
    )
}

export default HistoryPage

import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { Activity, LayoutDashboard, Clock, Settings } from 'lucide-react'
import DashboardPage from './pages/DashboardPage'
import AnalysisPage from './pages/AnalysisPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import './index.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-bg-primary text-text-primary">
        {/* Header */}
        <header className="app-header">
          <div className="header-container">
            <div className="header-brand">
              <div className="brand-icon">
                <Activity className="text-white" size={20} />
              </div>
              <div>
                <h1 className="brand-title">DeepThinking</h1>
                <p className="brand-subtitle">TRADING SYSTEM</p>
              </div>
            </div>

            <nav className="header-nav">
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
                <LayoutDashboard size={16} />
                Dashboard
              </NavLink>
              <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
                <Clock size={16} />
                History
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
                <Settings size={16} />
                Settings
              </NavLink>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/analysis/:runId" element={<AnalysisPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

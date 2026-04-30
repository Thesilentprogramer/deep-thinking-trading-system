import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, Clock, Settings, Sun, Moon } from 'lucide-react'
import DashboardPage from './pages/DashboardPage'
import AnalysisPage from './pages/AnalysisPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import AuthPage from './pages/AuthPage'
import ProtectedRoute from './components/ProtectedRoute'
import UserMenu from './components/UserMenu'
import { ThemeProvider, useTheme } from './ThemeContext'
import { AuthProvider, useAuth } from './AuthContext'
import './index.css'

function AppInner() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-bg-primary text-text-primary">
        {/* Header — only show nav when authenticated */}
        {user && (
          <header className="app-header">
            <div className="header-container">
              <div className="header-brand">
                <div style={{ width: '40px', height: '40px', overflow: 'hidden', flexShrink: 0, borderRadius: '8px' }}>
                  <img
                    src="/logo.png"
                    alt="DeepThinking Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center center',
                      mixBlendMode: theme === 'dark' ? 'screen' : 'multiply',
                    }}
                  />
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

                {/* Theme Toggle */}
                <button
                  onClick={toggle}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '999px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    flexShrink: 0,
                    transition: 'border-color 0.2s ease, color 0.2s ease',
                  }}
                >
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                </button>

                {/* User Avatar + Menu */}
                <UserMenu />
              </nav>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={user ? 'app-main' : ''}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/analysis/:runId" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div className="auth-spinner" style={{ width: '28px', height: '28px', borderWidth: '2px' }} />
      </div>
    );
  }

  return user ? children : <Navigate to="/auth" replace />;
}

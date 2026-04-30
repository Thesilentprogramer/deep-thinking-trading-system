import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

// Google icon SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
      <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
      <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04"/>
      <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate('/');
      } else if (mode === 'signup') {
        await signUp(email, password, displayName);
        navigate('/');
      } else {
        await resetPassword(email);
        setSuccessMsg('Password reset email sent. Check your inbox.');
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    clearMessages();
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel — branding */}
      <div className="auth-left">
        <div className="auth-brand-mark">
          <img
            src="/logo.png"
            alt="DeepThinking Logo"
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'cover',
              borderRadius: '8px',
              mixBlendMode: theme === 'dark' ? 'screen' : 'multiply',
            }}
          />
          <div>
            <div className="auth-brand-name">DeepThinking</div>
            <div className="auth-brand-sub">TRADING SYSTEM</div>
          </div>
        </div>

        <div className="auth-left-content">
          <h2 className="auth-left-headline">
            Multi-Agent AI<br />
            <span className="text-gradient">Market Intelligence</span>
          </h2>
          <p className="auth-left-body">
            Sign in to access deep reasoning analysis powered by competing AI agents
            debating bullish and bearish positions on any global or Indian stock.
          </p>

          <div className="auth-features">
            {[
              { label: 'Bull & Bear Debate Engine', desc: 'AI agents argue both sides' },
              { label: 'Real-time Market Data', desc: 'NSE, BSE, NYSE & NASDAQ' },
              { label: 'Deep Thinking Process', desc: 'Full reasoning transparency' },
            ].map((f) => (
              <div className="auth-feature-item" key={f.label}>
                <div className="auth-feature-dot" />
                <div>
                  <div className="auth-feature-label">{f.label}</div>
                  <div className="auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-footer">
          Powered by NVIDIA NIM &amp; Multi-Agent Reasoning
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1 className="auth-form-title">
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </h1>
            <p className="auth-form-subtitle">
              {mode === 'signin'
                ? 'Sign in to your trading dashboard'
                : mode === 'signup'
                ? 'Start your AI-powered analysis journey'
                : "We'll send a reset link to your email"}
            </p>
          </div>

          {/* Google Sign-In */}
          {mode !== 'reset' && (
            <>
              <button
                id="google-signin-btn"
                onClick={handleGoogle}
                disabled={loading}
                className="auth-google-btn"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <div className="auth-divider">
                <span>or</span>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="auth-field">
                <label htmlFor="auth-name" className="auth-label">Full Name</label>
                <div className="auth-input-wrapper">
                  <User size={15} className="auth-input-icon" />
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input auth-input"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email" className="auth-label">Email</label>
              <div className="auth-input-wrapper">
                <Mail size={15} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input auth-input"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="auth-password" className="auth-label">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="auth-forgot-btn"
                      onClick={() => { setMode('reset'); clearMessages(); }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input auth-input auth-input-pw"
                    required
                    minLength={6}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="auth-error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="auth-success">
                <span>{successMsg}</span>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Mode switchers */}
          <div className="auth-switch">
            {mode === 'signin' && (
              <span>
                No account?{' '}
                <button className="auth-link" onClick={() => { setMode('signup'); clearMessages(); }}>
                  Sign up free
                </button>
              </span>
            )}
            {mode === 'signup' && (
              <span>
                Already have an account?{' '}
                <button className="auth-link" onClick={() => { setMode('signin'); clearMessages(); }}>
                  Sign in
                </button>
              </span>
            )}
            {mode === 'reset' && (
              <button className="auth-link" onClick={() => { setMode('signin'); clearMessages(); }}>
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential': 'Invalid credentials. Please check and try again.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

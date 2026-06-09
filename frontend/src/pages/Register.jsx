import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, googleLogin, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch {
      /* error in store */
    }
  };

  const handleGoogleSuccess = async (response) => {
    clearError();
    try {
      await googleLogin(response.credential);
      navigate('/dashboard');
    } catch {
      /* error in store */
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="floating-shape shape-1" />
        <div className="floating-shape shape-2" />
        <div className="floating-shape shape-3" />
      </div>

      <div className="auth-container animate-fade-up">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">⬡</div>
            <h1>Create account</h1>
            <p>Join KanbanFlow and collaborate in real-time</p>
          </div>

          {error && (
            <div className="auth-error animate-shake">
              {error}
            </div>
          )}

          {googleClientId && (
            <div className="google-btn-wrapper animate-fade-up delay-1">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => useAuthStore.setState({ error: 'Google sign-in failed' })}
                theme="filled_black"
                size="large"
                width="100%"
                text="signup_with"
              />
            </div>
          )}

          {googleClientId && (
            <div className="auth-divider animate-fade-up delay-2">
              <span>or register with email</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form animate-fade-up delay-3">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input auth-input"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input auth-input"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button className="btn btn-primary btn-full auth-submit" disabled={isLoading}>
              {isLoading ? (
                <span className="btn-loading">
                  <span className="spinner" /> Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="auth-footer animate-fade-up delay-4">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated) {
      navigate('/projects');
      return;
    }
  }, [navigate, isAuthenticated]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/auth/google');
      const data = await response.json();

      if (data.success) {
        // Redirect to Google OAuth
        window.location.href = data.auth_url;
      } else {
        setError('Failed to initiate login');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleTryDemo = () => {
    navigate('/editor');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          {/* Header */}
          <div className="login-header">
            <div className="logo">
              <div className="logo-icon">
                <span className="icon-text">⚡</span>
              </div>
              <div className="logo-text">
                <span className="brand-name">CodeRunner</span>
                <span className="brand-tagline">Execute code instantly</span>
              </div>
            </div>
          </div>

          {/* Main Login Form */}
          <div className="login-form">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">
              Sign in to access your coding workspace and execution history
            </p>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="auth-buttons">
              <button 
                className="google-login-btn"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <div className="google-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                {isLoading ? 'Signing in...' : 'Continue with Google'}
              </button>
            </div>

            <div className="divider">
              <span className="divider-text">or</span>
            </div>

            <button 
              className="demo-btn"
              onClick={handleTryDemo}
            >
              Try Demo Without Account
            </button>

            <div className="login-footer">
              <p className="footer-text">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
              <button className="back-btn" onClick={handleBackToHome}>
                ← Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="login-side">
          <div className="side-content">
            <h2 className="side-title">Start Coding in Seconds</h2>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div className="feature-text">
                  <h3>Lightning Fast</h3>
                  <p>Execute code in under 2 seconds</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <div className="feature-text">
                  <h3>Secure Sandbox</h3>
                  <p>Isolated Docker containers</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div className="feature-text">
                  <h3>Execution History</h3>
                  <p>Track your coding journey</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤝</span>
                <div className="feature-text">
                  <h3>Code Sharing</h3>
                  <p>Share and collaborate</p>
                </div>
              </div>
            </div>

            <div className="stats-preview">
              <div className="stat-item">
                <span className="stat-number">4</span>
                <span className="stat-label">Languages</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">1000+</span>
                <span className="stat-label">Developers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
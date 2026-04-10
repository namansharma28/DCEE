import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import Cookies from 'js-cookie';
import './AuthPage.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already authenticated
  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (token) {
      navigate('/editor');
    }
  }, [navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/google', {
        credential: credentialResponse.credential,
        action: isLogin ? 'login' : 'register'
      });

      if (response.data.success) {
        // Store auth token
        Cookies.set('auth_token', response.data.token, { expires: 7 });
        
        // Store user info
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect to editor or intended page
        const from = location.state?.from?.pathname || '/editor';
        navigate(from);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google authentication failed. Please try again.');
  };

  return (
    <GoogleOAuthProvider clientId="1060514807088-s981hfvqat6k8nf245id1lt12i6huaug.apps.googleusercontent.com">
      <div className="auth-page">
        <div className="auth-container">
          {/* Left Side - Branding */}
          <div className="auth-branding">
            <div className="brand-content">
              <div className="logo">
                <div className="logo-icon">
                  <span className="icon-text">⚡</span>
                </div>
                <span className="brand-name">CodeRunner</span>
              </div>
              
              <h1 className="brand-title">
                Execute Code
                <span className="accent-text"> Instantly</span>
              </h1>
              
              <p className="brand-description">
                Join thousands of developers who trust CodeRunner for secure, 
                fast code execution in multiple programming languages.
              </p>

              <div className="brand-features">
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span className="feature-text">Lightning fast execution</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <span className="feature-text">Secure sandbox environment</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🤝</span>
                  <span className="feature-text">Real-time collaboration</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span className="feature-text">Execution analytics</span>
                </div>
              </div>

              <div className="brand-stats">
                <div className="stat">
                  <span className="stat-number">10K+</span>
                  <span className="stat-label">Executions</span>
                </div>
                <div className="stat">
                  <span className="stat-number">4</span>
                  <span className="stat-label">Languages</span>
                </div>
                <div className="stat">
                  <span className="stat-number">&lt;2s</span>
                  <span className="stat-label">Avg Time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Authentication Form */}
          <div className="auth-form-container">
            <div className="auth-form">
              <div className="form-header">
                <h2 className="form-title">
                  {isLogin ? 'Welcome Back' : 'Get Started'}
                </h2>
                <p className="form-subtitle">
                  {isLogin 
                    ? 'Sign in to your CodeRunner account' 
                    : 'Create your CodeRunner account'
                  }
                </p>
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <div className="google-auth-section">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="filled_black"
                  size="large"
                  text={isLogin ? "signin_with" : "signup_with"}
                  shape="rectangular"
                  logo_alignment="left"
                  width="100%"
                />
              </div>

              <div className="auth-divider">
                <span className="divider-text">Secure authentication with Google</span>
              </div>

              <div className="auth-benefits">
                <h3 className="benefits-title">Why sign up?</h3>
                <ul className="benefits-list">
                  <li>
                    <span className="benefit-icon">💾</span>
                    Save and organize your code snippets
                  </li>
                  <li>
                    <span className="benefit-icon">📈</span>
                    Track execution history and performance
                  </li>
                  <li>
                    <span className="benefit-icon">🔗</span>
                    Share code with public links
                  </li>
                  <li>
                    <span className="benefit-icon">👥</span>
                    Collaborate with other developers
                  </li>
                  <li>
                    <span className="benefit-icon">🎯</span>
                    Access advanced features and analytics
                  </li>
                </ul>
              </div>

              <div className="form-footer">
                <p className="switch-mode">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    className="switch-button"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>

                <div className="continue-guest">
                  <button 
                    className="guest-button"
                    onClick={() => navigate('/editor')}
                  >
                    Continue as Guest
                  </button>
                </div>
              </div>

              <div className="legal-notice">
                <p>
                  By continuing, you agree to our{' '}
                  <a href="/terms" className="legal-link">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="legal-link">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Authenticating...</p>
            </div>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default AuthPage;
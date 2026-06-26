import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header>
      <div className="header-content">
        {/* Logo */}
        <button className="logo" onClick={() => navigate('/')}>
          <div className="logo-icon">⚡</div>
          <div className="logo-text">
            <span className="brand-name">CodeRunner</span>
            <span className="brand-tagline">Execute instantly</span>
          </div>
        </button>

        {/* Nav */}
        <nav className="nav-links">
          <button className="nav-link" onClick={() => navigate('/editor')}>
            Editor
          </button>
          {isAuthenticated && (
            <button className="nav-link" onClick={() => navigate('/projects')}>
              Projects
            </button>
          )}
        </nav>

        {/* Auth */}
        <div className="user-menu">
          {isAuthenticated && user ? (
            <>
              <div className="user-info" style={{ display: 'none' }}>
                <div className="logo-icon" style={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="user-name">{user.name}</span>
              </div>
              <span className="nav-link" style={{ color: '#666', fontSize: '0.8125rem' }}>
                {user.email}
              </span>
              <button
                className="btn btn-secondary btn-small"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary btn-small"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
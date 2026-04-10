import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code, FolderOpen, LogOut, User, Play } from 'lucide-react';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo" onClick={handleHome} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">
              <Play className="icon-play" size={24} />
            </div>
            <div className="logo-text">
              <span className="brand-name">CodeRunner</span>
              <span className="brand-tagline">Execute code instantly</span>
            </div>
          </div>
          
          <nav className="nav-links">
            <button 
              className="nav-link"
              onClick={() => navigate('/editor')}
            >
              <Code size={18} />
              Editor
            </button>
            
            {isAuthenticated && (
              <button 
                className="nav-link"
                onClick={() => navigate('/projects')}
              >
                <FolderOpen size={18} />
                Projects
              </button>
            )}
          </nav>
          
          <div className="header-right">
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-number">4</span>
                <span className="stat-label">Languages</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">&lt;2s</span>
                <span className="stat-label">Avg Time</span>
              </div>
            </div>

            <div className="auth-section">
              {isAuthenticated && user ? (
                <div className="user-menu">
                  <div className="user-info">
                    <User size={20} className="user-icon" />
                    <div className="user-details">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : (
                <button className="login-btn" onClick={handleLogin}>
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
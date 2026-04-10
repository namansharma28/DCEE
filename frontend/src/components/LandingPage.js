import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/editor');
    } else {
      navigate('/login');
    }
  };

  const handleTryDemo = () => {
    navigate('/editor');
  };

  const technologies = [
    { name: 'Python', icon: '🐍', color: '#3776ab' },
    { name: 'JavaScript', icon: '🟨', color: '#f7df1e' },
    { name: 'C++', icon: '⚡', color: '#00599c' },
    { name: 'Java', icon: '☕', color: '#ed8b00' },
  ];

  const features = [
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Execute code in seconds with our optimized Docker containers'
    },
    {
      icon: '🔒',
      title: 'Secure Sandbox',
      description: 'Isolated execution environment with resource limits and network restrictions'
    },
    {
      icon: '🌐',
      title: 'Real-time Results',
      description: 'Get instant feedback with WebSocket-powered live execution'
    },
    {
      icon: '🤝',
      title: 'Code Sharing',
      description: 'Share your code snippets and collaborate with the community'
    },
    {
      icon: '📊',
      title: 'Execution History',
      description: 'Track your coding journey with detailed execution analytics'
    },
    {
      icon: '🎨',
      title: 'Monaco Editor',
      description: 'VS Code-powered editor with syntax highlighting and IntelliSense'
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Execute Code
                <span className="accent-text"> Instantly</span>
              </h1>
              <p className="hero-subtitle">
                A modern, secure platform for running code in multiple programming languages. 
                Built for developers, educators, and coding enthusiasts.
              </p>
              
              <div className="hero-buttons">
                <button className="btn btn-primary" onClick={handleGetStarted}>
                  Get Started Free
                </button>
                <button className="btn btn-secondary" onClick={handleTryDemo}>
                  Try Demo
                </button>
              </div>

              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">4</span>
                  <span className="stat-label">Languages</span>
                </div>
                <div className="stat">
                  <span className="stat-number">&lt;2s</span>
                  <span className="stat-label">Avg Time</span>
                </div>
                <div className="stat">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Secure</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="code-window">
                <div className="window-header">
                  <div className="window-controls">
                    <span className="control red"></span>
                    <span className="control yellow"></span>
                    <span className="control green"></span>
                  </div>
                  <span className="window-title">CodeRunner</span>
                </div>
                <div className="code-content">
                  <div className="code-line">
                    <span className="line-number">1</span>
                    <span className="code-text">
                      <span className="keyword">def</span> <span className="function">fibonacci</span>(<span className="param">n</span>):
                    </span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">2</span>
                    <span className="code-text">
                      &nbsp;&nbsp;<span className="keyword">if</span> n &lt;= <span className="number">1</span>:
                    </span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">3</span>
                    <span className="code-text">
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">return</span> n
                    </span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">4</span>
                    <span className="code-text">
                      &nbsp;&nbsp;<span className="keyword">return</span> <span className="function">fibonacci</span>(n-<span className="number">1</span>) + <span className="function">fibonacci</span>(n-<span className="number">2</span>)
                    </span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">5</span>
                    <span className="code-text"></span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">6</span>
                    <span className="code-text">
                      <span className="function">print</span>(<span className="function">fibonacci</span>(<span className="number">10</span>))
                    </span>
                  </div>
                </div>
                <div className="output-section">
                  <div className="output-header">Output</div>
                  <div className="output-content">
                    <span className="output-text">55</span>
                    <span className="execution-time">⚡ 0.12s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="technologies">
        <div className="container">
          <h2 className="section-title">Supported Languages</h2>
          <div className="tech-grid">
            {technologies.map((tech, index) => (
              <div key={index} className="tech-card">
                <div className="tech-icon" style={{ color: tech.color }}>
                  {tech.icon}
                </div>
                <h3 className="tech-name">{tech.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose CodeRunner?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="architecture">
        <div className="container">
          <h2 className="section-title">Built for Scale</h2>
          <div className="arch-content">
            <div className="arch-text">
              <h3>Enterprise-Grade Architecture</h3>
              <ul className="arch-features">
                <li>🐳 Docker containerization for security</li>
                <li>⚡ Redis queue for high throughput</li>
                <li>🔄 Horizontal scaling support</li>
                <li>📊 Real-time monitoring</li>
                <li>🌐 WebSocket live updates</li>
                <li>☁️ Cloud-native deployment</li>
              </ul>
            </div>
            <div className="arch-diagram">
              <div className="arch-layer">
                <div className="arch-box frontend">React Frontend</div>
              </div>
              <div className="arch-arrow">↓</div>
              <div className="arch-layer">
                <div className="arch-box api">Go API Server</div>
              </div>
              <div className="arch-arrow">↓</div>
              <div className="arch-layer">
                <div className="arch-box queue">Redis Queue</div>
              </div>
              <div className="arch-arrow">↓</div>
              <div className="arch-layer">
                <div className="arch-box workers">Worker Pool</div>
              </div>
              <div className="arch-arrow">↓</div>
              <div className="arch-layer">
                <div className="arch-box docker">Docker Sandbox</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Coding?</h2>
            <p className="cta-subtitle">
              Join thousands of developers using CodeRunner for fast, secure code execution
            </p>
            <div className="cta-buttons">
              <button className="btn btn-primary large" onClick={handleGetStarted}>
                Sign Up with Google
              </button>
              <button className="btn btn-secondary large" onClick={handleTryDemo}>
                Try Without Account
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
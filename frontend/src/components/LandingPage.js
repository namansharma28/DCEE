import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/projects');
    } else {
      navigate('/login');
    }
  };

  const technologies = [
    { name: 'Python',     label: 'PY',  desc: 'Scripting & Data Science' },
    { name: 'JavaScript', label: 'JS',  desc: 'Web & Node.js Runtime' },
    { name: 'C++',        label: 'C++', desc: 'Systems Programming' },
    { name: 'Java',       label: 'JV',  desc: 'Enterprise & Android' },
  ];

  const features = [
    { label: '⚡', title: 'Lightning Fast',     desc: 'Execute code in seconds with optimised Docker containers and a zero-cold-start worker pool.' },
    { label: '🔒', title: 'Secure Sandbox',     desc: 'Every run is fully isolated — network blocked, resource-capped, auto-removed after execution.' },
    { label: '▶',  title: 'Real-time Results',  desc: 'Streaming output fed back over WebSocket so you see results the moment they are produced.' },
    { label: '⇧',  title: 'Code Sharing',       desc: 'One-click public share links — share a snippet or an entire multi-file project.' },
    { label: '📁', title: 'Project Manager',    desc: 'Organise files into folders, switch between them in a VS Code-style sidebar.' },
    { label: '⊞',  title: 'Monaco Editor',      desc: 'The same engine that powers VS Code — syntax highlighting, autocomplete, key bindings.' },
  ];

  return (
    <div className="landing-page">
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="hero-grid">

            {/* Left */}
            <div className="hero-left">
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                Modern Code Execution Platform
              </div>

              <h1 className="hero-title">
                Write Code.<br />
                <span className="hero-title-accent">Run Instantly.</span>
              </h1>

              <p className="hero-desc">
                A secure, multi-language execution environment for developers,
                educators, and learners. No setup. No installs. Just code.
              </p>

              <div className="hero-actions">
                <button className="hero-btn-primary" onClick={handleGetStarted}>
                  Get Started — it's free
                </button>
                <button className="hero-btn-secondary" onClick={() => navigate('/editor')}>
                  ▶ Try the Editor
                </button>
              </div>

              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-num">4</span>
                  <span className="hero-stat-label">Languages</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-num">&lt;2s</span>
                  <span className="hero-stat-label">Avg. Exec</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-num">100%</span>
                  <span className="hero-stat-label">Isolated</span>
                </div>
              </div>
            </div>

            {/* Right — terminal preview */}
            <div className="hero-right">
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="terminal-dot dot-red" />
                    <span className="terminal-dot dot-yellow" />
                    <span className="terminal-dot dot-green" />
                  </div>
                  <span className="terminal-filename">fibonacci.py</span>
                  <span className="terminal-lang">Python</span>
                </div>
                <div className="terminal-body">
                  <div className="code-line">
                    <span className="ln">1</span>
                    <span><span className="kw">def</span> <span className="fn">fibonacci</span>(<span className="param">n</span>):</span>
                  </div>
                  <div className="code-line">
                    <span className="ln">2</span>
                    <span>&nbsp;&nbsp;<span className="kw">if</span> n &lt;= <span className="num">1</span>:</span>
                  </div>
                  <div className="code-line">
                    <span className="ln">3</span>
                    <span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="kw">return</span> n</span>
                  </div>
                  <div className="code-line">
                    <span className="ln">4</span>
                    <span>&nbsp;&nbsp;<span className="kw">return</span> <span className="fn">fibonacci</span>(n-<span className="num">1</span>) + <span className="fn">fibonacci</span>(n-<span className="num">2</span>)</span>
                  </div>
                  <div className="code-line">
                    <span className="ln">5</span>
                    <span>&nbsp;</span>
                  </div>
                  <div className="code-line">
                    <span className="ln">6</span>
                    <span><span className="fn">print</span>(<span className="fn">fibonacci</span>(<span className="num">10</span>))</span>
                  </div>
                </div>
                <div className="terminal-output">
                  <div className="terminal-output-header">
                    <span className="output-status-dot" /> Output
                  </div>
                  <div className="terminal-output-body">
                    <span className="output-value">55</span>
                    <span className="output-time">⚡ 0.12s</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── LANGUAGES ────────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-title">Supported Languages</h2>
            <p className="section-subtitle">Write and execute code in your favourite language</p>
          </div>

          <div className="lang-grid">
            {technologies.map((t) => (
              <div key={t.name} className="lang-card">
                <div className="lang-label">{t.label}</div>
                <h3 className="lang-name">{t.name}</h3>
                <p className="lang-desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-title">Why CodeRunner?</h2>
            <p className="section-subtitle">Everything you need for fast, secure code execution</p>
          </div>

          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-card-icon">{f.label}</div>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="cta-block">
            <div className="cta-left">
              <h2 className="cta-title">Start coding in seconds.</h2>
              <p className="cta-desc">
                No credit card. No installs. Sign in with Google and your workspace is ready immediately.
              </p>
              <div className="cta-actions">
                <button className="hero-btn-primary" onClick={handleGetStarted}>
                  Sign in with Google
                </button>
                <button className="hero-btn-secondary" onClick={() => navigate('/editor')}>
                  ▶ Try without an account
                </button>
              </div>
            </div>
            <div className="cta-right">
              <div className="cta-stat-row">
                <div className="cta-stat">
                  <span className="cta-stat-num">4</span>
                  <span className="cta-stat-label">Languages supported</span>
                </div>
                <div className="cta-stat">
                  <span className="cta-stat-num">∞</span>
                  <span className="cta-stat-label">Projects you can create</span>
                </div>
                <div className="cta-stat">
                  <span className="cta-stat-num">0</span>
                  <span className="cta-stat-label">Installs required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="logo-icon">⚡</div>
              <span className="footer-brand-name">CodeRunner</span>
            </div>
            <p className="footer-copy">© 2026 CodeRunner. Built for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
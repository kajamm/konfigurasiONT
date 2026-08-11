export default function Header({ theme, toggleTheme }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <a href="#" className="brand-wrapper" onClick={(e) => e.preventDefault()}>
          <div className="brand-icon">
            <i className="fa-solid font-awesome fa-network-wired"></i>
          </div>
          <div className="brand-info">
            <span className="brand-title">ONT Config Studio</span>
            <span className="brand-subtitle">Provisioning Engine v2.5</span>
          </div>
        </a>

        <div className="header-actions">
          <button type="button" className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
          </button>
          <span className="status-badge">
            <span className="status-dot"></span>
            System Operational
          </span>
        </div>
      </div>
    </header>
  );
}

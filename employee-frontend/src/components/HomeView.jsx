export default function HomeView({ onNavigate }) {
  return (
    <div className="home-hero-content">
      {/* Badge */}
      <div className="home-badge">
        <span className="badge-dot" />
        <span>WORKSPHERE ENTERPRISE</span>
      </div>

      {/* Main Title — Workforce Management System */}
      <h1 className="home-main-title">
        <span className="title-line-1">Workforce</span>
        <span className="title-line-2">Management</span>
        <span className="title-line-3">
          <span className="title-gradient">System</span>
        </span>
      </h1>

      {/* CTA Buttons */}
      <div className="home-cta-group">
        <button
          className="home-cta-primary"
          onClick={() => onNavigate('register')}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Get Started Free
        </button>
        <button
          className="home-cta-secondary"
          onClick={() => onNavigate('login')}
        >
          Sign In
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

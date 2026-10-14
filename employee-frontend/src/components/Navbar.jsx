export default function Navbar({
  activeView,
  onNavigate,
  currentUser,
  onLogout,
}) {
  return (
    <nav className="navbar navbar-expand-lg worksphere-navbar px-3 px-lg-4">
      {/* Brand — LEFT side */}
      <div
        className="navbar-brand d-flex align-items-center gap-2 cursor-pointer"
        onClick={() => onNavigate('home')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('home')}
        style={{ cursor: 'pointer' }}
      >
        <div className="ws-brand-icon">
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="d-flex flex-column">
          <span className="ws-brand-name">WorkSphere</span>
          <span className="ws-brand-sub">Enterprise Hub</span>
        </div>
      </div>

      {/* Bootstrap Toggler for mobile */}
      <button
        className="navbar-toggler border-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#wsNavCollapse"
        aria-controls="wsNavCollapse"
        aria-expanded="false"
        aria-label="Toggle navigation"
        style={{ boxShadow: 'none' }}
      >
        <span className="navbar-toggler-icon" />
      </button>

      {/* Nav Links — RIGHT side */}
      <div className="collapse navbar-collapse" id="wsNavCollapse">
        <ul className="navbar-nav ms-auto align-items-center gap-1">

          <li className="nav-item">
            <button
              type="button"
              className={`nav-btn ${activeView === 'home' ? 'active' : ''}`}
              onClick={() => onNavigate('home')}
            >
              Home
            </button>
          </li>

          <li className="nav-item">
            <button
              type="button"
              className={`nav-btn ${activeView === 'register' ? 'active' : ''}`}
              onClick={() => onNavigate('register')}
            >
              Register
            </button>
          </li>

          {!currentUser && (
            <li className="nav-item">
              <button
                type="button"
                className={`nav-btn ${activeView === 'login' ? 'active' : ''}`}
                onClick={() => onNavigate('login')}
              >
                Login
              </button>
            </li>
          )}

          {currentUser?.role === 'manager' && (
            <li className="nav-item">
              <button
                type="button"
                className={`nav-btn ${activeView === 'employees' ? 'active' : ''}`}
                onClick={() => onNavigate('employees')}
              >
                Employees
              </button>
            </li>
          )}

          <li className="nav-item">
            <button
              type="button"
              className={`nav-btn nav-btn-highlight ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              Dashboard
            </button>
          </li>

          {currentUser && (
            <li className="nav-item ms-2">
              <div className="user-session-pill">
                {currentUser.user?.profilePic ? (
                  <img
                    src={currentUser.user.profilePic}
                    alt={currentUser.user.name}
                    className="user-nav-avatar"
                  />
                ) : (
                  <span className="user-badge-icon">
                    {currentUser.role === 'hr' ? '👑' : '👔'}
                  </span>
                )}
                <span className="user-name">
                  {currentUser.role === 'hr'
                    ? 'HR Admin'
                    : currentUser.user?.name || 'Manager'}
                </span>
                <button
                  type="button"
                  className="btn-logout"
                  onClick={onLogout}
                  title="Log out"
                >
                  Logout
                </button>
              </div>
            </li>
          )}

        </ul>
      </div>
    </nav>
  )
}

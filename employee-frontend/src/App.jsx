import { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import HomeView from './components/HomeView'
import ManagerRegister from './components/ManagerRegister'
import LoginView from './components/LoginView'
import HRDashboard from './components/HRDashboard'
import EmployeeManagementView from './components/EmployeeManagementView'
import Alert from './components/Alert'
import { getAllEmployees } from './api/employeeApi'
import { getErrorMessage } from './utils/errors'
import {
  getCurrentSession,
  getAllManagers,
  logout,
  loginWithGoogle,
} from './services/authService'

// Persistent space background that stays across all pages
function SpaceBg() {
  const stars = Array.from({ length: 130 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    delay: `${Math.random() * 5}s`,
    duration: `${2 + Math.random() * 4}s`,
    color: ['#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#ffffff'][
      Math.floor(Math.random() * 6)
    ],
  }))
  const orbs = [
    { color: '#8b5cf6', size: 320, top: '5%',  left: '3%',  delay: '0s',   dur: '8s'  },
    { color: '#2563eb', size: 220, top: '55%', left: '78%', delay: '2s',   dur: '10s' },
    { color: '#06b6d4', size: 260, top: '25%', left: '82%', delay: '1s',   dur: '12s' },
    { color: '#d946ef', size: 190, top: '70%', left: '12%', delay: '3s',   dur: '9s'  },
    { color: '#10b981', size: 160, top: '2%',  left: '48%', delay: '1.5s', dur: '11s' },
    { color: '#f59e0b', size: 140, top: '45%', left: '35%', delay: '4s',   dur: '13s' },
  ]
  return (
    <div className="global-space-bg" aria-hidden="true">
      {orbs.map((o, i) => (
        <div key={i} className="space-orb" style={{
          width: o.size, height: o.size,
          top: o.top, left: o.left,
          background: o.color,
          animationDelay: o.delay,
          animationDuration: o.dur,
        }} />
      ))}
      {stars.map((s) => (
        <div key={s.id} className="star-particle" style={{
          top: s.top, left: s.left,
          width: s.size, height: s.size,
          background: s.color,
          animationDelay: s.delay,
          animationDuration: s.duration,
          boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
        }} />
      ))}
      <div className="space-grid-overlay" />
    </div>
  )
}

export default function App() {
  const getInitialView = () => {
    const hash = window.location.hash.replace('#', '')
    if (['home', 'register', 'login', 'dashboard', 'employees'].includes(hash)) {
      return hash
    }
    return 'home'
  }

  const [activeView, setActiveView] = useState(getInitialView)
  const [currentUser, setCurrentUser] = useState(() => getCurrentSession())
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [notice, setNotice] = useState(null)
  const [prefillEmail, setPrefillEmail] = useState('')

  function handleNavigate(view) {
    setActiveView(view)
    window.location.hash = view
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace('#', '')
      if (['home', 'register', 'login', 'dashboard', 'employees'].includes(hash)) {
        setActiveView(hash)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (notice?.type !== 'success') return
    const timer = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(timer)
  }, [notice])

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    setListError('')
    try {
      const data = await getAllEmployees()
      setEmployees(data)
    } catch (err) {
      setListError(getErrorMessage(err, 'load employees from server'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEmployees() }, [loadEmployees])

  function handleRegisterSuccess(newManager, emailStatus) {
    let emailNote = ''
    if (emailStatus?.success) {
      emailNote = ` 📧 Welcome confirmation email sent to ${newManager.gmail}!`
    } else if (emailStatus?.isConfigMissing) {
      emailNote = ` (To deliver live Gmail messages, add your EmailJS Public Key & Template ID in .env).`
    }
    setNotice({
      type: 'success',
      text: `Manager "${newManager.name}" registered successfully!${emailNote} Please sign in with your credentials.`,
    })
    setPrefillEmail(newManager.gmail)
    handleNavigate('login')
  }

  function handleLoginSuccess(session, targetView) {
    setCurrentUser(session)
    setNotice({
      type: 'success',
      text: `Welcome back, ${
        session?.role === 'hr' ? 'HR Admin' : session?.user?.name || 'Manager'
      }!`,
    })
    if (targetView) {
      handleNavigate(targetView)
    } else if (session?.role === 'hr') {
      handleNavigate('dashboard')
    } else {
      handleNavigate('employees')
    }
  }

  async function handleGoogleLogin(profile) {
    try {
      const session = await loginWithGoogle(profile)
      setCurrentUser(session)
      setNotice({ type: 'success', text: `Welcome, ${profile?.name || 'Manager'}! Signed in with Google.` })
      handleNavigate('employees')
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Google Sign-In failed.' })
    }
  }

  function handleLogout() {
    logout()
    setCurrentUser(null)
    setNotice({ type: 'info', text: 'You have been logged out safely.' })
    handleNavigate('home')
  }

  return (
    <div className="app-root">
      {/* Persistent space cosmos background — shown on ALL pages */}
      <SpaceBg />

      {/* Navbar — glassmorphism on top of space bg */}
      <Navbar
        activeView={activeView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Page content — rendered above the space bg */}
      <div className="app-page-wrapper">
        {/* Global notices */}
        {notice && (
          <div className="global-notice-wrap">
            <Alert type={notice.type} onClose={() => setNotice(null)}>
              {notice.text}
            </Alert>
          </div>
        )}

        {/* View 1: Home */}
        {activeView === 'home' && (
          <HomeView onNavigate={handleNavigate} currentUser={currentUser} />
        )}

        {/* View 2: Register */}
        {activeView === 'register' && (
          <ManagerRegister
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => handleNavigate('login')}
            onGoogleLogin={handleGoogleLogin}
          />
        )}

        {/* View 3: Login */}
        {activeView === 'login' && (
          <LoginView
            prefillEmail={prefillEmail}
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => handleNavigate('register')}
            onGoogleLogin={handleGoogleLogin}
          />
        )}

        {/* View 4: HR Dashboard */}
        {activeView === 'dashboard' && (
          <HRDashboard
            currentUser={currentUser}
            employees={employees}
            loadingEmployees={loading}
            onRefreshEmployees={loadEmployees}
            onHrLoginSuccess={(session) => handleLoginSuccess(session, 'dashboard')}
          />
        )}

        {/* View 5: Employee Management */}
        {activeView === 'employees' && (
          <EmployeeManagementView
            currentUser={currentUser}
            employees={employees}
            loading={loading}
            listError={listError}
            loadEmployees={loadEmployees}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </div>
  )
}

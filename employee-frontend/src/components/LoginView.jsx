import { useState, useEffect } from 'react'
import { loginManager, getAllManagers } from '../services/authService'
import { DEFAULT_AVATAR_SVG } from '../services/cloudinaryService'
import Alert from './Alert'
import GoogleAuthModal from './GoogleAuthModal'

export default function LoginView({
  prefillEmail = '',
  onLoginSuccess,
  onSwitchToRegister,
  onGoogleLogin,
}) {
  const [managerForm, setManagerForm] = useState({
    emailOrName: prefillEmail || '',
    password: '',
  })

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false)
  const [managerList, setManagerList] = useState([])
  const [displayPhoto, setDisplayPhoto] = useState(() => {
    try {
      const cached = localStorage.getItem('last_registered_manager')
      if (cached) {
        const parsed = JSON.parse(cached)
        return parsed.profilePic || null
      }
    } catch {}
    return null
  })

  // Fetch all registered managers to match profilePic
  useEffect(() => {
    let isMounted = true
    getAllManagers().then((list) => {
      if (!isMounted) return
      setManagerList(list)
      const query = (managerForm.emailOrName || prefillEmail || '').trim().toLowerCase()
      if (query) {
        const matched = list.find(
          (m) =>
            m.gmail?.toLowerCase() === query ||
            m.name?.toLowerCase() === query
        )
        if (matched?.profilePic) {
          setDisplayPhoto(matched.profilePic)
          return
        }
      }
      // If no query yet, show the most recently registered manager's profile photo
      if (!displayPhoto && list.length > 0) {
        const latestWithPic = [...list].reverse().find((m) => m.profilePic)
        if (latestWithPic?.profilePic) {
          setDisplayPhoto(latestWithPic.profilePic)
        }
      }
    })
    return () => {
      isMounted = false
    }
  }, [prefillEmail])

  // Update photo dynamically when user enters or edits emailOrName
  useEffect(() => {
    const query = managerForm.emailOrName.trim().toLowerCase()
    if (!query) {
      try {
        const cached = localStorage.getItem('last_registered_manager')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.profilePic) {
            setDisplayPhoto(parsed.profilePic)
            return
          }
        }
      } catch {}
      const latest = [...managerList].reverse().find((m) => m.profilePic)
      if (latest?.profilePic) {
        setDisplayPhoto(latest.profilePic)
      }
      return
    }

    const matched = managerList.find(
      (m) =>
        m.gmail?.toLowerCase() === query ||
        m.name?.toLowerCase() === query
    )
    if (matched?.profilePic) {
      setDisplayPhoto(matched.profilePic)
    }
  }, [managerForm.emailOrName, managerList])

  useEffect(() => {
    if (prefillEmail) {
      setManagerForm((prev) => ({ ...prev, emailOrName: prefillEmail }))
    }
  }, [prefillEmail])

  async function handleManagerSubmit(e) {
    e.preventDefault()
    setError('')

    if (!managerForm.emailOrName.trim()) {
      setError('Please enter your manager email or name.')
      return
    }
    if (!managerForm.password) {
      setError('Please enter your password.')
      return
    }

    setSubmitting(true)
    try {
      const session = await loginManager(managerForm.emailOrName, managerForm.password)
      if (onLoginSuccess) {
        onLoginSuccess(session, 'employees')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleGoogleAccountSelected(profile) {
    setIsGoogleModalOpen(false)
    if (onGoogleLogin) {
      onGoogleLogin(profile)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="login-avatar-wrapper">
            <div className="login-avatar-circle">
              <img
                src={displayPhoto || DEFAULT_AVATAR_SVG}
                alt="Manager Profile"
                className="login-avatar-img"
              />
            </div>
          </div>
          <h2>Manager Login</h2>
        </div>

        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleManagerSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="mgr-login-id">
              Manager Email or Name <span className="required">*</span>
            </label>
            <input
              id="mgr-login-id"
              type="text"
              placeholder="e.g. manager@company.com"
              value={managerForm.emailOrName}
              onChange={(e) =>
                setManagerForm({
                  ...managerForm,
                  emailOrName: e.target.value,
                })
              }
              disabled={submitting}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="mgr-login-pass">
              Password <span className="required">*</span>
            </label>
            <input
              id="mgr-login-pass"
              type="password"
              placeholder="Enter your password"
              value={managerForm.password}
              onChange={(e) =>
                setManagerForm({ ...managerForm, password: e.target.value })
              }
              disabled={submitting}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          className="btn-google-signin"
          onClick={() => setIsGoogleModalOpen(true)}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        <div className="auth-footer">
          <span>New Manager?</span>
          <button
            type="button"
            className="btn-link"
            onClick={onSwitchToRegister}
          >
            Register as Manager
          </button>
        </div>
      </div>

      {/* Google Account Picker Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleGoogleAccountSelected}
      />
    </div>
  )
}

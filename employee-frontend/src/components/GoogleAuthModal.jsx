import { useState, useEffect } from 'react'

const STORAGE_KEY = 'worksphere_device_google_accounts'

const DEFAULT_ACCOUNTS = [
  {
    name: 'Sai Satya',
    email: 'gudurisai186@gmail.com',
    avatar: 'S',
    color: '#2563eb',
  },
  {
    name: 'Sai Krishna',
    email: 'saikrishna@gmail.com',
    avatar: 'K',
    color: '#7c3aed',
  },
]

export default function GoogleAuthModal({ isOpen, onClose, onSelectAccount }) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [customError, setCustomError] = useState('')
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed)
        }
      }
    } catch {
      // fallback
    }
  }, [])

  if (!isOpen) return null

  function saveAccountToList(acc) {
    try {
      const existing = accounts.filter(
        (a) => a.email.toLowerCase() !== acc.email.toLowerCase()
      )
      const updated = [acc, ...existing].slice(0, 5)
      setAccounts(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  function handleAccountClick(acc) {
    saveAccountToList(acc)
    onSelectAccount({
      name: acc.name,
      email: acc.email,
    })
  }

  function handleCustomSubmit(e) {
    e.preventDefault()
    setCustomError('')

    const email = customEmail.trim().toLowerCase()
    if (!email) {
      setCustomError('Please enter your Google email or Gmail address.')
      return
    }

    if (!email.includes('@')) {
      setCustomError('Please enter a valid email address (e.g. name@gmail.com).')
      return
    }

    // If user didn't type a custom name, intelligently generate a clean name from the email prefix
    let name = customName.trim()
    if (!name) {
      const prefix = email.split('@')[0]
      name = prefix
        .replace(/[._0-9]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .trim() || 'Google User'
    }

    const newAcc = {
      name,
      email,
      avatar: name.charAt(0).toUpperCase() || 'G',
      color: '#059669',
    }

    saveAccountToList(newAcc)
    onSelectAccount({ name, email })
  }

  return (
    <div className="google-modal-backdrop" onClick={onClose}>
      <div
        className="google-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Google Header */}
        <div className="google-modal-header">
          <svg className="google-g-logo" viewBox="0 0 24 24" width="28" height="28">
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
          <h3>Sign in with Google</h3>
          <p>Choose an account from your device to continue to WorkSphere</p>
        </div>

        {/* Account selection list */}
        {!showCustomInput ? (
          <div className="google-accounts-list">
            {accounts.map((acc) => (
              <div
                key={acc.email}
                className="google-account-item"
                onClick={() => handleAccountClick(acc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAccountClick(acc)}
              >
                <div
                  className="google-avatar"
                  style={{ backgroundColor: acc.color || '#2563eb' }}
                >
                  {acc.avatar}
                </div>
                <div className="google-account-details">
                  <div className="google-account-name">{acc.name}</div>
                  <div className="google-account-email">{acc.email}</div>
                </div>
              </div>
            ))}

            {/* Option to use another account */}
            <div
              className="google-account-item use-other-account"
              onClick={() => {
                setShowCustomInput(true)
                setCustomError('')
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowCustomInput(true)
                  setCustomError('')
                }
              }}
            >
              <div className="google-avatar other-avatar">+</div>
              <div className="google-account-details">
                <div className="google-account-name">Use another Google account</div>
                <div className="google-account-email">Add your device email address</div>
              </div>
            </div>
          </div>
        ) : (
          /* Custom account input form */
          <form onSubmit={handleCustomSubmit} className="google-custom-form">
            {customError && <p className="field-error">{customError}</p>}

            <div className="form-group">
              <label htmlFor="google-email-input">
                Google / Gmail Address <span className="required">*</span>
              </label>
              <input
                id="google-email-input"
                type="email"
                placeholder="e.g. yourname@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="google-name-input">
                Your Full Name <span style={{ opacity: 0.6 }}>(optional)</span>
              </label>
              <input
                id="google-name-input"
                type="text"
                placeholder="Leave blank to use email name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>

            <div className="google-form-actions">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setShowCustomInput(false)}
              >
                Back to accounts
              </button>
              <button type="submit" className="btn btn-primary btn-small">
                Continue with Google
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="google-modal-footer">
          <span>To continue, Google will share your name and email with WorkSphere.</span>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={onClose}
            style={{ marginTop: '12px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

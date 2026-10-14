import { useState, useRef } from 'react'
import { registerManager, getAllManagers } from '../services/authService'
import { sendManagerWelcomeEmail } from '../services/emailService'
import {
  uploadImageToCloudinary,
  uploadCroppedToCloudinary,
  DEFAULT_AVATAR_SVG,
} from '../services/cloudinaryService'
import Alert from './Alert'
import GoogleAuthModal from './GoogleAuthModal'
import PhotoCropperModal from './PhotoCropperModal'

const IT_DOMAINS = [
  'Artificial Intelligence & Machine Learning (AI/ML)',
  'Generative AI & Data Engineering',
  'Cloud Computing & DevOps (AWS / Azure / GCP)',
  'Full-Stack Software Engineering',
  'Cybersecurity & Ethical Hacking',
  'Product & Project Management',
]

const NON_IT_DOMAINS = [
  'Banking, Finance & Investment (BFSI)',
  'Supply Chain & Logistics Management',
  'Healthcare & Pharmaceutical Management',
  'Human Resources & Talent Management (HR)',
  'Sales, Marketing & Business Development',
  'Manufacturing & Plant Operations',
]

export default function ManagerRegister({
  onRegisterSuccess,
  onSwitchToLogin,
  onGoogleLogin,
}) {
  const [formData, setFormData] = useState({
    name: '',
    gmail: '',
    phoneno: '',
    salary: '0',
    sector: '', // 'IT' or 'NON-IT'
    department: '', // Domain
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false)
  const [profilePic, setProfilePic] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [rawImageSrc, setRawImageSrc] = useState('')
  const fileInputRef = useRef(null)

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setServerError('Please select a valid image file (PNG, JPG, JPEG, WEBP).')
      return
    }

    if (file.size > 12 * 1024 * 1024) {
      setServerError('Image size should be less than 12MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      setRawImageSrc(loadEvent.target.result)
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  async function handleCroppedPhotoSaved(croppedDataUrl) {
    setCropperOpen(false)
    setProfilePic(croppedDataUrl)
    setErrors((prev) => ({ ...prev, profilePic: '' }))
    setServerError('')

    setUploadingImage(true)
    try {
      const res = await uploadCroppedToCloudinary(croppedDataUrl)
      if (res?.url) {
        setProfilePic(res.url)
      }
    } catch (uploadErr) {
      console.warn('[Cloudinary] Background upload notice:', uploadErr)
    } finally {
      setUploadingImage(false)
    }
  }

  function handleRemovePhoto(e) {
    e.stopPropagation()
    setProfilePic('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleChange(e) {
    const { name, value } = e.target

    if (name === 'sector') {
      // When sector changes, set first priority domain of that sector
      setFormData((prev) => ({
        ...prev,
        sector: value,
        department: value === 'IT' ? IT_DOMAINS[0] : value === 'NON-IT' ? NON_IT_DOMAINS[0] : '',
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    setServerError('')
  }

  async function validate() {
    const errs = {}
    const name = formData.name.trim()
    const gmail = formData.gmail.trim()
    const phoneno = formData.phoneno.trim()
    const salary = String(formData.salary || '').trim()
    const { sector, department, password, confirmPassword } = formData

    // Mandatory Profile Photo Check
    if (!profilePic) {
      errs.profilePic = 'Profile photo is mandatory! Please upload a photo to register as Manager.'
    }

    if (!name) {
      errs.name = 'Full Name is required.'
    } else if (name.length < 2) {
      errs.name = 'Name must be at least 2 characters.'
    }

    if (!gmail) {
      errs.gmail = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(gmail)) {
      errs.gmail = 'Enter a valid Gmail address.'
    }

    // Pre-check unique name & email against existing managers in MySQL
    try {
      const existingManagers = await getAllManagers()
      if (existingManagers.some((m) => m.name?.trim().toLowerCase() === name.toLowerCase())) {
        errs.name = `Manager name "${name}" is already registered. Please choose a different name.`
      }
      if (existingManagers.some((m) => m.gmail?.trim().toLowerCase() === gmail.toLowerCase())) {
        errs.gmail = `Email "${gmail}" is already registered. Please login.`
      }
    } catch {
      // Continue if server check has network hiccup
    }

    if (!phoneno) {
      errs.phoneno = 'Phone number is required.'
    } else if (!/^[1-9]\d{9}$/.test(phoneno)) {
      errs.phoneno = 'Phone number must be exactly 10 digits (no leading 0).'
    }

    if (!salary || isNaN(Number(salary)) || Number(salary) <= 0) {
      errs.salary = 'Please enter a valid salary amount.'
    }

    if (!sector) {
      errs.sector = 'Please select Sector (IT or NON-IT).'
    }

    if (!department) {
      errs.department = 'Please select a Domain.'
    }

    if (!password) {
      errs.password = 'Password is required.'
    } else if (password.length < 4) {
      errs.password = 'Password must be at least 4 characters long.'
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your password.'
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }

    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    const fieldErrors = await validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)
    try {
      const newManager = await registerManager({
        name: formData.name,
        gmail: formData.gmail,
        phoneno: formData.phoneno,
        salary: Number(formData.salary),
        sector: formData.sector,
        department: formData.department,
        password: formData.password,
        profilePic: profilePic || null,
      })

      // Send EmailJS welcome notification to the manager's Gmail (+ admin alert)
      let emailStatus = null
      try {
        emailStatus = await sendManagerWelcomeEmail(newManager)
      } catch (emailErr) {
        console.warn('[EmailJS] Welcome email dispatch error:', emailErr)
      }

      try {
        localStorage.setItem('last_registered_manager', JSON.stringify(newManager))
      } catch (cacheErr) {
        console.warn('Could not cache registered manager photo:', cacheErr)
      }

      if (onRegisterSuccess) {
        onRegisterSuccess(newManager, emailStatus)
      }
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.')
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
          {/* WhatsApp / Facebook style Circular Profile Photo with '+' edit badge */}
          <div className="manager-avatar-uploader">
            <div
              className={`manager-avatar-circle ${uploadingImage ? 'is-uploading' : ''} ${errors.profilePic ? 'has-avatar-error' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload or change manager profile photo"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <img
                src={profilePic || DEFAULT_AVATAR_SVG}
                alt="Manager Profile"
                className="manager-avatar-preview"
              />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <div className="manager-avatar-subtext">
              {profilePic ? (
                <button
                  type="button"
                  className="btn-remove-avatar"
                  onClick={handleRemovePhoto}
                >
                  ✕ Remove Photo
                </button>
              ) : (
                <span className="avatar-hint-text">
                  {uploadingImage ? 'Uploading image...' : 'Click circle to upload photo *'}
                </span>
              )}
            </div>
            {errors.profilePic && (
              <p className="field-error" style={{ textAlign: 'center', marginTop: '6px' }}>
                {errors.profilePic}
              </p>
            )}
          </div>

          <h2>Manager Registration</h2>
        </div>

        {serverError && (
          <Alert type="error" onClose={() => setServerError('')}>
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Point 2: Label: Full Name *, placeholder: name */}
          <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
            <label htmlFor="reg-name">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              placeholder="name"
              value={formData.name}
              onChange={handleChange}
              disabled={submitting}
              autoComplete="name"
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          {/* Point 2: Label: Email *, placeholder: example@gmail.com */}
          <div className={`form-group ${errors.gmail ? 'has-error' : ''}`}>
            <label htmlFor="reg-gmail">
              Email <span className="required">*</span>
            </label>
            <input
              id="reg-gmail"
              name="gmail"
              type="email"
              placeholder="example@gmail.com"
              value={formData.gmail}
              onChange={handleChange}
              disabled={submitting}
              autoComplete="email"
            />
            {errors.gmail && <p className="field-error">{errors.gmail}</p>}
          </div>

          {/* Phone Number Label */}
          <div className={`form-group ${errors.phoneno ? 'has-error' : ''}`}>
            <label htmlFor="reg-phone">
              Phone Number <span className="required">*</span>
            </label>
            <input
              id="reg-phone"
              name="phoneno"
              type="tel"
              placeholder="10 digit phone number"
              value={formData.phoneno}
              onChange={handleChange}
              disabled={submitting}
              maxLength={10}
            />
            {errors.phoneno && <p className="field-error">{errors.phoneno}</p>}
          </div>

          {/* Point 8: Manager Salary Field */}
          <div className={`form-group ${errors.salary ? 'has-error' : ''}`}>
            <label htmlFor="reg-salary">
              Salary (₹) <span className="required">*</span>
            </label>
            <input
              id="reg-salary"
              name="salary"
              type="number"
              placeholder="e.g. 95000"
              value={formData.salary}
              onChange={handleChange}
              disabled={submitting}
            />
            {errors.salary && <p className="field-error">{errors.salary}</p>}
          </div>

          {/* Point 3: Label: Sector (IT or NON-IT) * */}
          <div className={`form-group ${errors.sector ? 'has-error' : ''}`}>
            <label htmlFor="reg-sector">
              Sector (IT or NON-IT) <span className="required">*</span>
            </label>
            <select
              id="reg-sector"
              name="sector"
              value={formData.sector}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="">-- Select Sector --</option>
              <option value="IT">IT</option>
              <option value="NON-IT">NON-IT</option>
            </select>
            {errors.sector && <p className="field-error">{errors.sector}</p>}
          </div>

          {/* Point 4 & Point 9: Label: Domain * (No Department, only Domain) */}
          <div className={`form-group ${errors.department ? 'has-error' : ''}`}>
            <label htmlFor="reg-dept">
              Domain <span className="required">*</span>
            </label>
            <select
              id="reg-dept"
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={submitting || !formData.sector}
            >
              {!formData.sector ? (
                <option value="">-- Please Select Sector First --</option>
              ) : formData.sector === 'IT' ? (
                IT_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))
              ) : (
                NON_IT_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))
              )}
            </select>
            {errors.department && <p className="field-error">{errors.department}</p>}
          </div>

          <div className="form-row-2">
            <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
              <label htmlFor="reg-password">
                Password <span className="required">*</span>
              </label>
              <input
                id="reg-password"
                name="password"
                type="password"
                placeholder="At least 4 chars"
                value={formData.password}
                onChange={handleChange}
                disabled={submitting}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="field-error">{errors.password}</p>
              )}
            </div>

            <div
              className={`form-group ${errors.confirmPassword ? 'has-error' : ''}`}
            >
              <label htmlFor="reg-confirm">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={submitting}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="field-error">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? 'Registering...' : 'Register as Manager'}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Google Sign In Feature */}
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
          <span>Continue with Google</span>
        </button>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <button
            type="button"
            className="btn-link"
            onClick={onSwitchToLogin}
          >
            Manager Login
          </button>
        </div>
      </div>

      {/* Google Account Picker Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleGoogleAccountSelected}
      />

      {/* Facebook / Instagram style Photo Cropper & Adjustment Modal */}
      <PhotoCropperModal
        isOpen={cropperOpen}
        imageSrc={rawImageSrc}
        onCancel={() => setCropperOpen(false)}
        onSaveCroppedImage={handleCroppedPhotoSaved}
      />
    </div>
  )
}

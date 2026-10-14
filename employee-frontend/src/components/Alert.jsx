// type: 'success' | 'error' | 'info'
export default function Alert({ type = 'info', children, onClose }) {
  if (!children) return null
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="alert-text">{children}</span>
      {onClose && (
        <button type="button" className="alert-close" onClick={onClose} aria-label="Dismiss message">
          &times;
        </button>
      )}
    </div>
  )
}

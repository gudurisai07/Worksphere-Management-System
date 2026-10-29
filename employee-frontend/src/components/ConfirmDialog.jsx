import { useEffect, useRef } from 'react'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  busy,
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null)

  // Focus the confirm or cancel button when the dialog opens
  useEffect(() => {
    confirmBtnRef.current?.focus()
  }, [])

  // Let Escape close the dialog safely
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !busy) {
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <div
      className="custom-confirm-backdrop"
      id="confirm-dialog-backdrop"
      onClick={(e) => {
        // Only close if user clicked directly on backdrop, not inside modal
        if (e.target === e.currentTarget && !busy) {
          onCancel()
        }
      }}
    >
      <div
        className="custom-confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-confirm-header">
          <div className="custom-confirm-icon-badge">⚠️</div>
          <h3 id="confirm-title">{title}</h3>
        </div>
        <p className="custom-confirm-message">{message}</p>
        <div className="custom-confirm-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={busy}
            id="confirm-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={busy}
            id="confirm-delete-btn"
          >
            {busy ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}


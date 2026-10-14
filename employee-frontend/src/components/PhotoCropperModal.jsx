import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Facebook / Instagram style circular photo adjustment & crop modal.
 * Features:
 * - Interactive circular viewport preview
 * - Drag / pan to reposition (mouse + touch)
 * - Zoom slider (1x - 3x) with zoom in / out controls
 * - 90-degree rotation
 * - Canvas export producing a high-res cropped image
 */
export default function PhotoCropperModal({
  isOpen,
  imageSrc,
  onCancel,
  onSaveCroppedImage,
}) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
      // Reset controls
      setZoom(1)
      setRotation(0)
      setOffset({ x: 0, y: 0 })
    }
    img.src = imageSrc
  }, [imageSrc])

  // Draw the image on the interactive canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    const size = canvas.width // 280px viewport
    const center = size / 2

    ctx.clearRect(0, 0, size, size)

    // Save state
    ctx.save()

    // 1. Clip to circular viewport
    ctx.beginPath()
    ctx.arc(center, center, center - 4, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Fill background inside circle
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, size, size)

    // 2. Translate to center, apply offset, zoom, rotation
    ctx.translate(center + offset.x, center + offset.y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(zoom, zoom)

    // 3. Draw image centered
    const imgAspect = img.width / img.height
    let drawW, drawH
    if (imgAspect > 1) {
      drawH = size
      drawW = size * imgAspect
    } else {
      drawW = size
      drawH = size / imgAspect
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)

    ctx.restore()

    // 4. Draw outer circle border ring (like Facebook / Instagram)
    ctx.beginPath()
    ctx.arc(center, center, center - 4, 0, Math.PI * 2)
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.stroke()
  }, [imageLoaded, zoom, rotation, offset])

  useEffect(() => {
    drawPreview()
  }, [drawPreview])

  if (!isOpen || !imageSrc) return null

  // Mouse drag handlers
  function handleMouseDown(e) {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  function handleMouseMove(e) {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  // Touch handlers for mobile / touchpads
  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      setIsDragging(true)
      const touch = e.touches[0]
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y })
    }
  }

  function handleTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    })
  }

  function handleTouchEnd() {
    setIsDragging(false)
  }

  function handleRotate() {
    setRotation((prev) => (prev + 90) % 360)
  }

  function handleReset() {
    setZoom(1)
    setRotation(0)
    setOffset({ x: 0, y: 0 })
  }

  // Export high-resolution circular cropped image
  function handleSave() {
    const img = imageRef.current
    if (!img) return

    const exportCanvas = document.createElement('canvas')
    const exportSize = 400 // 400x400 high-res circle
    exportCanvas.width = exportSize
    exportCanvas.height = exportSize
    const ctx = exportCanvas.getContext('2d')
    const center = exportSize / 2

    // Clip circle
    ctx.beginPath()
    ctx.arc(center, center, center, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Match transform
    const scaleFactor = exportSize / 280
    ctx.translate(center + offset.x * scaleFactor, center + offset.y * scaleFactor)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor)

    const imgAspect = img.width / img.height
    let drawW, drawH
    if (imgAspect > 1) {
      drawH = 280
      drawW = 280 * imgAspect
    } else {
      drawW = 280
      drawH = 280 / imgAspect
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)

    const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.9)
    onSaveCroppedImage(croppedDataUrl)
  }

  return (
    <div className="cropper-backdrop" onClick={onCancel}>
      <div
        className="cropper-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="cropper-header">
          <h3>✂️ Adjust Profile Picture</h3>
          <p>Drag image to reposition • Use slider to zoom</p>
        </div>

        {/* Viewport with Canvas */}
        <div
          className="cropper-viewport-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="cropper-canvas"
          />
          <div className="cropper-drag-hint">
            <span>✋ Drag to move</span>
          </div>
        </div>

        {/* Zoom & Adjustment Controls */}
        <div className="cropper-controls">
          <div className="zoom-control-row">
            <button
              type="button"
              className="btn-zoom"
              onClick={() => setZoom((z) => Math.max(1, Number((z - 0.2).toFixed(1))))}
              title="Zoom out"
            >
              🔍 -
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="zoom-slider"
            />
            <button
              type="button"
              className="btn-zoom"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.2).toFixed(1))))}
              title="Zoom in"
            >
              🔍 +
            </button>
          </div>

          <div className="cropper-tool-buttons">
            <button
              type="button"
              className="btn-tool"
              onClick={handleRotate}
              title="Rotate 90 degrees"
            >
              🔄 Rotate 90°
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={handleReset}
              title="Reset zoom & position"
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="cropper-actions">
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={handleSave}
          >
            ✓ Set Profile Photo
          </button>
        </div>
      </div>
    </div>
  )
}

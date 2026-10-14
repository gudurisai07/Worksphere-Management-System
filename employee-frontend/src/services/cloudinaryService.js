import api from '../api/axiosConfig'

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'qoudkvb9',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '726187853611836',
}

// Default Facebook / WhatsApp style avatar SVG (modern neutral user silhouette)
export const DEFAULT_AVATAR_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="60" fill="url(#bgGrad)" />
  <circle cx="60" cy="45" r="22" fill="#ffffff" opacity="0.95" />
  <path d="M22 104 C24 76, 42 68, 60 68 C78 68, 96 76, 98 104 Z" fill="#ffffff" opacity="0.95" />
</svg>
`.trim())

/**
 * Checks if Cloudinary is configured
 */
export function isCloudinaryConfigured() {
  return Boolean(CLOUDINARY_CONFIG.cloudName && CLOUDINARY_CONFIG.uploadPreset)
}

/**
 * Compresses an image client-side to ensure fast loading and database storage
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @returns {Promise<string>} Base64 data URL
 */
export function compressImage(file, maxWidth = 400, maxHeight = 400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            maxHeight = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Compress to JPEG with 0.82 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        resolve(dataUrl)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads an image file to Cloudinary if credentials exist;
 * otherwise compresses client-side and returns local Base64 URL.
 *
 * @param {File} file
 * @returns {Promise<{ url: string, isCloudinary: boolean }>}
 */
export async function uploadImageToCloudinary(file) {
  if (!file) {
    throw new Error('No image file provided.')
  }

  // If Cloudinary is configured with cloud_name and upload_preset, upload to Cloudinary API
  if (isCloudinaryConfigured()) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset)
      if (CLOUDINARY_CONFIG.apiKey) {
        formData.append('api_key', CLOUDINARY_CONFIG.apiKey)
      }

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Cloudinary upload failed (HTTP ${res.status})`)
      }

      const data = await res.json()
      return {
        url: data.secure_url || data.url,
        isCloudinary: true,
      }
    } catch (err) {
      console.warn('[Cloudinary] Upload failed, falling back to local compressed image:', err)
    }
  }

  // Graceful fallback: compress client-side to fast base64 string
  const base64Url = await compressImage(file, 300, 300)
  return {
    url: base64Url,
    isCloudinary: false,
  }
}

/**
 * Uploads a cropped base64 image data URL to Cloudinary via backend Spring Boot API
 * @param {string} base64DataUrl
 * @returns {Promise<{ url: string, isCloudinary: boolean }>}
 */
export async function uploadCroppedToCloudinary(base64DataUrl) {
  if (!base64DataUrl) return { url: base64DataUrl, isCloudinary: false }

  try {
    const res = await api.post('/api/upload/base64', { image: base64DataUrl })
    if (res.data?.url) {
      console.log('[Cloudinary] Successfully uploaded via backend to CDN:', res.data.url)
      return { url: res.data.url, isCloudinary: true }
    }
  } catch (backendErr) {
    console.warn('[Cloudinary] Backend upload not available, using compressed base64:', backendErr)
  }

  return { url: base64DataUrl, isCloudinary: false }
}


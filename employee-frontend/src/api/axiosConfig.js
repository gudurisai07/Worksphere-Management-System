import axios from 'axios'

// In dev server (port 5173), default to http://localhost:7777 unless specified.
// In production (bundled inside Spring Boot), default to empty string so requests are relative to host.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== ''
  ? import.meta.env.VITE_API_BASE_URL
  : (import.meta.env.DEV ? 'http://localhost:7777' : '')

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export default api

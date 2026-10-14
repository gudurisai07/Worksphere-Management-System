import axios from 'axios'

// One place for the backend URL. Change it in .env (VITE_API_BASE_URL), not in components.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7777'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export default api

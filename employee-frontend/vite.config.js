import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The React dev server must run on 5173 because the Spring Boot CORS
// configuration (CorsConfig.java) allows exactly that origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // fail loudly instead of silently switching to 5174 (which CORS would block)
  },
})

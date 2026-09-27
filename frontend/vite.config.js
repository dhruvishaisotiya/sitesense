import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // In production Django serves the build through WhiteNoise at /static/, so the
  // generated index.html must reference its assets from there. In development
  // Vite serves from the root.
  base: mode === 'production' ? '/static/' : '/',

  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
}))

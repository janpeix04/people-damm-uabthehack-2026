import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  // Els webhooks d'n8n es serveixen pel mateix origen (sense CORS): /webhook/* → n8n
  server: {
    proxy: {
      '/api/auth': { target: process.env.HR_API_URL ?? 'http://localhost:3001' },
      '/api/app': { target: process.env.HR_API_URL ?? 'http://localhost:3001' },
      '/api/hr': { target: process.env.HR_API_URL ?? 'http://localhost:3001' },
    },
  },
  // three.js (el bloc 3D) pesa ~590 kB i només es carrega a les pantalles 3D
  build: { chunkSizeWarningLimit: 700 },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  // three.js (el bloc 3D) pesa ~590 kB i només es carrega a les pantalles 3D
  build: { chunkSizeWarningLimit: 700 },
})

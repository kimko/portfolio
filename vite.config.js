import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/portfolio/',
  build: {
    // The main bundle is ~550KB (Chakra UI + Framer Motion + React).
    // The 3D Engine chunk (Three.js) is ~1MB, but is safely code-split and lazy-loaded.
    chunkSizeWarningLimit: 1500,
  },
})

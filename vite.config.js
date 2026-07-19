import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/portfolio/',
  build: {
    // Single bundle is ~530KB (Chakra UI + Framer Motion + React).
    // Code-splitting has no benefit for a single-page portfolio.
    chunkSizeWarningLimit: 600,
  },
})

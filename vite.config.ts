import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // FIKSET: Korrekt base for GitHub Pages med eget repo
  base: './', // Relativ path for GitHub Pages deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Reduserer bundle størrelse
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet']
  }
})
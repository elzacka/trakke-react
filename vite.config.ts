import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.geojson'],
  // FIKSET: Korrekt base for GitHub Pages med eget repo
  base: './', // Relativ path for GitHub Pages deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Reduserer bundle størrelse
  },
  server: {
    port: 3000,
    host: true, // Listen on all network interfaces
    open: true,
    strictPort: false, // Allow Vite to use alternative ports if 3000 is busy
    hmr: {
      port: 3001 // Use separate port for HMR to avoid conflicts
    }
  },
  optimizeDeps: {
    include: ['maplibre-gl']
  }
})
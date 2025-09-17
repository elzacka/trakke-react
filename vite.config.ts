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
    host: '127.0.0.1', // Use explicit IP instead of localhost for better reliability
    open: true,
    strictPort: true, // Use exact port to avoid confusion
    hmr: {
      port: 3001,
      host: '127.0.0.1' // Match server host for consistency
    },
    cors: true,
    watch: {
      usePolling: true, // Better compatibility across systems
      interval: 300
    }
  },
  optimizeDeps: {
    include: ['maplibre-gl']
  }
})
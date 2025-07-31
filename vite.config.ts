import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/trakke-react/', // Dette må matche repository-navnet ditt
  build: {
    outDir: 'dist',
  },
})

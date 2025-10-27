import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-16x16.svg', 'icons/*.svg'],
      manifest: {
        name: 'Tråkke - Oppdag Norge med turskoa på',
        short_name: 'Tråkke',
        description: 'Utforsk Norges natur, kulturarv og friluftsopplevelser',
        theme_color: '#3e4533',
        background_color: '#f8f9fa',
        display: 'standalone',
        orientation: 'any',
        scope: './',
        start_url: './',
        lang: 'no',
        icons: [
          {
            src: './icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: './icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: './icons/icon-180x180.svg',
            sizes: '180x180',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: './icons/icon-maskable-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,gif,webp,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/opencache\.statkart\.no\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'kartverket-tiles',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/ws\.geonorge\.no\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'geonorge-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/overpass-api\.de\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'overpass-api',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
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
    host: '127.0.0.1',
    open: true,
    strictPort: true,
    hmr: {
      port: 3001,
      host: '127.0.0.1'
    },
    cors: true,
    watch: {
      usePolling: true,
      interval: 300
    }
  },
  optimizeDeps: {
    include: ['maplibre-gl']
  }
})
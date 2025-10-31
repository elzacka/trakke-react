import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-16x16.svg', 'icons/*.svg', 'offline.html'],
      manifest: {
        id: '/',
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
        categories: ['travel', 'navigation', 'utilities', 'lifestyle'],
        shortcuts: [
          {
            name: 'Søk',
            short_name: 'Søk',
            description: 'Søk etter steder og koordinater',
            url: './?action=search',
            icons: [{ src: './icons/icon-192x192.svg', sizes: '192x192' }]
          },
          {
            name: 'Min posisjon',
            short_name: 'Posisjon',
            description: 'Gå til min posisjon',
            url: './?action=location',
            icons: [{ src: './icons/icon-192x192.svg', sizes: '192x192' }]
          },
          {
            name: 'Turer',
            short_name: 'Turer',
            description: 'Utforsk turløyper',
            url: './?action=trails',
            icons: [{ src: './icons/icon-192x192.svg', sizes: '192x192' }]
          }
        ],
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
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/api\//, /^\/__/],
        offlineGoogleAnalytics: false,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
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
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'kartverket-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
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
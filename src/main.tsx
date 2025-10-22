// import { StrictMode } from 'react' // Disabled to prevent double map rendering
import { createRoot } from 'react-dom/client'

// Self-hosted fonts for GDPR compliance (no Google CDN)
import '@fontsource/exo-2/300.css'
import '@fontsource/exo-2/400.css'
import '@fontsource/exo-2/500.css'
import '@fontsource/exo-2/600.css'
import '@fontsource/exo-2/700.css'
import '@fontsource/material-symbols-outlined'

import './index.css'
import { MapLibreTrakkeApp } from './MapLibreTrakkeApp'

console.log('🚀 Loading MapLibre TrakkeApp with Kartverket official landtopo vector tiles...')

try {
  const root = document.getElementById('root')
  if (!root) {
    console.error('❌ Could not find root element')
  } else {
    console.log('✅ Found root element, creating React root...')
    createRoot(root).render(
      <MapLibreTrakkeApp />
    )
    console.log('✅ MapLibre TrakkeApp with Kartverket landtopo should be rendered')
  }
} catch (error) {
  console.error('❌ Error rendering MapLibre TrakkeApp:', error)
}

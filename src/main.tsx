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

try {
  const root = document.getElementById('root')
  if (!root) {
    console.error('❌ Could not find root element')
  } else {
    createRoot(root).render(
      <MapLibreTrakkeApp />
    )
  }
} catch (error) {
  console.error('❌ Error rendering MapLibre TrakkeApp:', error)
}

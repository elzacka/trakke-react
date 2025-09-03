import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { MapLibreTrakkeApp } from './MapLibreTrakkeApp'

console.log('🚀 Loading MapLibre TrakkeApp with Kartverket vector tiles...')

try {
  const root = document.getElementById('root')
  if (!root) {
    console.error('❌ Could not find root element')
  } else {
    console.log('✅ Found root element, creating React root...')
    createRoot(root).render(
      <StrictMode>
        <MapLibreTrakkeApp />
      </StrictMode>,
    )
    console.log('✅ MapLibre TrakkeApp with Kartverket should be rendered')
  }
} catch (error) {
  console.error('❌ Error rendering MapLibre TrakkeApp:', error)
}

// import { StrictMode } from 'react' // Disabled to prevent double map rendering
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
      <MapLibreTrakkeApp />
    )
    console.log('✅ MapLibre TrakkeApp with Kartverket should be rendered')
  }
} catch (error) {
  console.error('❌ Error rendering MapLibre TrakkeApp:', error)
}

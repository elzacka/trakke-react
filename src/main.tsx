import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WorkingTrakkeApp from './WorkingTrakkeApp'

console.log('🚀 Loading Working TrakkeApp with heritage POI integration...')

try {
  const root = document.getElementById('root')
  if (!root) {
    console.error('❌ Could not find root element')
  } else {
    console.log('✅ Found root element, creating React root...')
    createRoot(root).render(
      <StrictMode>
        <WorkingTrakkeApp />
      </StrictMode>,
    )
    console.log('✅ Working TrakkeApp with heritage POIs should be rendered')
  }
} catch (error) {
  console.error('❌ Error rendering Working TrakkeApp:', error)
}

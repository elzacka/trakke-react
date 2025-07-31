import React, { useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { Map } from './components/Map'
import { poisData, POIType } from './data/pois'
import './App.css'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Initialize with all categories active (like HTML version)
  const [activeCategories, setActiveCategories] = useState<Set<POIType>>(
    new Set(['hiking', 'swimming', 'camping', 'waterfalls', 'viewpoints', 'history'])
  )

  // Filter POIs based on active categories
  const filteredPOIs = poisData.filter(poi => activeCategories.has(poi.type))

  // Toggle category function
  const toggleCategory = (categoryId: POIType) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  return (
    <div className="app">
      <Header />
      
      <div className="container">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeCategories={activeCategories}
          onToggleCategory={toggleCategory}
          filteredPOIs={filteredPOIs}
          totalPOIs={poisData.length}
        />
        
        <Map 
          pois={filteredPOIs} 
          sidebarCollapsed={sidebarCollapsed}
        />
      </div>
    </div>
  )
}

export default App

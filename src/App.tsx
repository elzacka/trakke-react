// src/App.tsx - Oppdatert med OSM API integration
import React, { useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { Map } from './components/Map'
import { POIType } from './data/pois'
import { usePOIData } from './hooks/usePOIData'
import './App.css'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Bruk den nye POI data hook
  const { pois, loading, error, refreshData, lastUpdated } = usePOIData()
  
  // Initialize with all categories active (inkludert nye camping kategorier)
  const [activeCategories, setActiveCategories] = useState<Set<POIType>>(
  new Set()
  )

  // Filter POIs based on active categories
  const filteredPOIs = pois.filter(poi => activeCategories.has(poi.type))

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
          totalPOIs={pois.length}
          loading={loading}
          error={error}
          onRefresh={refreshData}
          lastUpdated={lastUpdated}
        />
        
        <Map 
          pois={filteredPOIs} 
          sidebarCollapsed={sidebarCollapsed}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default App
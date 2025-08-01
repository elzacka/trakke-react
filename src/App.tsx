// src/App.tsx - Komplett fikset versjon med eksportert MapRef
import React, { useState, useRef } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { Map } from './components/Map'
import { POIType } from './data/pois'
import { usePOIData } from './hooks/usePOIData'
import { SearchResult } from './services/searchService'
import './App.css'

// Eksporter MapRef interface så andre komponenter kan bruke den
export interface MapRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void
  addSearchMarker: (result: SearchResult) => void
  clearSearchMarker: () => void
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Bruk den nye POI data hook
  const { pois, loading, error, refreshData, lastUpdated } = usePOIData()
  
  // Start med alle kategorier UNCHECKED (tom Set)
  const [activeCategories, setActiveCategories] = useState<Set<POIType>>(
    new Set() // Tom Set = ingen kategorier valgt som standard
  )

  // Ref til kartkomponenten for å kunne styre den
  const mapRef = useRef<MapRef>(null)

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

  // Handle location selection from search
  const handleLocationSelect = (result: SearchResult) => {
    console.log('📍 Valgt lokasjon:', result.displayName, 'Koordinater:', result.lat, result.lng)
    
    // Fly til den valgte lokasjonen på kartet
    if (mapRef.current) {
      // Velg zoom-nivå basert på result type
      let zoom = 15 // Default zoom
      if (result.type === 'coordinates') zoom = 16 // Nærmere for koordinater
      if (result.type === 'poi') zoom = 17 // Nærmest for POI-er
      if (result.bbox) {
        // Hvis vi har bounding box, la kartet bestemme zoom automatisk
        zoom = 14
      }
      
      mapRef.current.flyTo(result.lat, result.lng, zoom)
      mapRef.current.addSearchMarker(result)
    }
  }

  return (
    <div className="app">
      <Header 
        pois={pois}
        onLocationSelect={handleLocationSelect}
      />
      
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
          ref={mapRef}
          pois={filteredPOIs} 
          sidebarCollapsed={sidebarCollapsed}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default App
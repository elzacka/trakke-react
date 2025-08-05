// src/TrakkeApp.tsx - Main Tråkke application with weather integration

import React, { useState, useRef, useCallback } from 'react'
import { Header } from './components/Header'
import { Map, MapRef } from './components/Map'
import { Sidebar } from './components/Sidebar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SearchResult } from './services/searchService'
import { usePOIDataWithWeather } from './hooks/usePOIDataWithWeather'
import { POIType, categoryConfig } from './data/pois'
import './App.css'

export function TrakkeApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeCategories, setActiveCategories] = useState<Set<POIType>>(
    new Set(Object.keys(categoryConfig) as POIType[])
  )
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [weatherEnabled, setWeatherEnabled] = useState(true)
  
  const mapRef = useRef<MapRef>(null)

  // Use weather-enabled POI data hook
  const {
    pois,
    loading,
    weatherLoading,
    error,
    weatherError,
    lastUpdated,
    weatherLastUpdated,
    poisWithWeather,
    hasWeatherData,
    refreshData,
    refreshWeatherData,
    getGoodWeatherPOIs
  } = usePOIDataWithWeather(weatherEnabled)

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const toggleCategory = useCallback((categoryId: POIType) => {
    setActiveCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  const handleSearch = useCallback((result: SearchResult) => {
    setSearchResult(result)
    mapRef.current?.addSearchMarker(result)
    mapRef.current?.flyTo(result.lat, result.lng, 14)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResult(null)
    mapRef.current?.clearSearchMarker()
  }, [])

  const toggleWeather = useCallback(() => {
    setWeatherEnabled(prev => !prev)
  }, [])

  // Filter POIs based on active categories
  const filteredPOIs = pois.filter(poi => activeCategories.has(poi.type))
  const goodWeatherPOIs = getGoodWeatherPOIs()

  // Combine errors for display
  const combinedError = error || weatherError

  return (
    <div className="app">
      <Header 
        pois={pois}
        onLocationSelect={handleSearch}
      />
      
      <main className="app-main">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          activeCategories={activeCategories}
          onToggleCategory={toggleCategory}
          filteredPOIs={filteredPOIs}
          totalPOIs={pois.length}
          loading={loading || weatherLoading}
          error={combinedError}
          onRefresh={refreshData}
          lastUpdated={lastUpdated}
          weatherEnabled={weatherEnabled}
          onToggleWeather={toggleWeather}
          poisWithWeather={poisWithWeather}
          goodWeatherPOIs={goodWeatherPOIs}
          hasWeatherData={hasWeatherData}
          onRefreshWeather={refreshWeatherData}
          weatherLastUpdated={weatherLastUpdated}
        />
        
        <div className="map-container">
          <ErrorBoundary fallback={
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{
                padding: '30px',
                textAlign: 'center',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <h3>🗺️ Kartfeil</h3>
                <p>Kartet kunne ikke lastes. Prøv å oppdatere siden.</p>
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2c5530',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Oppdater siden
                </button>
              </div>
            </div>
          }>
            <Map
              ref={mapRef}
              pois={filteredPOIs}
              sidebarCollapsed={sidebarCollapsed}
              loading={loading}
              searchResult={searchResult}
              onClearSearchResult={clearSearch}
            />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

export default TrakkeApp
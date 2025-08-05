// Working TrakkeApp with manual Leaflet implementation
import React, { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
// Header component will be added later if needed
import { Sidebar } from './components/Sidebar'
import { SearchResult } from './services/searchService'
import { useCombinedPOIData } from './hooks/useCombinedPOIData'
import { POIType, categoryConfig, categoryTree, CategoryState, CategoryNode } from './data/pois'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Fix Leaflet default marker icons issue
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Unused helper functions removed during popup fix

export function WorkingTrakkeApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [_searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [weatherEnabled, setWeatherEnabled] = useState(true) // Re-enabled now that OSM POIs work
  const [heritageEnabled, setHeritageEnabled] = useState(false) // Keep disabled - causes network errors
  
  // Initialize category state - all unchecked and collapsed by default
  const [categoryState, setCategoryState] = useState<CategoryState>({
    expanded: {
      // All main categories collapsed by default - user must expand to see subcategories
    }, 
    checked: {
      // All categories unchecked by default - user must select what they want to see
    }
  })
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  // Use combined POI data hook (outdoor + heritage + weather)
  const {
    allPOIs: pois,
    outdoorPOIs: _outdoorPOIs,
    heritagePOIs: _heritagePOIs,
    loading,
    error,
    lastUpdated,
    weatherLastUpdated,
    poisWithWeather,
    hasWeatherData,
    heritageTotal,
    refreshOutdoorData,
    refreshHeritageData,
    refreshWeatherData,
    getGoodWeatherPOIs
  } = useCombinedPOIData({
    weatherEnabled,
    heritageEnabled
  })

  // Initialize map
  useEffect(() => {
    // Wait for DOM to be ready
    const initMap = () => {
      if (!mapRef.current) {
        console.log('❌ Map ref not available')
        return
      }

      console.log('🗺️ Initializing map...')

      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      try {
        // Create new map centered on Norway with proper interaction settings
        const map = L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          zoomAnimation: true,
          fadeAnimation: true,
          markerZoomAnimation: true
        }).setView([65.0, 10.0], 5) // Center of Norway with zoom level to show whole country
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18
        }).addTo(map)

        mapInstanceRef.current = map

        // Force map to resize multiple times to ensure proper sizing
        setTimeout(() => {
          map.invalidateSize()
        }, 100)
        
        setTimeout(() => {
          map.invalidateSize()
        }, 500)

      } catch (error) {
        console.error('❌ Error creating map:', error)
      }
    }

    // Initialize map immediately for faster loading
    const timer = setTimeout(initMap, 50)

    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Helper function to get active POI types from category state
  const getActivePOITypes = useCallback((): Set<POIType> => {
    const activeTypes = new Set<POIType>()
    
    function checkNode(node: CategoryNode) {
      if (categoryState.checked[node.id] && node.poiTypes) {
        node.poiTypes.forEach(type => activeTypes.add(type))
      }
      if (node.children) {
        node.children.forEach(checkNode)
      }
    }
    
    categoryTree.forEach(checkNode)
    return activeTypes
  }, [categoryState])

  // Update POI markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    // Filter POIs based on active categories
    const activePOITypes = getActivePOITypes()
    const filteredPOIs = pois.filter(poi => activePOITypes.has(poi.type))

    // Minimal logging to prevent infinite loops

    // Add new markers (reduced logging)
    
    filteredPOIs.forEach((poi, index) => {
      try {
        // Use default Leaflet markers for reliable popup functionality
        const markerIcon = new L.Icon.Default()
        
        const marker = L.marker([poi.lat, poi.lng], {
          icon: markerIcon,
          interactive: true,
          keyboard: false, // Prevent keyboard conflicts with map
          riseOnHover: true,
          riseOffset: 250
        })
        
        // Create simple, clean popup content
        const popupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 6px 0; color: #2c5530; font-size: 15px;">
              ${poi.name || 'Ukjent sted'}
            </h3>
            <p style="margin: 0 0 6px 0; color: #555; font-size: 13px;">
              ${poi.description || 'Ingen beskrivelse tilgjengelig'}
            </p>
            <div style="color: #777; font-size: 11px;">
              Type: ${categoryConfig[poi.type]?.name || poi.type}
            </div>
          </div>
        `
        
        // Bind popup with simple options
        marker.bindPopup(popupContent, {
          maxWidth: 300,
          closeButton: true,
          autoClose: true,
          closeOnClick: true,
          closeOnEscapeKey: true
        })
        
        // Simple click handler - popup opens automatically when marker is clicked
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e)
        })
        
        marker.addTo(mapInstanceRef.current!)
        markersRef.current.push(marker)
      } catch (error) {
        console.error(`❌ Failed to create marker for POI ${poi.name}:`, error)
      }
    })
    
    // Test marker removed to prevent interference

    // Markers added successfully (logging removed to prevent loops)
  }, [pois, getActivePOITypes])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const handleCategoryToggle = useCallback((nodeId: string) => {
    setCategoryState(prev => {
      const newChecked = { ...prev.checked }
      const isCurrentlyChecked = prev.checked[nodeId]
      const newState = !isCurrentlyChecked
      
      // Update the clicked category
      newChecked[nodeId] = newState
      
      // Find the node in the category tree
      const findNode = (nodes: CategoryNode[], id: string): CategoryNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node
          if (node.children) {
            const found = findNode(node.children, id)
            if (found) return found
          }
        }
        return null
      }
      
      const clickedNode = findNode(categoryTree, nodeId)
      
      if (clickedNode) {
        // If this is a parent category (has children), toggle all children to match parent state
        if (clickedNode.children) {
          const setChildrenState = (children: CategoryNode[], state: boolean) => {
            children.forEach(child => {
              newChecked[child.id] = state
              if (child.children) {
                setChildrenState(child.children, state)
              }
            })
          }
          setChildrenState(clickedNode.children, newState)
        }
        
        // If this is a child category, handle parent state logic
        if (clickedNode.parent) {
          const parentNode = findNode(categoryTree, clickedNode.parent)
          if (parentNode && parentNode.children) {
            if (newState) {
              // If checking a child and all siblings are now checked, check parent
              const allChildrenChecked = parentNode.children.every(child => 
                child.id === nodeId ? true : newChecked[child.id]
              )
              if (allChildrenChecked) {
                newChecked[clickedNode.parent] = true
              }
            } else {
              // If unchecking a child, uncheck parent
              newChecked[clickedNode.parent] = false
            }
          }
        }
      }
      
      // Category toggle completed
      
      return {
        ...prev,
        checked: newChecked
      }
    })
  }, [])

  const handleExpandToggle = useCallback((nodeId: string) => {
    setCategoryState(prev => ({
      ...prev,
      expanded: {
        ...prev.expanded,
        [nodeId]: !prev.expanded[nodeId]
      }
    }))
  }, [])

  const handleSearch = useCallback((result: SearchResult) => {
    setSearchResult(result)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([result.lat, result.lng], 14)
      
      // Add a temporary marker for the search result
      const displayName = result.displayName || result.name || 'Søkeresultat'
      const _searchMarker = L.marker([result.lat, result.lng])
        .bindPopup(`<div style="min-width: 150px;"><strong>${displayName}</strong><br><em>Søkeresultat</em></div>`)
        .addTo(mapInstanceRef.current!)
        .openPopup()
    }
  }, [])

  // clearSearch function removed as it was unused

  const toggleWeather = useCallback(() => {
    setWeatherEnabled(prev => !prev)
  }, [])

  const toggleHeritage = useCallback(() => {
    setHeritageEnabled(prev => !prev)
  }, [])

  // Combined refresh function
  const refreshData = useCallback(() => {
    refreshOutdoorData()
    if (heritageEnabled) {
      refreshHeritageData()
    }
  }, [refreshOutdoorData, refreshHeritageData, heritageEnabled])

  // Filter POIs based on active categories
  const activePOITypes = getActivePOITypes()
  const filteredPOIs = pois.filter(poi => activePOITypes.has(poi.type))
  const goodWeatherPOIs = getGoodWeatherPOIs()
  const combinedError = error

  return (
    <div className="app">      
      <main className="app-main">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          categoryState={categoryState}
          onCategoryToggle={handleCategoryToggle}
          onExpandToggle={handleExpandToggle}
          filteredPOIs={filteredPOIs}
          totalPOIs={pois.length}
          loading={loading}
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
          heritageEnabled={heritageEnabled}
          onToggleHeritage={toggleHeritage}
          heritageTotal={heritageTotal}
          pois={pois}
          onLocationSelect={handleSearch}
        />
        
        <div className="map-container">
          {loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              Laster kartdata...
            </div>
          )}
          
          <div 
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '500px',
              borderRadius: '8px',
              backgroundColor: '#e0e0e0',
              border: '2px solid #ccc'
            }}
          />
        </div>
      </main>
    </div>
  )
}

export default WorkingTrakkeApp
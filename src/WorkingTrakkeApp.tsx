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

// Create custom POI icons with improved click handling (currently unused)
function _createCustomIcon(poiType: POIType): L.DivIcon {
  const config = categoryConfig[poiType]
  return L.divIcon({
    html: `<div class="poi-marker" style="
      background: ${config.color};
      border: 2px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      font-family: 'Material Symbols Outlined';
      font-size: 16px;
      color: white;
      cursor: pointer;
      pointer-events: auto;
    ">${config.icon}</div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  })
}

// Helper function to collect all POI types from category tree (currently unused)
function _collectAllPOITypes(nodes: CategoryNode[]): POIType[] {
  const types: POIType[] = []
  
  function traverse(node: CategoryNode) {
    if (node.poiTypes) {
      types.push(...node.poiTypes)
    }
    if (node.children) {
      node.children.forEach(traverse)
    }
  }
  
  nodes.forEach(traverse)
  return types
}

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

    // Reduced debug logging to prevent console spam
    if (filteredPOIs.length !== markersRef.current.length) {
      console.log('🗺️ POI Update:', {
        totalPOIs: pois.length,
        filteredPOIs: filteredPOIs.length,
        activePOITypes: Array.from(activePOITypes).slice(0, 3) // Show only first 3
      })
    }

    // Add new markers
    if (filteredPOIs.length > 0) {
      console.log(`🗺️ Adding ${filteredPOIs.length} markers to map`)
    } else if (pois.length > 0) {
      console.log('⚠️ No POIs match active categories. Total POIs:', pois.length)
    } else {
      console.log('⚠️ No POI data available')
    }
    
    filteredPOIs.forEach((poi, index) => {
      try {
        if (index === 0) {
          console.log(`🗺️ Creating ${filteredPOIs.length} markers, first:`, {
            name: poi.name,
            type: poi.type,
            lat: poi.lat,
            lng: poi.lng,
            hasConfig: !!categoryConfig[poi.type]
          })
        }

        // Use default Leaflet markers temporarily to fix popup issue
        const markerIcon = new L.Icon.Default()
        
        // TODO: Re-enable custom icons once popup clicking is confirmed working
        // try {
        //   markerIcon = createCustomIcon(poi.type)
        // } catch (iconError) {
        //   console.warn('⚠️ Failed to create custom icon, using default:', iconError)
        //   markerIcon = new L.Icon.Default()
        // }
        
        const marker = L.marker([poi.lat, poi.lng], {
          icon: markerIcon,
          interactive: true,
          keyboard: false, // Prevent keyboard conflicts with map
          riseOnHover: true,
          riseOffset: 250
        })
        
        // Debug click handler to test popup functionality
        marker.on('click', (e) => {
          console.log('🖱️ Marker clicked:', poi.name, 'Opening popup...')
          marker.openPopup()
          // Prevent event bubbling to map
          L.DomEvent.stopPropagation(e)
        })

        // Legacy popup content code removed
        
        // Simple popup content to avoid rendering issues
        const simplePopup = `
          <div style="padding: 12px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 16px;">
              ${poi.name || 'Ukjent sted'}
            </h3>
            <p style="margin: 0 0 8px 0; color: #555; font-size: 14px;">
              ${poi.description || 'Ingen beskrivelse tilgjengelig'}
            </p>
            <div style="color: #777; font-size: 12px;">
              Type: ${categoryConfig[poi.type]?.name || poi.type}
            </div>
          </div>
        `
        
        marker.bindPopup(simplePopup, {
          maxWidth: 280,
          minWidth: 150,
          closeButton: true,
          autoClose: true,
          closeOnEscapeKey: true,
          keepInView: true
        })
        
        // Add popup debugging to verify popup creation\n        marker.on('popupopen', () => {\n          console.log('✅ Popup opened for:', poi.name)\n        })\n        \n        marker.on('popupclose', () => {\n          console.log('❌ Popup closed for:', poi.name)\n        })
        
        marker.addTo(mapInstanceRef.current!)
        markersRef.current.push(marker)
      } catch (error) {
        console.error(`❌ Failed to create marker for POI ${poi.name}:`, error)
      }
    })
    
    // Add simple test marker to debug popup visibility
    if (mapInstanceRef.current && filteredPOIs.length > 0) {
      console.log('🧪 Adding simple test marker with basic popup...')
      const testMarker = L.marker([59.9139, 10.7522])
      testMarker.bindPopup('<div><strong>TEST POPUP</strong><br>Can you see this?</div>')
      testMarker.addTo(mapInstanceRef.current)
      markersRef.current.push(testMarker)
    }

    if (filteredPOIs.length > 0) {
      console.log(`✅ Successfully added ${markersRef.current.length} markers to map`)
      console.log('💡 To test popups: Check some categories in sidebar, then click the blue Leaflet markers on the map')
      
      // Remove automatic popup opening to prevent loops
    } else if (pois.length > 0) {
      console.log('💡 No markers visible. Check some categories in the sidebar to see POI markers!')
    }
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
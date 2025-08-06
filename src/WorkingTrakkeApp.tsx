// Working TrakkeApp with manual Leaflet implementation
import React, { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
// Header component will be added later if needed
import { Sidebar } from './components/Sidebar'
import { SearchResult } from './services/searchService'
import { usePOIData } from './hooks/usePOIData'
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

// Create custom POI markers with Material Icons
function createCustomPOIMarker(poiType: POIType): L.DivIcon {
  const config = categoryConfig[poiType]
  if (!config) {
    return L.divIcon({
      html: `
        <div style="
          background: #666;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-family: 'Material Symbols Outlined';
          font-size: 18px;
          cursor: pointer;
        ">help</div>
      `,
      className: 'custom-poi-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    })
  }

  return L.divIcon({
    html: `
      <div style="
        background: ${config.color};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-family: 'Material Symbols Outlined';
        font-size: 18px;
        cursor: pointer;
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      ">${config.icon}</div>
    `,
    className: 'custom-poi-marker',
    iconSize: [32, 32], 
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

export function WorkingTrakkeApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [_searchResult, setSearchResult] = useState<SearchResult | null>(null)
  
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
  const updatePOIMarkersWithZoomRef = useRef<(() => void) | null>(null)

  // Use simple POI data (no heritage, no weather)
  const {
    pois,
    loading,
    error,
    lastUpdated,
    refreshData: refreshOutdoorData
  } = usePOIData()

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
        }).setView([64.5, 11.0], 6) // Center on central Norway with zoom to show most of the country
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18
        }).addTo(map)

        mapInstanceRef.current = map

        // Add zoom event to update POI visibility based on zoom level
        map.on('zoomend', () => {
          // Call the function through ref to avoid dependency issues
          if (updatePOIMarkersWithZoomRef.current) {
            updatePOIMarkersWithZoomRef.current()
          }
        })

        // Add click event to display coordinates
        map.on('click', (e) => {
          const lat = e.latlng.lat.toFixed(6)
          const lng = e.latlng.lng.toFixed(6)
          
          // Create popup with coordinates
          const popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(`
              <div style="min-width: 200px; text-align: center;">
                <strong>📍 Koordinater</strong><br>
                <div style="font-family: monospace; margin: 8px 0;">
                  <div>Bredde: ${lat}</div>
                  <div>Lengde: ${lng}</div>
                </div>
                <small style="color: #666;">Klikk for å kopiere</small>
              </div>
            `)
            .openOn(map)
          
          // Add click to copy functionality
          popup.getElement()?.addEventListener('click', () => {
            const coordinates = `${lat}, ${lng}`
            navigator.clipboard.writeText(coordinates).then(() => {
              console.log('📋 Koordinater kopiert:', coordinates)
              // Update popup content to show copied confirmation
              popup.setContent(`
                <div style="min-width: 200px; text-align: center;">
                  <strong>✅ Kopiert!</strong><br>
                  <div style="font-family: monospace; margin: 8px 0;">
                    <div>Bredde: ${lat}</div>
                    <div>Lengde: ${lng}</div>
                  </div>
                  <small style="color: #28a745;">Koordinater kopiert til utklippstavle</small>
                </div>
              `)
            }).catch(err => {
              console.error('Feil ved kopiering:', err)
            })
          })
        })

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

  // Function to determine if POI should be visible at current zoom level
  const shouldShowPOIAtZoom = useCallback((poiType: POIType, zoomLevel: number): boolean => {
    // Zoom level thresholds based on OSM best practices and Norwegian outdoor recreation needs
    
    // High priority POIs (always visible from zoom 11+)
    const highPriorityTypes: POIType[] = [
      'viewpoints', 'nature_gems', 'staffed_huts', 'camping_site', 
      'war_memorials', 'churches', 'mountain_peaks'
    ]
    
    // Medium priority POIs (visible from zoom 13+)  
    const mediumPriorityTypes: POIType[] = [
      'hiking', 'swimming', 'beach', 'self_service_huts', 'wilderness_shelter',
      'archaeological', 'protected_buildings', 'parking', 'cable_cars'
    ]
    
    // Low priority POIs (visible from zoom 15+)
    const lowPriorityTypes: POIType[] = [
      'tent_area', 'wild_camping', 'hammock_spots', 'rest_areas', 'toilets',
      'drinking_water', 'fire_places', 'information_boards', 'public_transport'
    ]
    
    // Very detailed POIs (visible from zoom 17+)
    const detailTypes: POIType[] = [
      'train_stations', 'fishing_spots', 'canoeing', 'mountain_service',
      'accessible_sites', 'ski_trails', 'lakes_rivers', 'ice_fishing'
    ]
    
    if (highPriorityTypes.includes(poiType)) return zoomLevel >= 4
    if (mediumPriorityTypes.includes(poiType)) return zoomLevel >= 5
    if (lowPriorityTypes.includes(poiType)) return zoomLevel >= 7
    if (detailTypes.includes(poiType)) return zoomLevel >= 9
    
    // Default: show at zoom 6+ for any unlisted types
    return zoomLevel >= 6
  }, [])

  // Function to update POI markers based on zoom level
  const updatePOIMarkersWithZoom = useCallback(() => {
    if (!mapInstanceRef.current) return
    
    const currentZoom = mapInstanceRef.current.getZoom()
    
    markersRef.current.forEach(marker => {
      const poiType = (marker as unknown as { poiType?: POIType }).poiType
      if (poiType) {
        const shouldShow = shouldShowPOIAtZoom(poiType, currentZoom)
        if (shouldShow && !mapInstanceRef.current!.hasLayer(marker)) {
          mapInstanceRef.current!.addLayer(marker)
        } else if (!shouldShow && mapInstanceRef.current!.hasLayer(marker)) {
          mapInstanceRef.current!.removeLayer(marker)
        }
      }
    })
  }, [shouldShowPOIAtZoom])

  // Store function in ref to avoid dependency issues in useEffect
  updatePOIMarkersWithZoomRef.current = updatePOIMarkersWithZoom

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

    // Minimal logging for development
    if (filteredPOIs.length > 0) {
      console.log(`📍 ${filteredPOIs.length} POIs visible on map`)
    }

    // Add new markers
    
    filteredPOIs.forEach((poi, _index) => {
      try {
        // Use custom Material Icons markers matching the sidebar categories
        const markerIcon = createCustomPOIMarker(poi.type)
        
        const marker = L.marker([poi.lat, poi.lng], {
          icon: markerIcon,
          interactive: true,
          keyboard: false, // Prevent keyboard conflicts with map
          riseOnHover: true,
          riseOffset: 250
        })
        
        // Store POI type on marker for zoom-based filtering
        ;(marker as unknown as { poiType: POIType }).poiType = poi.type
        
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
        
        // Add marker to reference array first
        markersRef.current.push(marker)
        
        // Only add to map if zoom level is appropriate
        const currentZoom = mapInstanceRef.current!.getZoom()
        if (shouldShowPOIAtZoom(poi.type, currentZoom)) {
          marker.addTo(mapInstanceRef.current!)
        }
      } catch (error) {
        console.error(`❌ Failed to create marker for POI ${poi.name}:`, error)
      }
    })
    
    // Test marker removed to prevent interference

    // Markers added successfully (logging removed to prevent loops)
  }, [pois, categoryState, shouldShowPOIAtZoom])

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



  // Refresh function
  const refreshData = useCallback(() => {
    refreshOutdoorData()
  }, [refreshOutdoorData])

  // Filter POIs based on active categories
  const activePOITypes = getActivePOITypes()
  const filteredPOIs = pois.filter(poi => activePOITypes.has(poi.type))
  const combinedError = error

  // App ready to render
  
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
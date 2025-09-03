// Working TrakkeApp with manual Leaflet implementation
import React, { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
// Header component will be added later if needed
import { Sidebar } from './components/Sidebar'
import { SearchResult } from './services/searchService'
import { useViewportPOIData } from './hooks/useViewportPOIData'
import { POI, POIType, categoryConfig, categoryTree, CategoryState, CategoryNode } from './data/pois'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Fix Leaflet default marker icons issue
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Create custom POI markers with Material Icons using industry-standard zoom scaling
function createCustomPOIMarker(poiType: POIType, zoom: number = 10): L.DivIcon {
  const config = categoryConfig[poiType]
  
  // Industry-standard POI scaling (Google Maps/Mapbox approach)
  // Progressive scaling tiers optimized for Norway's geographic scale
  let size: number, fontSize: number
  
  if (zoom <= 6) {
    // Country/continent view: Extremely small icons
    size = 6
    fontSize = 8
  } else if (zoom <= 8) {
    // Large regional view: Very small icons
    size = 10
    fontSize = 10
  } else if (zoom <= 10) {
    // Regional view: Small icons
    size = 14
    fontSize = 12
  } else if (zoom <= 12) {
    // Area view: Medium-small icons
    size = 18
    fontSize = 14
  } else if (zoom <= 14) {
    // City view: Medium icons
    size = 22
    fontSize = 16
  } else if (zoom <= 16) {
    // Local view: Large icons
    size = 28
    fontSize = 18
  } else {
    // Street/detail view: Very large icons
    size = 34
    fontSize = 20
  }
  
  if (!config) {
    return L.divIcon({
      html: `
        <div style="
          background: #666;
          color: white;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-family: 'Material Symbols Outlined';
          font-size: ${fontSize}px;
          cursor: pointer;
        ">help</div>
      `,
      className: 'custom-poi-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2]
    })
  }

  return L.divIcon({
    html: `
      <div style="
        background: ${config.color};
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-family: 'Material Symbols Outlined';
        font-size: ${fontSize}px;
        cursor: pointer;
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' ${fontSize};
      ">${config.icon}</div>
    `,
    className: 'custom-poi-marker',
    iconSize: [size, size], 
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  })
}

export function WorkingTrakkeApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [_searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [currentZoom, setCurrentZoom] = useState(6)
  
  // Initialize category state - auto-expand sections with available data
  const [categoryState, setCategoryState] = useState<CategoryState>({
    expanded: {
      'cultural_heritage': true, // Auto-expand Historiske steder to show Krigsminner is available
      'nature_experiences': true // Auto-expand Naturperler to show Utsiktspunkter is available
    }, 
    checked: {
      // All categories unchecked by default - user must select what they want to see
    }
  })
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const updateMarkersVisibilityRef = useRef<(() => void) | null>(null)

  // Use viewport-based POI data (industry standard approach)
  const {
    pois,
    loading,
    error,
    lastUpdated,
    loadPOIsForViewport,
    clearPOIs
  } = useViewportPOIData()
  

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

        // Add zoom event to update POI visibility and reload for new zoom level
        map.on('zoomend', () => {
          const newZoom = map.getZoom()
          setCurrentZoom(newZoom)
          
          // Update marker scaling and visibility
          if (updateMarkersVisibilityRef.current) {
            updateMarkersVisibilityRef.current()
          }
          
          // Load POIs for new zoom level if categories are selected
          loadPOIsForCurrentViewport()
        })

        // Add map move event to load new POIs when viewport changes
        map.on('moveend', () => {
          loadPOIsForCurrentViewport()
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
    
    // Debug: Log active types
    console.log(`🏷️ Category state:`, Object.entries(categoryState.checked).filter(([_, checked]) => checked))
    console.log(`🎯 Active POI types:`, Array.from(activeTypes))
    
    return activeTypes
  }, [categoryState])

  // Load POIs for current viewport based on selected categories
  const loadPOIsForCurrentViewport = useCallback(async () => {
    if (!mapInstanceRef.current) return

    const activePOITypes = Array.from(getActivePOITypes())
    if (activePOITypes.length === 0) {
      clearPOIs()
      return
    }

    const bounds = mapInstanceRef.current.getBounds()
    const viewportBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(), 
      east: bounds.getEast(),
      west: bounds.getWest()
    }

    await loadPOIsForViewport(viewportBounds, activePOITypes)
  }, [getActivePOITypes, loadPOIsForViewport, clearPOIs])

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

  // Update POI markers when POI data changes (not category state)
  useEffect(() => {
    console.log(`🔧 Marker creation effect triggered. POIs: ${pois.length}, map: ${!!mapInstanceRef.current}`)
    
    if (!mapInstanceRef.current || pois.length === 0) {
      console.log(`⚠️ Early return: map=${!!mapInstanceRef.current}, pois=${pois.length}`)
      return
    }

    console.log(`🎯 Creating markers for ${pois.length} POIs`)
    
    // Use requestAnimationFrame to batch DOM operations
    requestAnimationFrame(() => {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        mapInstanceRef.current?.removeLayer(marker)
      })
      markersRef.current = []

      // Create all markers but don't add to map yet
      const allMarkers: L.Marker[] = []
      
      pois.forEach((poi, index) => {
        try {
          const currentMapZoom = mapInstanceRef.current?.getZoom() || 10
          const markerIcon = createCustomPOIMarker(poi.type, currentMapZoom)
          
          // Debug: Log first few POI coordinates
          if (index < 5) {
            console.log(`🗺️ Creating marker ${index}: ${poi.name} at [${poi.lat}, ${poi.lng}] type: ${poi.type}`)
          }
          
          const marker = L.marker([poi.lat, poi.lng], {
            icon: markerIcon,
            interactive: true,
            keyboard: false,
            riseOnHover: true,
            riseOffset: 250
          })
          
          // Store POI type and reference for filtering
          ;(marker as unknown as { poiType: POIType }).poiType = poi.type
          ;(marker as unknown as { poiData: POI }).poiData = poi
          
          // Create popup content once
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
          
          marker.bindPopup(popupContent, {
            maxWidth: 300,
            closeButton: true,
            autoClose: true,
            closeOnClick: true,
            closeOnEscapeKey: true
          })
          
          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e)
          })
          
          allMarkers.push(marker)
        } catch (error) {
          console.error(`❌ Failed to create marker for POI ${poi.name}:`, error)
        }
      })

      // Store all markers
      markersRef.current = allMarkers
      console.log(`✅ Created ${allMarkers.length} markers, applying visibility`)
      
      // Apply current filters and zoom visibility
      updateMarkersVisibility()
    })
  }, [pois]) // Only depend on POI data, not category state

  // Separate function to update marker visibility and icon scaling based on categories and zoom
  const updateMarkersVisibility = useCallback(() => {
    if (!mapInstanceRef.current) return

    const activePOITypes = getActivePOITypes()
    const currentZoom = mapInstanceRef.current.getZoom()
    
    console.log(`🔍 Updating visibility: ${markersRef.current.length} markers, active types: ${Array.from(activePOITypes).join(', ')}, zoom: ${currentZoom}`)
    
    // Use requestAnimationFrame to batch visibility updates and icon scaling
    requestAnimationFrame(() => {
      let visibleCount = 0
      let debugCount = 0
      markersRef.current.forEach(marker => {
        const poiType = (marker as unknown as { poiType: POIType }).poiType
        const shouldShow = activePOITypes.has(poiType) && shouldShowPOIAtZoom(poiType, currentZoom)
        const isOnMap = mapInstanceRef.current!.hasLayer(marker)
        
        // Debug first few markers
        if (debugCount < 3) {
          const poiData = (marker as unknown as { poiData: POI }).poiData
          console.log(`🔍 Marker ${debugCount}: ${poiData?.name} type:${poiType} shouldShow:${shouldShow} isOnMap:${isOnMap} activeTypes:${activePOITypes.has(poiType)} zoomOK:${shouldShowPOIAtZoom(poiType, currentZoom)}`)
          debugCount++
        }
        
        // Update icon with new zoom-based scaling
        const newIcon = createCustomPOIMarker(poiType, currentZoom)
        marker.setIcon(newIcon)
        
        // Update visibility
        if (shouldShow && !isOnMap) {
          marker.addTo(mapInstanceRef.current!)
          visibleCount++
        } else if (!shouldShow && isOnMap) {
          mapInstanceRef.current!.removeLayer(marker)
        } else if (shouldShow && isOnMap) {
          visibleCount++ // Already visible
        }
      })
      console.log(`✅ Visibility update complete: ${visibleCount} markers now visible`)
    })
  }, [getActivePOITypes, shouldShowPOIAtZoom])

  // Store function in ref to avoid dependency issues in useEffect
  updateMarkersVisibilityRef.current = updateMarkersVisibility

  // Update visibility when categories change
  useEffect(() => {
    updateMarkersVisibility()
  }, [categoryState, updateMarkersVisibility])

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
    
    // Clear POIs and reload for new category selection
    clearPOIs()
    setTimeout(() => {
      loadPOIsForCurrentViewport()
    }, 100)
  }, [clearPOIs, loadPOIsForCurrentViewport])

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



  // Load POIs when categories change
  useEffect(() => {
    loadPOIsForCurrentViewport()
  }, [categoryState, loadPOIsForCurrentViewport])

  // Refresh function
  const refreshData = useCallback(() => {
    loadPOIsForCurrentViewport()
  }, [loadPOIsForCurrentViewport])

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
          {/* Viewport-based loading is non-blocking - no loading overlay needed */}
          
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
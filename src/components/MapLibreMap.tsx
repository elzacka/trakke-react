import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { POI, CategoryState, CategoryNode } from '../data/pois'
import { SearchResult } from '../services/searchService'

// ARCHITECTURAL SAFEGUARDS - PREVENT REGRESSION TO OLD APPROACHES
// ================================================================
// 🚫 NO GeoJSON - This file must NEVER use GeoJSON for POI rendering
// 🚫 NO WMS Raster tiles - This file must NEVER use Kartverket WMS raster tiles
// ✅ API-BASED POI rendering using custom DOM overlays (not MapLibre markers)
// ✅ WMTS tiles only for base map
// ================================================================


export interface MapLibreMapRef {
  resetBearing: () => void
  getMap: () => maplibregl.Map | null
}

export interface MapLibreMapProps {
  pois: POI[]
  categoryState: CategoryState
  categoryTree: CategoryNode[]
  onCategoryToggle: (nodeId: string) => void
  onExpandToggle: (nodeId: string) => void
  searchResult?: SearchResult | null
  userLocation?: {lat: number, lng: number} | null
  onViewportChange?: (viewport: {
    north: number
    south: number
    east: number
    west: number
    zoom: number
  }) => void
  onBearingChange?: (bearing: number) => void
  sidebarCollapsed?: boolean // Add sidebar state for overlay behavior
}

export const MapLibreMap = forwardRef<MapLibreMapRef, MapLibreMapProps>(({
  pois,
  categoryState: _categoryState,
  categoryTree: _categoryTree,
  onCategoryToggle: _onCategoryToggle,
  onExpandToggle: _onExpandToggle,
  searchResult,
  userLocation,
  onViewportChange,
  onBearingChange,
  sidebarCollapsed = true
}, ref) => {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const onViewportChangeRef = useRef(onViewportChange)
  const onBearingChangeRef = useRef(onBearingChange)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [currentZoom, setCurrentZoom] = useState<number>(13)
  const [coordinatesCopied, setCoordinatesCopied] = useState(false)
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null)
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null)
  const positionMarkerRef = useRef<maplibregl.Marker | null>(null)

  // Expose map methods to parent component
  useImperativeHandle(ref, () => ({
    resetBearing: () => {
      if (mapRef.current) {
        mapRef.current.easeTo({
          bearing: 0,
          duration: 500
        })
      }
    },
    getMap: () => mapRef.current
  }))

  // Copy coordinates to clipboard
  const handleCopyCoordinates = async () => {
    if (!coordinates) return

    try {
      const coordinatesText = `${coordinates.lat.toFixed(5)}°N, ${coordinates.lng.toFixed(5)}°E`
      await navigator.clipboard.writeText(coordinatesText)
      setCoordinatesCopied(true)

      // Reset copy feedback after 2 seconds
      setTimeout(() => {
        setCoordinatesCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy coordinates:', error)
    }
  }

  // Update refs when callbacks change
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange
  }, [onViewportChange])

  useEffect(() => {
    onBearingChangeRef.current = onBearingChange
  }, [onBearingChange])

  // Initialize map only once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    console.log('🗺️ [DEBUG] Initializing MapLibre with Kartverket topographic raster tiles...')

    // Map initialization function
    const initializeWithLocation = (center: [number, number]) => {
      const map = new maplibregl.Map({
        container: containerRef.current!,
        // KARTVERKET TOPOGRAPHIC MAP - Using WMTS raster tiles (vector tiles not available)
        // Custom MapLibre style with Kartverket's official topographic raster tiles
        style: {
          version: 8,
          sources: {
            'kartverket-topo': {
              type: 'raster',
              tiles: [
                'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'
              ],
              tileSize: 256,
              attribution: '© Kartverket',
              minzoom: 0,
              maxzoom: 17 // Practical limit for Kartverket WMTS tiles
            }
          },
          layers: [
            {
              id: 'kartverket-topo-layer',
              type: 'raster',
              source: 'kartverket-topo',
              minzoom: 0,
              maxzoom: 17 // Match practical tile availability limit
            }
          ]
        },
        center: center,
        zoom: 13,
        minZoom: 3, // Prevent zooming out too far (Norway-wide view)
        maxZoom: 17, // Practical maximum for Kartverket tiles without grey areas
        bearing: 0,
        pitch: 0,
        interactive: true,
        dragPan: true,
        dragRotate: true,
        scrollZoom: { around: 'center' },
        boxZoom: true,
        doubleClickZoom: true,
        keyboard: true,
        touchZoomRotate: true,
        // Disable default attribution control - using custom credits component instead
        attributionControl: false,
        // Allow all tile requests - let Kartverket handle availability
        transformRequest: (url: string) => {
          return { url, credentials: 'same-origin' }
        }
      })
      return map
    }

    // Setup map event handlers
    const setupMapEventHandlers = (map: maplibregl.Map) => {
      // No default controls - using custom overlay UI components instead

      map.on('load', () => {
        console.log('✅ MapLibre loaded with Kartverket topographic raster tiles')
        setMapLoaded(true)
        
        // Emit initial viewport bounds
        setTimeout(() => {
          if (onViewportChangeRef.current) {
            const bounds = map.getBounds()
            onViewportChangeRef.current({
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest(),
              zoom: map.getZoom()
            })
          }
        }, 100)
      })

      // Handle viewport changes
      const handleViewportChange = () => {
        if (onViewportChangeRef.current) {
          const bounds = map.getBounds()
          onViewportChangeRef.current({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
            zoom: map.getZoom()
          })
        }
      }

      map.on('moveend', handleViewportChange)
      map.on('zoomend', handleViewportChange)

      // Handle bearing changes for compass
      const handleBearingChange = () => {
        if (onBearingChangeRef.current) {
          onBearingChangeRef.current(map.getBearing())
        }
      }

      map.on('rotate', handleBearingChange)
      map.on('rotateend', handleBearingChange)

      // Listen for zoom events to track zoom level
      map.on('zoom', () => {
        setCurrentZoom(map.getZoom())
        // Close any custom popups during zoom for better UX
        const existingPopups = document.querySelectorAll('.custom-poi-popup')
        existingPopups.forEach(popup => popup.remove())
      })
      map.on('zoomend', () => setCurrentZoom(map.getZoom()))
      
      // Emit initial bearing
      setTimeout(() => {
        if (onBearingChangeRef.current) {
          onBearingChangeRef.current(map.getBearing())
        }
      }, 100)

      // Track mouse coordinates
      map.on('mousemove', (e) => {
        setCoordinates({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng
        })
      })

      mapRef.current = map
    }

    // Try geolocation first, fallback to Oslo
    if (navigator.geolocation) {
      console.log('🌍 Attempting to get user location...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCenter: [number, number] = [position.coords.longitude, position.coords.latitude]
          console.log(`📍 Using user location: [${userCenter[1]}, ${userCenter[0]}]`)
          const map = initializeWithLocation(userCenter)
          setupMapEventHandlers(map)
        },
        (error) => {
          console.log(`❌ Geolocation failed: ${error.message}, using Oslo fallback`)
          const osloCenter: [number, number] = [10.7522, 59.9139]
          const map = initializeWithLocation(osloCenter)
          setupMapEventHandlers(map)
        },
        { timeout: 5000, maximumAge: 300000 }
      )
    } else {
      console.log('📍 No geolocation support, using Oslo fallback')
      const osloCenter: [number, number] = [10.7522, 59.9139]
      const map = initializeWithLocation(osloCenter)
      setupMapEventHandlers(map)
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      // Clean up custom overlays
      const existingOverlays = document.querySelectorAll('.custom-poi-overlay')
      existingOverlays.forEach(overlay => overlay.remove())
    }
  }, []) // Empty dependency array - initialize map only once

  // API-BASED POI RENDERING - Using Custom DOM Overlays (not MapLibre markers)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current
    console.log(`🎯 API-based POI rendering: ${pois.length} POIs`)

    // Clean up existing POI overlays
    const existingOverlays = document.querySelectorAll('.custom-poi-overlay')
    existingOverlays.forEach(overlay => overlay.remove())

    console.log(`🎯 Creating ${pois.length} POI markers`)

    // Create API-based POI markers using custom DOM overlays positioned over the map
    pois.forEach((poi, index) => {
      console.log(`🎨 Creating marker ${index + 1} for POI:`, poi.name, 'with color:', poi.color, 'at coords:', poi.lat, poi.lng)

      // Create overlay container
      const overlay = document.createElement('div')
      overlay.className = 'custom-poi-overlay'
      overlay.style.cssText = `
        position: absolute;
        z-index: 100;
        pointer-events: auto;
        transform: translate(-50%, -50%);
      `

      // Create the actual marker element
      const markerElement = document.createElement('div')
      markerElement.className = 'custom-poi-marker'
      markerElement.style.cssText = `
        width: 20px;
        height: 20px;
        background: ${poi.color};
        background-color: ${poi.color};
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: block;
        transition: all 0.2s ease;
      `

      overlay.appendChild(markerElement)

      // Function to update overlay position
      const updatePosition = () => {
        const point = map.project([poi.lng, poi.lat])
        overlay.style.left = point.x + 'px'
        overlay.style.top = point.y + 'px'
      }

      // Initial position
      updatePosition()

      // Update position on map move/zoom
      map.on('move', updatePosition)
      map.on('zoom', updatePosition)

      // Add overlay to map container
      map.getContainer().appendChild(overlay)

      console.log('✅ Marker overlay added to map with color:', poi.color)

      // Enhanced hover effects with smooth animations
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.15)'
        markerElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
        markerElement.style.zIndex = '101'
      })
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1.0)'
        markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
        markerElement.style.zIndex = '100'
      })

      // Add click handler for custom popup
      markerElement.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()

        // Close any existing popups
        const existingPopups = document.querySelectorAll('.custom-poi-popup')
        existingPopups.forEach(popup => popup.remove())

        // Parse description for popup content
        const parts = poi.description ? poi.description.split('. ') : []
        const categoryName = parts[0] || poi.name || 'Ukjent sted'
        const additionalInfo = parts.slice(1).join('. ')

        const headerText = categoryName
        const detailText = (poi.name && poi.name !== categoryName)
          ? `${poi.name}${additionalInfo ? '. ' + additionalInfo : ''}`
          : (additionalInfo || '')

        const formattedDetailText = detailText
          ? detailText.replace(/📖 Les mer: (https?:\/\/[^\s.]+)/g, '<br><a href="$1" target="_blank" style="color: #2c5530; text-decoration: none;">📖 Les mer på Wikipedia →</a>')
                      .replace(/📖 Wikidata: (https?:\/\/[^\s.]+)/g, '<br><a href="$1" target="_blank" style="color: #2c5530; text-decoration: none;">📖 Se på Wikidata →</a>')
          : 'Ingen tilleggsinformasjon'

        // Get marker position relative to viewport
        const mapContainer = map.getContainer()
        const mapRect = mapContainer.getBoundingClientRect()
        const point = map.project([poi.lng, poi.lat])

        // Create custom popup
        const popup = document.createElement('div')
        popup.className = 'custom-poi-popup'
        popup.style.cssText = `
          position: absolute;
          left: ${point.x}px;
          top: ${point.y}px;
          transform: translate(-50%, -100%);
          margin-top: -15px;
          z-index: 1000;
          pointer-events: auto;
        `

        popup.innerHTML = `
          <div style="
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
            max-width: 320px;
            min-width: 280px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.2);
          ">
            <!-- Close button -->
            <button onclick="this.closest('.custom-poi-popup').remove()" style="
              position: absolute;
              top: 8px;
              right: 8px;
              width: 24px;
              height: 24px;
              border: none;
              background: rgba(0,0,0,0.1);
              border-radius: 50%;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              font-size: 14px;
              color: #666;
              transition: background 0.2s ease;
              z-index: 1001;
            " onmouseover="this.style.background='rgba(0,0,0,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">
              ×
            </button>

            <!-- Header -->
            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 16px 16px 12px 16px;
              border-bottom: 1px solid rgba(0,0,0,0.1);
            ">
              <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${poi.color || '#8B4B8B'}, ${adjustBrightness(poi.color || '#8B4B8B', -20)});
                flex-shrink: 0;
              "></div>
              <h3 style="
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                line-height: 1.3;
              ">${headerText}</h3>
            </div>

            <!-- Body -->
            <div style="
              padding: 12px 16px 16px 16px;
              font-size: 14px;
              line-height: 1.5;
              color: #4b5563;
            ">
              ${formattedDetailText}
            </div>

            <!-- Arrow pointing to marker -->
            <div style="
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-top: 8px solid white;
            "></div>
          </div>
        `

        // Add popup to map container so it moves with the map
        mapContainer.appendChild(popup)

        // Close popup when clicking outside
        const closeOnClickOutside = (e: Event) => {
          if (!popup.contains(e.target as Node) && !overlay.contains(e.target as Node)) {
            popup.remove()
            document.removeEventListener('click', closeOnClickOutside)
          }
        }
        setTimeout(() => document.addEventListener('click', closeOnClickOutside), 100)
      })
    })

    console.log(`✅ Created ${pois.length} API-based POI overlays`)
  }, [mapLoaded, pois])

  // Handle search result centering
  useEffect(() => {
    if (!mapRef.current || !searchResult) return

    const map = mapRef.current
    console.log(`🔍 Centering map on search result: ${searchResult.displayName}`)
    console.log('🔍 Creating search marker at coordinates:', searchResult.lat, searchResult.lng)
    
    // Remove existing search marker if it exists
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove()
    }
    
    // Create modern search marker
    const searchElement = document.createElement('div')
    searchElement.className = 'search-marker'
    searchElement.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #ff0000 !important;
      border: 4px solid #ffffff !important;
      box-shadow: 0 4px 16px rgba(255, 0, 0, 0.8) !important;
      position: absolute !important;
      z-index: 9999 !important;
      transform: translate(-50%, -50%) !important;
      pointer-events: auto !important;
    `
    searchElement.innerHTML = '<div style="width: 100%; height: 100%; background: red; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">S</div>'
    
    const searchMarker = new maplibregl.Marker(searchElement)
      .setLngLat([searchResult.lng, searchResult.lat])
      .addTo(map)

    searchMarkerRef.current = searchMarker
    console.log('✅ Search marker added to map successfully')
    
    // Center map on search result
    map.flyTo({
      center: [searchResult.lng, searchResult.lat],
      zoom: 15,
      duration: 1000
    })
  }, [searchResult])

  // Handle user location centering and marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return

    const map = mapRef.current
    console.log(`📍 Centering map on user location: ${userLocation.lat}, ${userLocation.lng}`)
    console.log('📍 Creating position marker at coordinates:', userLocation.lat, userLocation.lng)
    
    // Remove existing user location marker if it exists
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove()
    }
    
    // Create user location marker with pulsing animation
    const locationElement = document.createElement('div')
    locationElement.className = 'user-location-marker'
    locationElement.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0d9488, #0891b2);
      border: 3px solid white;
      box-shadow: 0 4px 16px rgba(13, 148, 136, 0.4), 0 2px 8px rgba(0,0,0,0.1);
      animation: locationPulse 2s infinite;
      position: relative;
    `
    
    // Add inner dot for better visibility
    const innerDot = document.createElement('div')
    innerDot.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: white;
    `
    locationElement.appendChild(innerDot)
    
    const locationMarker = new maplibregl.Marker(locationElement)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map)
    
    userLocationMarkerRef.current = locationMarker

    // Remove existing position marker if it exists
    if (positionMarkerRef.current) {
      positionMarkerRef.current.remove()
    }

    // Create position marker (distinct from user location marker)
    const positionElement = document.createElement('div')
    positionElement.className = 'position-marker'
    positionElement.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #0000ff !important;
      border: 4px solid #ffffff !important;
      box-shadow: 0 4px 16px rgba(0, 0, 255, 0.8) !important;
      position: absolute !important;
      z-index: 9999 !important;
      transform: translate(-50%, -50%) !important;
      pointer-events: auto !important;
    `
    positionElement.innerHTML = '<div style="width: 100%; height: 100%; background: blue; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">P</div>'

    const positionMarker = new maplibregl.Marker(positionElement)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map)

    positionMarkerRef.current = positionMarker
    console.log('✅ Position marker added to map successfully')

    // Fly to user location
    map.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 1500
    })
  }, [userLocation])

  return (
    <div className="map-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Scale and Coordinate Display - Bottom Center */}
      {coordinates && (() => {
        // Calculate map scale based on zoom level and latitude - Kartverket WMTS compatible
        const calculateMapScale = (zoom: number, latitude: number): string => {
          // Web Mercator scale factor calculation (EPSG:3857 used by Kartverket WMTS)
          // Based on official formula: 156543.03392 * Math.cos(latitude) / Math.pow(2, z) meters per pixel
          const metersPerPixel = 156543.03392 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom)
          
          // Calculate scale for a standardized 60px reference line (common cartographic practice)
          const referencePixels = 60
          const referenceMeters = metersPerPixel * referencePixels
          
          // Round to cartographically appropriate values
          if (referenceMeters >= 1000) {
            const km = referenceMeters / 1000
            if (km >= 50) return `${Math.round(km / 10) * 10}km`      // Round to 10s above 50km
            else if (km >= 10) return `${Math.round(km / 5) * 5}km`   // Round to 5s between 10-50km
            else if (km >= 2) return `${Math.round(km)}km`            // Round to 1s between 2-10km
            else return `${km.toFixed(1)}km`                          // 1 decimal below 2km
          } else {
            if (referenceMeters >= 500) return `${Math.round(referenceMeters / 100) * 100}m`      // Round to 100s above 500m
            else if (referenceMeters >= 100) return `${Math.round(referenceMeters / 50) * 50}m`   // Round to 50s between 100-500m
            else if (referenceMeters >= 20) return `${Math.round(referenceMeters / 10) * 10}m`    // Round to 10s between 20-100m
            else return `${Math.round(referenceMeters)}m`                                         // Round to 1s below 20m
          }
        }
        
        const scaleText = calculateMapScale(currentZoom, coordinates.lat)
        
        return (
        <>
          {/* Scale Line - Bottom Left Corner */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px', // As specified
            color: '#374151', // As specified
            opacity: 0.6, // Idle opacity as specified
            pointerEvents: 'none'
          }}>
            <span style={{
              fontFamily: 'Material Symbols Outlined',
              fontSize: '14px',
              color: '#374151'
            }}>
              straighten
            </span>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}>
              {/* Scale bar */}
              <div style={{
                width: '60px',
                height: '3px',
                background: '#374151',
                borderRadius: '1px',
                position: 'relative'
              }}>
                {/* Scale bar end caps */}
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '-2px',
                  width: '1px',
                  height: '7px',
                  background: '#374151'
                }} />
                <div style={{
                  position: 'absolute',
                  right: '0',
                  top: '-2px',
                  width: '1px',
                  height: '7px',
                  background: '#374151'
                }} />
              </div>
              {/* Scale text */}
              <span style={{
                fontFamily: 'SF Mono, Monaco, "Cascadia Code", "Roboto Mono", monospace',
                fontSize: '10px',
                fontWeight: '600',
                color: '#374151'
              }}>
                {scaleText}
              </span>
            </div>
          </div>

          {/* Coordinates Display - Bottom Left with overlay behavior */}
          <div
            className="coordinate-display"
            onClick={handleCopyCoordinates}
            title={coordinatesCopied ? "Koordinater kopiert!" : "Klikk for å kopiere koordinater"}
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              zIndex: 100,
              // Styling adapts based on sidebar state as specified
              ...(sidebarCollapsed ? {
                // On Map styling
                background: coordinatesCopied ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.8)',
                borderRadius: '4px',
                padding: '4px 6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                fontSize: '12px',
                color: coordinatesCopied ? '#ffffff' : '#374151'
              } : {
                // On Sidebar Overlay styling
                background: coordinatesCopied ? '#22c55e' : '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '4px 6px',
                fontSize: '12px',
                color: coordinatesCopied ? '#ffffff' : '#111827',
                fontWeight: '500'
              }),
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '60px', // Space below scale line
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}>
            <span style={{
              fontFamily: 'Material Symbols Outlined',
              fontSize: '14px',
              color: coordinatesCopied ? '#ffffff' : (sidebarCollapsed ? '#374151' : '#111827')
            }}>
              my_location
            </span>
            <span style={{
              fontFamily: 'SF Mono, Monaco, "Cascadia Code", "Roboto Mono", monospace',
              fontSize: '11px',
              fontWeight: sidebarCollapsed ? '500' : '500'
            }}>
              {coordinates.lat.toFixed(5)}°N, {coordinates.lng.toFixed(5)}°E
            </span>
          </div>
        </>
        )
      })()}
      
      <style>{`
        /* Clean map styling - no default controls */
        
        /* Hide any remaining MapLibre attribution elements */
        .maplibregl-ctrl-attrib,
        .maplibregl-ctrl-bottom-right,
        .maplibregl-ctrl-bottom-left {
          display: none !important;
        }
        
        /* POI Popup Styling */
        .maplibregl-popup-content {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(16px) !important;
          border-radius: 12px !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          padding: 0 !important;
          max-width: 320px !important;
          min-width: 260px !important;
        }
        
        .poi-popup-content {
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .poi-popup-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .poi-popup-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }
        
        .poi-popup-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1F2937;
          line-height: 1.3;
        }
        
        .poi-popup-body {
          font-size: 13px;
          color: #4B5563;
          line-height: 1.5;
          margin: 0;
        }
        
        .poi-popup-body a {
          color: #059669;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        
        .poi-popup-body a:hover {
          color: #047857;
          text-decoration: underline;
        }
        
        .maplibregl-popup-tip {
          border-top-color: rgba(255, 255, 255, 0.98) !important;
          border-bottom-color: rgba(255, 255, 255, 0.98) !important;
        }
        
        .maplibregl-popup-close-button {
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          width: 24px !important;
          height: 24px !important;
          border-radius: 50% !important;
          background: rgba(0, 0, 0, 0.05) !important;
          border: none !important;
          font-size: 16px !important;
          color: #6B7280 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
        }
        
        .maplibregl-popup-close-button:hover {
          background: rgba(0, 0, 0, 0.1) !important;
          color: #374151 !important;
        }
        
        /* Search marker animation */
        @keyframes searchPulse {
          0% {
            box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 0 rgba(255, 107, 107, 0.7);
          }
          70% {
            box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 12px rgba(255, 107, 107, 0);
          }
          100% {
            box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 0 rgba(255, 107, 107, 0);
          }
        }
        
        /* User location marker animation */
        @keyframes locationPulse {
          0% {
            box-shadow: 0 4px 16px rgba(13, 148, 136, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 0 rgba(13, 148, 136, 0.7);
          }
          70% {
            box-shadow: 0 4px 16px rgba(13, 148, 136, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 10px rgba(13, 148, 136, 0);
          }
          100% {
            box-shadow: 0 4px 16px rgba(13, 148, 136, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 0 rgba(13, 148, 136, 0);
          }
        }

        /* Position marker animation */
        @keyframes positionPulse {
          0% {
            box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 0 rgba(220, 38, 38, 0.7);
          }
          70% {
            box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 14px rgba(220, 38, 38, 0);
          }
          100% {
            box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 0 rgba(220, 38, 38, 0);
          }
        }
        
        /* Aggressive POI marker overrides */
        .custom-poi-marker {
          transition: all 0.2s ease !important;
        }

        .custom-poi-marker:hover {
          transform: scale(1.15) !important;
          z-index: 1000 !important;
        }

        /* Override ALL MapLibre marker default styling - COMMENTED OUT TO ALLOW SEARCH/LOCATION MARKERS */
        /*
        .maplibregl-marker {
          background: none !important;
          border: none !important;
          cursor: inherit !important;
        }

        .maplibregl-marker svg {
          display: none !important;
        }

        .maplibregl-marker .custom-poi-marker {
          background: inherit !important;
          background-color: inherit !important;
          border: inherit !important;
          box-shadow: inherit !important;
        }

        /* Force override MapLibre's default blue marker */
        .maplibregl-marker .maplibregl-marker-anchor {
          display: none !important;
        }
        */
      `}</style>
    </div>
  )
})

// Extend window for search marker
declare global {
  interface Window {
    searchMarker?: maplibregl.Marker
  }
}

// Helper function to adjust color brightness
function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
}
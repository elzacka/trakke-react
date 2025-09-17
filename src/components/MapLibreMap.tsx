import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { POI, CategoryState, CategoryNode } from '../data/pois'
import { SearchResult } from '../services/searchService'
import { KartverketTrailService } from '../services/kartverketTrailService'

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
  mapType?: 'topo' | 'satellite' // Map type selection
}

export const MapLibreMap = forwardRef<MapLibreMapRef, MapLibreMapProps>(({
  pois,
  categoryState,
  categoryTree: _categoryTree,
  onCategoryToggle: _onCategoryToggle,
  onExpandToggle: _onExpandToggle,
  searchResult,
  userLocation,
  onViewportChange,
  onBearingChange,
  sidebarCollapsed = true,
  mapType = 'topo'
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

  // Create map style based on map type - shared function
  const createMapStyle = (mapType: 'topo' | 'satellite') => {
    const baseStyle = {
      version: 8 as const,
      sources: {} as Record<string, maplibregl.SourceSpecification>,
      layers: [] as maplibregl.LayerSpecification[]
    }

    if (mapType === 'topo') {
      // Kartverket Topographic Map
      baseStyle.sources['kartverket-topo'] = {
        type: 'raster',
        tiles: [
          // Official Kartverket WMTS cache service (2025)
          'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'
        ],
        tileSize: 256,
        attribution: '© Kartverket',
        minzoom: 0,
        maxzoom: 20 // Official Geonorge WMTS specification: 21 levels (0-20)
      }
      baseStyle.layers.push({
        id: 'kartverket-topo-layer',
        type: 'raster',
        source: 'kartverket-topo',
        minzoom: 0,
        maxzoom: 20
      })
    } else {
      // Satellite Map - Using Esri World Imagery (widely available satellite imagery)
      baseStyle.sources['esri-satellite'] = {
        type: 'raster',
        tiles: [
          // Esri World Imagery - free satellite imagery service
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '© Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA FSA, USGS, Aerogrid, IGN, IGP, and the GIS User Community',
        minzoom: 0,
        maxzoom: 18 // Conservative limit to avoid grey tiles - Esri has reliable coverage up to zoom 18
      }
      baseStyle.layers.push({
        id: 'esri-satellite-layer',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 18
      })
    }

    return baseStyle
  }

  // Initialize map only once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    console.log(`🗺️ [DEBUG] Initializing MapLibre with ${mapType} map type...`)

    // Map initialization function
    const initializeWithLocation = (center: [number, number]) => {
      const map = new maplibregl.Map({
        container: containerRef.current!,
        // Dynamic map style based on mapType prop
        style: createMapStyle(mapType),
        center: center,
        zoom: 13,
        minZoom: 3, // Prevent zooming out too far (Norway-wide view)
        maxZoom: mapType === 'topo' ? 17 : 16, // Conservative: Topo 17 (Kartverket), Satellite 16 (Esri reliable coverage)
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
        // Standard WMTS request handling - no special headers needed
        transformRequest: (url: string) => {
          return { url }
        }
      })
      return map
    }

    // Setup map event handlers
    const setupMapEventHandlers = (map: maplibregl.Map) => {
      // No default controls - using custom overlay UI components instead

      map.on('load', () => {
        console.log(`✅ MapLibre loaded with ${mapType} map tiles`)
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

      // Monitor tile loading and zoom events for debugging - FIXED SOURCE ID
      map.on('data', (e: maplibregl.MapDataEvent) => {
        if ((e as unknown as {sourceId?: string, isSourceLoaded?: boolean}).sourceId === 'kartverket-topo' &&
            (e as unknown as {sourceId?: string, isSourceLoaded?: boolean}).isSourceLoaded === false) {
          console.log(`🔄 [TILE DEBUG] Loading tiles at zoom ${map.getZoom().toFixed(2)}`)
        }
      })

      map.on('sourcedataloading', (e: maplibregl.MapDataEvent) => {
        if ((e as unknown as {sourceId?: string}).sourceId === 'kartverket-topo') {
          console.log(`⏳ [TILE DEBUG] Tile loading started at zoom ${map.getZoom().toFixed(2)}`)
        }
      })

      // Enhanced tile error handling and debugging
      map.on('sourcedata', (e: maplibregl.MapDataEvent) => {
        const eventData = e as unknown as {sourceId?: string, isSourceLoaded?: boolean}
        if (eventData.sourceId === 'kartverket-topo') {
          if (eventData.isSourceLoaded) {
            console.log(`✅ [TILE DEBUG] Source loaded successfully at zoom ${map.getZoom().toFixed(2)}`)
          } else {
            console.log(`⚠️ [TILE DEBUG] Source loading issue at zoom ${map.getZoom().toFixed(2)}`)
          }
        }
      })

      // Detailed tile request monitoring with URL inspection
      map.on('dataloading', (e: maplibregl.MapDataEvent) => {
        if ((e as unknown as {sourceId?: string}).sourceId === 'kartverket-topo') {
          const zoom = map.getZoom()
          console.log(`📡 [TILE DEBUG] Data loading event at zoom ${zoom.toFixed(2)}`, e)

          // Log tile requests at critical zoom levels
          if (zoom >= 15) {
            console.log(`📡 [HIGH ZOOM] Tile request at zoom ${zoom.toFixed(2)} - monitoring for failures`)
          }
        }
      })

      // Enhanced error handling with tile-specific debugging
      map.on('error', (e) => {
        const zoom = map.getZoom()
        const center = map.getCenter()
        console.error(`❌ [MAP ERROR] Zoom ${zoom.toFixed(2)}, Center: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}:`, e)

        // Check if error is tile-related at critical zoom
        if (e.error && e.error.message) {
          console.error(`❌ [ERROR DETAILS] ${e.error.message}`)
          if (e.error.message.includes('404') || e.error.message.includes('tile')) {
            console.error(`❌ [TILE ERROR] Tile loading failed - this may be the grey map cause!`)
          }
        }
      })

      // Monitor tile loading failures specifically
      map.on('sourceerror', (e) => {
        console.error(`❌ [SOURCE ERROR] Source: ${e.sourceId}`, e)
        if (e.sourceId === 'kartverket-topo') {
          console.error(`❌ [KARTVERKET ERROR] Topographic tiles failed to load at zoom ${map.getZoom().toFixed(2)}`)
        } else if (e.sourceId === 'esri-satellite') {
          console.error(`❌ [ESRI ERROR] Satellite tiles failed to load at zoom ${map.getZoom().toFixed(2)}`)
        }
      })

      // Enhanced zoom tracking with coordinate/projection debugging
      map.on('zoomend', () => {
        const currentZoom = map.getZoom()
        const center = map.getCenter()
        const calculateMapScale = (zoom: number, latitude: number): string => {
          const metersPerPixel = 156543.03392 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom)
          const referencePixels = 60
          const referenceMeters = metersPerPixel * referencePixels
          if (referenceMeters >= 1000) {
            const km = referenceMeters / 1000
            if (km >= 50) return `${Math.round(km / 10) * 10}km`
            else if (km >= 10) return `${Math.round(km / 5) * 5}km`
            else if (km >= 2) return `${Math.round(km)}km`
            else return `${km.toFixed(1)}km`
          } else {
            if (referenceMeters >= 500) return `${Math.round(referenceMeters / 100) * 100}m`
            else if (referenceMeters >= 100) return `${Math.round(referenceMeters / 50) * 50}m`
            else if (referenceMeters >= 20) return `${Math.round(referenceMeters / 10) * 10}m`
            else return `${Math.round(referenceMeters)}m`
          }
        }
        const scale = calculateMapScale(currentZoom, center.lat)
        const metersPerPixel = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, currentZoom)

        console.log(`🔍 [ZOOM DEBUG] Zoom: ${currentZoom.toFixed(2)}, Scale: ${scale}, MaxZoom: ${map.getMaxZoom()}`)
        console.log(`🌍 [COORD DEBUG] Center: ${center.lat.toFixed(5)}°N, ${center.lng.toFixed(5)}°E, m/px: ${metersPerPixel.toFixed(2)}`)

        // Critical zoom level warning (70m scale issue)
        if (metersPerPixel <= 1.5 && metersPerPixel >= 0.8) {
          console.warn(`⚠️ [CRITICAL ZOOM] Approaching 70m scale zone where grey map issue occurs!`)
          console.warn(`⚠️ [TILE CHECK] At zoom ${currentZoom.toFixed(2)}, requesting tiles that may not exist`)
        }

        setCurrentZoom(currentZoom)
        // Close any custom popups during zoom for better UX
        const existingPopups = document.querySelectorAll('.custom-poi-popup')
        existingPopups.forEach(popup => popup.remove())
      })

      // Additional zoom monitoring for real-time debugging
      map.on('zoom', () => {
        const zoom = map.getZoom()
        const center = map.getCenter()
        const metersPerPixel = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom)

        // Real-time monitoring for the problematic 70m scale
        if (metersPerPixel <= 2.0 && metersPerPixel >= 0.5) {
          console.log(`🔄 [REALTIME] Zoom: ${zoom.toFixed(2)}, Scale: ${metersPerPixel.toFixed(2)}m/px - CRITICAL ZONE`)
        }
      })
      
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
  }, [mapType]) // Depend on mapType for initial style selection, but prevent re-initialization

  // Handle map type changes - dynamically update map style
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current
    console.log(`🗺️ Switching map type to: ${mapType}`)

    // Preserve current map position and zoom before style change
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom()
    const currentBearing = map.getBearing()
    const currentPitch = map.getPitch()

    // Update map style based on mapType
    const newStyle = createMapStyle(mapType)
    map.setStyle(newStyle)

    // Restore map position after style loads
    map.once('styledata', () => {
      // Update zoom limits based on map type
      const newMaxZoom = mapType === 'topo' ? 17 : 16
      map.setMaxZoom(newMaxZoom)

      // If current zoom exceeds new limit, use the limit, otherwise preserve zoom
      const targetZoom = currentZoom > newMaxZoom ? newMaxZoom : currentZoom

      // Restore the exact position
      map.jumpTo({
        center: currentCenter,
        zoom: targetZoom,
        bearing: currentBearing,
        pitch: currentPitch
      })

      console.log(`✅ Map type switched to ${mapType}, position preserved`)

      // Re-emit viewport bounds after position is restored
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
  }, [mapType, mapLoaded])

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

      // Enhanced popup creation for Krigsminne POIs
      const createEnhancedPopup = (poi: POI, point: maplibregl.Point): HTMLElement => {
        const popup = document.createElement('div')
        popup.className = 'custom-poi-popup enhanced-popup'
        popup.style.cssText = `
          position: absolute;
          left: ${point.x}px;
          top: ${point.y}px;
          transform: translate(-50%, -100%);
          margin-top: -15px;
          z-index: 1000;
          pointer-events: auto;
        `

        const hasEnhancedData = poi.enhancedData && (
          poi.enhancedData.media?.thumbnails?.length ||
          poi.enhancedData.media?.wikipediaData?.extract
        )

        const createImageCarousel = () => {
          if (!poi.enhancedData?.media?.thumbnails?.length) return ''

          return `
            <div style="margin: 12px 0; overflow-x: auto;">
              <div style="display: flex; gap: 8px; padding-bottom: 8px;">
                ${poi.enhancedData.media.thumbnails.map(img => `
                  <div style="flex-shrink: 0; position: relative;">
                    <img src="${img.url}" alt="${img.title || 'Historisk bilde'}"
                         style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer;"
                         onclick="window.open('${img.url}', '_blank')" />
                    <div style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.7); color: white;
                                font-size: 10px; padding: 1px 3px; border-radius: 2px;">${img.source}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `
        }

        const createWikipediaSection = () => {
          if (!poi.enhancedData?.media?.wikipediaData?.extract) return ''

          const extract = poi.enhancedData.media.wikipediaData.extract
          const truncatedExtract = extract.length > 150 ? extract.substring(0, 150) + '...' : extract

          return `
            <div style="margin: 12px 0; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #7c3aed;">
              <div style="font-size: 13px; color: #4B5563; line-height: 1.4; margin-bottom: 8px;">
                ${truncatedExtract}
              </div>
              ${poi.enhancedData.media.wikipediaData.fullUrl ? `
                <a href="${poi.enhancedData.media.wikipediaData.fullUrl}" target="_blank"
                   style="color: #7c3aed; text-decoration: none; font-size: 12px; font-weight: 500;">
                  📖 Les mer på Wikipedia →
                </a>
              ` : ''}
            </div>
          `
        }

        popup.innerHTML = `
          <div style="background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
                      max-width: ${hasEnhancedData ? '380px' : '320px'}; min-width: 280px;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2);">

            <button onclick="this.closest('.custom-poi-popup').remove()" style="position: absolute; top: 8px; right: 8px;
                    width: 24px; height: 24px; border: none; background: rgba(0,0,0,0.1); border-radius: 50%;
                    color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    font-size: 14px; transition: all 0.2s ease;">×</button>

            <div style="padding: 16px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
                          padding-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.08);">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: ${poi.color || '#7c3aed'};
                            border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); flex-shrink: 0;
                            display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 12px;">🏰</span>
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1F2937; line-height: 1.3;">
                    ${poi.name}
                  </h3>
                  ${hasEnhancedData ? '<span style="font-size: 11px; color: #7c3aed; font-weight: 500;">UTVIDET</span>' : ''}
                </div>
              </div>

              <div style="font-size: 13px; color: #4B5563; line-height: 1.5; margin-bottom: 8px;">
                ${poi.description}
              </div>

              ${createImageCarousel()}
              ${createWikipediaSection()}

              ${poi.enhancedData?.media?.wikipediaData?.relatedArticles?.length ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.08);">
                  <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Relaterte artikler:</div>
                  ${poi.enhancedData.media.wikipediaData.relatedArticles.slice(0, 2).map(article => `
                    <a href="${article.url}" target="_blank" style="display: block; color: #7c3aed; text-decoration: none;
                       font-size: 12px; margin: 2px 0; line-height: 1.3;">• ${article.title}</a>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <div style="margin-left: 50%; width: 0; height: 0; border-left: 8px solid transparent;
                        border-right: 8px solid transparent; border-top: 8px solid white;"></div>
          </div>
        `

        return popup
      }

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
        const _mapRect = mapContainer.getBoundingClientRect()
        const point = map.project([poi.lng, poi.lat])

        // Create enhanced popup for Krigsminne POIs, or standard popup for others
        let popup: HTMLElement
        if (poi.type === 'war_memorials' && poi.enhancedData) {
          popup = createEnhancedPopup(poi, point)
        } else {
          // Create standard popup for non-enhanced POIs
          popup = document.createElement('div')
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
        }

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

  // TRAIL LAYER MANAGEMENT - Handle Norwegian hiking trails from Turrutebasen
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current

    // Helper function to check if any trail categories are active
    const getActiveTrailTypes = (): ('hiking' | 'skiing' | 'cycling' | 'all')[] => {
      const activeTypes: ('hiking' | 'skiing' | 'cycling' | 'all')[] = []

      // Check for specific trail subcategories
      if (categoryState.checked.fotrute) activeTypes.push('hiking')
      if (categoryState.checked.skiloype_trail) activeTypes.push('skiing')
      if (categoryState.checked.sykkelrute) activeTypes.push('cycling')
      if (categoryState.checked.andre_turruter) activeTypes.push('all')

      return activeTypes
    }

    const activeTrailTypes = getActiveTrailTypes()

    // Remove existing trail layers
    const existingTrailLayers = ['trails-hiking', 'trails-skiing', 'trails-cycling', 'trails-all']
    existingTrailLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
      if (map.getSource(layerId)) {
        map.removeSource(layerId)
      }
    })

    // Add trail layers for active categories
    if (activeTrailTypes.length > 0) {
      console.log(`🥾 Adding trail layers for types:`, activeTrailTypes)
      console.log(`ℹ️ Note: Trail data provided by Kartverket WMS service`)
      console.log(`⚠️ If trails don't appear, the WMS service may be temporarily unavailable`)

      activeTrailTypes.forEach(trailType => {
        const layerId = `trails-${trailType}`
        const sourceId = `trails-${trailType}`

        try {
          // Add WMS raster source for trail type
          map.addSource(sourceId, {
            type: 'raster',
            tiles: [KartverketTrailService.getWMSTileUrl(trailType)],
            tileSize: 256,
            attribution: '© Kartverket Turrutebasen'
          })

          // Add raster layer for trail display
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
              'raster-opacity': 0.8 // Semi-transparent so base map shows through
            }
          })

          console.log(`✅ Added trail layer: ${layerId}`)
          console.log(`📡 WMS URL: ${KartverketTrailService.getWMSTileUrl(trailType)}`)

          // Monitor for tile loading errors and provide user feedback
          map.on('sourcedata', (e) => {
            if (e.sourceId === sourceId && e.isSourceLoaded === false) {
              console.warn(`⚠️ Trail layer ${layerId} may be experiencing loading issues`)
            }
          })

          map.on('error', (e) => {
            if (e.error && e.error.message && e.error.message.includes('500')) {
              console.error(`❌ WMS Service Error: Trail data temporarily unavailable (HTTP 500)`)
              console.error(`🔧 This is a known issue with Kartverket's WMS infrastructure`)
            }
          })

        } catch (error) {
          console.error(`❌ Failed to add trail layer ${layerId}:`, error)
        }
      })
    } else {
      console.log('🚫 No trail categories active - trail layers removed')
    }
  }, [mapLoaded, categoryState])

  // Handle search result centering
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    // Always clean up existing search marker first
    if (searchMarkerRef.current) {
      console.log('🧹 Removing previous search marker')
      searchMarkerRef.current.remove()
      searchMarkerRef.current = null
    }

    // If no search result, just cleanup and return
    if (!searchResult) {
      console.log('🔍 No search result, cleanup completed')
      return
    }

    console.log(`🔍 Centering map on search result: ${searchResult.displayName}`)
    console.log('🔍 Creating search marker at coordinates:', searchResult.lat, searchResult.lng)

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
      background: linear-gradient(135deg, #7a8471, #0891b2);
      border: 3px solid white;
      box-shadow: 0 4px 16px rgba(122, 132, 113, 0.4), 0 2px 8px rgba(0,0,0,0.1);
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
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Scale and Coordinates - Bottom Left Corner Grouped */}
            {/* Scale Line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#374151',
              opacity: 0.6,
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

            {/* Coordinates Display */}
            <div
              className="coordinate-display"
              onClick={handleCopyCoordinates}
              title={coordinatesCopied ? "Koordinater kopiert!" : "Klikk for å kopiere koordinater"}
              style={{
                // Styling adapts based on sidebar state as specified
                ...(sidebarCollapsed ? {
                  // On Map styling
                  background: coordinatesCopied ? 'rgba(122,132,113,0.9)' : 'rgba(255,255,255,0.8)',
                  borderRadius: '4px',
                  padding: '4px 6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  fontSize: '12px',
                  color: coordinatesCopied ? '#ffffff' : '#374151'
                } : {
                  // On Sidebar Overlay styling
                  background: coordinatesCopied ? '#7a8471' : '#ffffff',
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
          </div>
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
            box-shadow: 0 4px 16px rgba(122, 132, 113, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 0 rgba(122, 132, 113, 0.7);
          }
          70% {
            box-shadow: 0 4px 16px rgba(122, 132, 113, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 10px rgba(122, 132, 113, 0);
          }
          100% {
            box-shadow: 0 4px 16px rgba(122, 132, 113, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 0 rgba(122, 132, 113, 0);
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
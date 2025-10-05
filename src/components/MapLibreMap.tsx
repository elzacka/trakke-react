import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { POI, CategoryState, CategoryNode } from '../data/pois'
import { SearchResult } from '../services/searchService'
import {
  DistanceMeasurement,
  Coordinate,
  calculatePolylineDistance,
  calculateHaversineDistance,
  formatDistance,
  generateMeasurementId
} from '../services/distanceService'
import { TurrutebasenService } from '../services/turrutebasenService'
import type { Trail, BoundingBox, TrailType } from '../data/trails'
import { TrailUtils, TRAIL_STYLES } from '../data/trails'
import { NaturskogService } from '../services/naturskogService'

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
  toggleDistanceMeasurement: () => void
  clearDistanceMeasurements: () => void
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
  onCoordinatesChange?: (coordinates: {lat: number, lng: number} | null) => void
  onCoordinatesCopied?: (copied: boolean) => void
  sidebarCollapsed?: boolean // Add sidebar state for overlay behavior
  mapType?: 'topo' | 'satellite' // Map type selection
  distanceMeasurements?: DistanceMeasurement[]
  onDistanceMeasurementUpdate?: (measurements: DistanceMeasurement[]) => void
  isDistanceMeasuring?: boolean
  onDistanceMeasuringChange?: (measuring: boolean) => void
  activeTrailTypes?: TrailType[]
  onTrailSelect?: (trail: Trail) => void
  onTrailHighlight?: (trail: Trail | null) => void
}

// Distance measurement enabled
const MapLibreMapComponent = forwardRef<MapLibreMapRef, MapLibreMapProps>((props, ref) => {
  const {
    pois,
    categoryState,
    categoryTree: _categoryTree,
    onCategoryToggle: _onCategoryToggle,
    onExpandToggle: _onExpandToggle,
    searchResult,
    userLocation,
    onViewportChange,
    onBearingChange,
    onCoordinatesChange,
    onCoordinatesCopied,
    sidebarCollapsed: _sidebarCollapsed = true,
    mapType = 'topo',
    distanceMeasurements = [],
    onDistanceMeasurementUpdate,
    isDistanceMeasuring = false,
    onDistanceMeasuringChange,
    activeTrailTypes = [],
    onTrailSelect,
    onTrailHighlight
  } = props
  const mapRef = useRef<maplibregl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const onViewportChangeRef = useRef(onViewportChange)
  const onBearingChangeRef = useRef(onBearingChange)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [mapInitError, setMapInitError] = useState<string | null>(null)
  const [_currentZoom, _setCurrentZoom] = useState<number>(13)
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null)
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null)
  const positionMarkerRef = useRef<maplibregl.Marker | null>(null)

  // Trail system state
  const [trails, setTrails] = useState<Trail[]>([])
  const [_trailsLoading, _setTrailsLoading] = useState(false)
  const [_selectedTrail, _setSelectedTrail] = useState<Trail | null>(null)
  const [lastTrailBounds, setLastTrailBounds] = useState<BoundingBox | null>(null)

  // Distance measurement state
  const [currentMeasurement, setCurrentMeasurement] = useState<Coordinate[]>([])
  const distanceMarkersRef = useRef<maplibregl.Marker[]>([])
  const distanceLinesRef = useRef<HTMLElement[]>([])
  const isDistanceMeasuringRef = useRef(isDistanceMeasuring)

  // Distance measurement functions
  const toggleDistanceMeasurement = () => {
    const newMeasuring = !isDistanceMeasuring
    if (onDistanceMeasuringChange) {
      onDistanceMeasuringChange(newMeasuring)
    }

    if (isDistanceMeasuring) {
      // Finish current measurement if any
      finishCurrentMeasurement()
      // Clear temporary markers and lines after finishing
      clearTemporaryMeasurements()
    } else {
      // Clear any previous measurement
      setCurrentMeasurement([])
    }
  }

  const clearTemporaryMeasurements = () => {
    // Clear all temporary markers
    distanceMarkersRef.current.forEach(marker => marker.remove())
    distanceMarkersRef.current = []

    // Clear all temporary lines
    distanceLinesRef.current.forEach(line => line.remove())
    distanceLinesRef.current = []

    // Cleared temporary distance measurements
  }

  const clearDistanceMeasurements = () => {
    // Clear all markers and lines
    distanceMarkersRef.current.forEach(marker => marker.remove())
    distanceMarkersRef.current = []
    distanceLinesRef.current.forEach(line => line.remove())
    distanceLinesRef.current = []

    // Clear current measurement
    setCurrentMeasurement([])
    if (onDistanceMeasuringChange) {
      onDistanceMeasuringChange(false)
    }

    // Clear from parent state
    if (onDistanceMeasurementUpdate) {
      onDistanceMeasurementUpdate([])
    }
  }

  const finishCurrentMeasurement = () => {
    if (currentMeasurement.length >= 2) {
      const { totalDistance, segments } = calculatePolylineDistance(currentMeasurement)
      const measurement: DistanceMeasurement = {
        id: generateMeasurementId(),
        points: [...currentMeasurement],
        totalDistance,
        segments,
        created: new Date()
      }

      if (onDistanceMeasurementUpdate) {
        onDistanceMeasurementUpdate([...distanceMeasurements, measurement])
      }
    }
    setCurrentMeasurement([])
  }

  const addDistanceMeasurementPoint = (coordinate: Coordinate) => {
    if (!mapRef.current) {
      console.warn('⚠️ Cannot add distance point: map not initialized')
      return
    }

    // Use functional update to get the current state
    setCurrentMeasurement(prevMeasurement => {
      const newPoints = [...prevMeasurement, coordinate]

      // Current measurement updated

      // Create marker for this point
      const markerElement = document.createElement('div')
      markerElement.className = 'distance-marker'
      markerElement.style.cssText = `
        width: 16px !important;
        height: 16px !important;
        background-color: #ff4444 !important;
        background: #ff4444 !important;
        border: 3px solid white !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4) !important;
        z-index: 1000 !important;
      `

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat([coordinate.lng, coordinate.lat])
        .addTo(mapRef.current!)

      distanceMarkersRef.current.push(marker)
      // Distance marker added

      // If this is the second or later point, draw line from previous point
      if (newPoints.length >= 2) {
        const prevPoint = newPoints[newPoints.length - 2]
        const currentPoint = coordinate
        // Drawing line between points
        drawDistanceLine(prevPoint, currentPoint, newPoints.length - 1)
      }

      // Added distance measurement point

      return newPoints
    })
  }

  const drawDistanceLine = (start: Coordinate, end: Coordinate, _segmentIndex: number) => {
    if (!mapRef.current) return

    const map = mapRef.current

    // Calculate distance for this segment
    const distance = calculateHaversineDistance(start, end)
    // Drawing distance line

    // Create line element
    const lineContainer = document.createElement('div')
    lineContainer.className = 'distance-line-container'
    lineContainer.style.position = 'absolute'
    lineContainer.style.pointerEvents = 'none'
    lineContainer.style.zIndex = '1000'
    lineContainer.style.top = '0'
    lineContainer.style.left = '0'
    lineContainer.style.width = '100%'
    lineContainer.style.height = '100%'
    lineContainer.style.overflow = 'visible'

    // Create line
    const line = document.createElement('div')
    line.className = 'distance-line'

    // Create distance label
    const label = document.createElement('div')
    label.className = 'distance-label'
    label.style.position = 'absolute'
    label.style.background = 'rgba(255, 255, 255, 0.95)'
    label.style.border = '2px solid #ff4444'
    label.style.borderRadius = '6px'
    label.style.padding = '6px 10px'
    label.style.fontSize = '13px'
    label.style.fontWeight = 'bold'
    label.style.color = '#ff4444'
    label.style.whiteSpace = 'nowrap'
    label.style.zIndex = '1001'
    label.style.pointerEvents = 'none'
    label.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
    label.style.fontFamily = 'system-ui, -apple-system, sans-serif'
    label.textContent = formatDistance(distance)

    // Created distance label

    lineContainer.appendChild(line)
    lineContainer.appendChild(label)

    // Function to update line and label positions
    const updateLinePosition = () => {
      const startPixel = map.project([start.lng, start.lat])
      const endPixel = map.project([end.lng, end.lat])

      const deltaX = endPixel.x - startPixel.x
      const deltaY = endPixel.y - startPixel.y
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI

      // Updating line position

      // Update line position
      line.style.position = 'absolute'
      line.style.left = `${startPixel.x}px`
      line.style.top = `${startPixel.y}px`
      line.style.width = `${length}px`
      line.style.height = '3px'
      line.style.backgroundColor = '#ff4444'
      line.style.transformOrigin = '0 50%'
      line.style.transform = `rotate(${angle}deg)`
      line.style.zIndex = '1000'

      // Update label position (center of line)
      const labelX = startPixel.x + deltaX / 2
      const labelY = startPixel.y + deltaY / 2 - 20

      label.style.left = `${labelX}px`
      label.style.top = `${labelY}px`

      // Positioned distance label
    }

    // Initial position
    updateLinePosition()

    // Update on map move/zoom
    map.on('move', updateLinePosition)
    map.on('zoom', updateLinePosition)

    // Add to map container
    const mapContainer = map.getContainer()
    mapContainer.appendChild(lineContainer)

    distanceLinesRef.current.push(lineContainer)

    // Verify the elements are in the DOM
    // Distance line added to map
  }

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
    getMap: () => mapRef.current,
    toggleDistanceMeasurement,
    clearDistanceMeasurements
  }))


  // Update refs when callbacks change
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange
  }, [onViewportChange])

  useEffect(() => {
    onBearingChangeRef.current = onBearingChange
  }, [onBearingChange])

  // Keep distance measuring ref in sync
  useEffect(() => {
    isDistanceMeasuringRef.current = isDistanceMeasuring
    console.log(`📏 Distance measuring mode: ${isDistanceMeasuring}`)
  }, [isDistanceMeasuring])

  // Create map style based on map type - shared function
  const createMapStyle = (mapType: 'topo' | 'satellite'): maplibregl.StyleSpecification => {
    console.log(`🗺️ Creating map style for type: ${mapType}`)

    if (mapType === 'topo') {
      // Kartverket Topographic Map
      return {
        version: 8,
        sources: {
          'kartverket-topo': {
            type: 'raster',
            tiles: [
              'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'
            ],
            tileSize: 256,
            attribution: '© Kartverket'
          }
        },
        layers: [
          {
            id: 'kartverket-topo-layer',
            type: 'raster',
            source: 'kartverket-topo'
          }
        ]
      }
    } else {
      // Simple satellite map using Esri World Imagery
      return {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri'
          }
        },
        layers: [
          {
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite'
          }
        ]
      }
    }
  }

  // Initialize map only once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    console.log(`🗺️ [DEBUG] Initializing MapLibre with ${mapType} map type...`)
    console.log(`🗺️ [DEBUG] Container ref exists:`, !!containerRef.current)
    console.log(`🗺️ [DEBUG] Container dimensions:`, containerRef.current?.offsetWidth, 'x', containerRef.current?.offsetHeight)

    // Map initialization function
    const initializeWithLocation = (center: [number, number]) => {
      console.log(`🗺️ Initializing MapLibre with center: [${center}] and style:`, createMapStyle(mapType))

      try {
        const initialMaxZoom = mapType === 'topo' ? 18 : 17 // Reduced satellite to 17 to avoid "Map data not yet available" tiles

        const map = new maplibregl.Map({
          container: containerRef.current!,
          style: createMapStyle(mapType),
          center: center,
          zoom: 7, // Zoom level for 60km scale
          pitch: 60, // Maximum tilt (60 degrees is MapLibre's maximum)
          minZoom: 3,
          maxZoom: initialMaxZoom,
          attributionControl: false
        })

        // Enable scroll zoom with Shift for precise control
        // Default behavior: normal scroll = regular zoom, Shift + scroll = precise zoom (smaller increments)
        map.scrollZoom.enable()
        map.scrollZoom.setZoomRate(1/100) // Default zoom rate for smooth scrolling
        map.scrollZoom.setWheelZoomRate(1/450) // Slower zoom when using Shift (precise mode)

        // Enable other navigation controls
        map.boxZoom.enable() // Shift + drag to zoom to area
        map.dragRotate.enable() // Ctrl/Cmd + drag to rotate
        map.dragPan.enable() // Drag to pan
        map.doubleClickZoom.enable() // Double-click to zoom in
        map.touchZoomRotate.enable() // Pinch to zoom on touch devices

        console.log(`🗺️ [DEBUG] Map object created successfully:`, map)
        setMapInitialized(true)
        setMapInitError(null)
        return map
      } catch (error) {
        console.error(`❌ [ERROR] Failed to create MapLibre map:`, error)
        setMapInitError(error instanceof Error ? error.message : 'Unknown map creation error')
        return null
      }
    }

    // Track if layers have been initialized to prevent duplicates
    let layersInitialized = false

    // Initialize map layers (both Naturskog and Turrutebasen)
    const initializeMapLayers = (map: maplibregl.Map, context: string) => {
      if (layersInitialized) {
        console.log(`🔄 [${context}] Layers already initialized, skipping...`)
        return
      }

      console.log(`🔄 [${context}] Starting layer initialization...`)
      layersInitialized = true

      // PERFORMANCE OPTIMIZATION: Only log layer sources without adding them to map
      // Layers will be initialized on-demand when first toggled
      console.log(`⚡ [${context}] Using lazy layer initialization for better performance`)

      try {
        const _naturskogSources = NaturskogService.getWMSLayerSources()
        const naturskogLayers = NaturskogService.getMapLayers()
        console.log(`🌲 [${context}] Naturskog layers ready for lazy loading:`, naturskogLayers.map(l => l.id))

        const _turrutebasenSources = TurrutebasenService.getWMSLayerSources()
        console.log(`🥾 [${context}] Turrutebasen sources ready for lazy loading:`, Object.keys(_turrutebasenSources))
      } catch (error) {
        console.error(`❌ [${context}] Error preparing lazy layer data:`, error)
      }

      return

      // Add Naturskog WMS layers
      try {
        console.log(`🌲 [${context}] Starting Naturskog WMS layer initialization...`)
        const naturskogSources = NaturskogService.getWMSLayerSources()
        console.log(`🌲 [${context}] Got Naturskog sources:`, Object.keys(naturskogSources))
        const naturskogLayers = NaturskogService.getMapLayers()
        console.log(`🌲 [${context}] Got Naturskog layers:`, naturskogLayers.map(l => l.id))

        // Add sources
        Object.entries(naturskogSources).forEach(([sourceId, source]) => {
          try {
            if (!map.getSource(sourceId)) {
              map.addSource(sourceId, source)
              console.log(`✅ [${context}] Added Naturskog source: ${sourceId}`)
            } else {
              console.log(`ℹ️ [${context}] Naturskog source ${sourceId} already exists`)
            }
          } catch (error) {
            console.error(`❌ [${context}] Failed to add Naturskog source ${sourceId}:`, error)
          }
        })

        // Add layers
        naturskogLayers.forEach(layer => {
          try {
            if (!map.getLayer(layer.id)) {
              map.addLayer(layer)
              console.log(`✅ [${context}] Added Naturskog layer: ${layer.id}`)
            } else {
              console.log(`ℹ️ [${context}] Naturskog layer ${layer.id} already exists`)
            }
          } catch (error) {
            console.error(`❌ [${context}] Failed to add Naturskog layer ${layer.id}:`, error)
          }
        })
        console.log(`🌲 [${context}] Naturskog layers initialized`)
      } catch (error) {
        console.error(`❌ [${context}] [CRITICAL] Failed to add Naturskog layers:`, error)
      }

      // Add Turrutebasen WMS layers
      try {
        console.log(`🥾 [${context}] Starting Turrutebasen WMS layer initialization...`)
        const turrutebasenSources = TurrutebasenService.getWMSLayerSources()

        // Add sources and layers for each trail type
        Object.entries(turrutebasenSources).forEach(([sourceId, source]) => {
          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, source)
            console.log(`✅ [${context}] Added Turrutebasen source: ${sourceId}`)
          } else {
            console.log(`ℹ️ [${context}] Turrutebasen source ${sourceId} already exists`)
          }
        })

        // Turrutebasen layers are now handled via WMS sources only
        console.log(`ℹ️ [${context}] Turrutebasen WMS sources prepared for lazy loading`)

        console.log(`🥾 [${context}] Turrutebasen layers initialized`)
      } catch (error) {
        console.error(`❌ [${context}] Failed to add Turrutebasen layers:`, error)
      }
    }

    // Setup map event handlers
    const setupMapEventHandlers = (map: maplibregl.Map) => {
      // No default controls - using custom overlay UI components instead

      map.on('load', () => {
        console.log(`✅ MapLibre loaded with ${mapType} map tiles`)
        setMapLoaded(true)

        // Initialize coordinates with map center for immediate display
        const center = map.getCenter()
        onCoordinatesChange?.({
          lat: center.lat,
          lng: center.lng
        })

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

        // Initialize layers on map load
        initializeMapLayers(map, 'MAP_LOAD')
      })

      // Add error handling for map
      map.on('error', (e) => {
        console.error(`❌ [MAP ERROR] MapLibre error:`, e)
      })

      // Add style load error handling
      map.on('styledata', () => {
        console.log(`🎨 [DEBUG] Style data loaded for ${mapType}`)
      })

      map.on('style.load', () => {
        console.log(`🎨 [DEBUG] Style fully loaded for ${mapType}`)
        // Re-initialize layers when style loads (handles hard refresh issues)
        initializeMapLayers(map, 'STYLE_LOAD')
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

      // Essential error handling only - removed verbose debug logging for performance
      map.on('error', (e) => {
        console.error(`❌ Map error:`, e)
      })

      map.on('sourceerror', (e) => {
        console.error(`❌ Source error: ${e.sourceId}`, e)
      })

      // Optimized zoom handling - minimal logging
      map.on('zoomend', () => {
        const currentZoom = map.getZoom()
        _setCurrentZoom(currentZoom)
        // Close any custom popups during zoom for better UX
        const existingPopups = document.querySelectorAll('.custom-poi-popup')
        existingPopups.forEach(popup => popup.remove())
      })
      
      // Emit initial bearing
      setTimeout(() => {
        if (onBearingChangeRef.current) {
          onBearingChangeRef.current(map.getBearing())
        }
      }, 100)

      // Track mouse coordinates
      map.on('mousemove', (e) => {
        onCoordinatesChange?.({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng
        })
      })

      // Enhanced long press detection for mobile coordinate copying
      let longPressTimer: NodeJS.Timeout | null = null
      let longPressCoords: { lat: number; lng: number } | null = null
      let startTouch: { x: number; y: number } | null = null
      const LONG_PRESS_DURATION = 800 // Longer duration to reduce sensitivity
      const TOUCH_MOVE_THRESHOLD = 15 // Larger threshold to prevent accidental triggers

      map.on('touchstart', (e) => {
        if (e.lngLat && e.originalEvent.touches.length === 1) {
          const touch = e.originalEvent.touches[0]
          startTouch = { x: touch.clientX, y: touch.clientY }
          longPressCoords = { lat: e.lngLat.lat, lng: e.lngLat.lng }

          longPressTimer = setTimeout(async () => {
            if (longPressCoords) {
              const coordinatesText = `${longPressCoords.lat.toFixed(5)}°N, ${longPressCoords.lng.toFixed(5)}°E`

              // Vibrate if supported (mobile feedback)
              if (navigator.vibrate) {
                navigator.vibrate(50)
              }

              try {
                // Use the improved clipboard function
                if (navigator.clipboard && window.isSecureContext) {
                  await navigator.clipboard.writeText(coordinatesText)
                } else {
                  // Fallback for mobile browsers
                  const textArea = document.createElement('textarea')
                  textArea.value = coordinatesText
                  textArea.style.position = 'fixed'
                  textArea.style.left = '-999999px'
                  textArea.style.top = '-999999px'
                  document.body.appendChild(textArea)
                  textArea.focus()
                  textArea.select()
                  document.execCommand('copy')
                  document.body.removeChild(textArea)
                }

                console.log(`📋 Copied coordinates with long press: ${coordinatesText}`)
                onCoordinatesCopied?.(true)
              } catch (error) {
                console.error('Failed to copy coordinates:', error)
                // Still show visual feedback
                onCoordinatesCopied?.(true)
              }
            }
          }, LONG_PRESS_DURATION)
        }
      })

      map.on('touchend', () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer)
          longPressTimer = null
        }
        longPressCoords = null
        startTouch = null
      })

      // Track touch coordinates and cancel long press on significant move
      map.on('touchmove', (e) => {
        // Update coordinates for mobile
        if (e.lngLat) {
          onCoordinatesChange?.({
            lat: e.lngLat.lat,
            lng: e.lngLat.lng
          })
        }

        // Cancel long press if finger moves too much
        if (longPressTimer && startTouch && e.originalEvent.touches.length === 1) {
          const touch = e.originalEvent.touches[0]
          const moveDistance = Math.sqrt(
            Math.pow(touch.clientX - startTouch.x, 2) + Math.pow(touch.clientY - startTouch.y, 2)
          )

          if (moveDistance > TOUCH_MOVE_THRESHOLD) {
            clearTimeout(longPressTimer)
            longPressTimer = null
            longPressCoords = null
            startTouch = null
          }
        }
      })

      // Add right-click context menu for copying coordinates
      map.on('contextmenu', async (e) => {
        e.preventDefault()
        const { lat, lng } = e.lngLat
        const coordinatesText = `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`

        try {
          // Use improved clipboard function
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(coordinatesText)
          } else {
            const textArea = document.createElement('textarea')
            textArea.value = coordinatesText
            textArea.style.position = 'fixed'
            textArea.style.left = '-999999px'
            textArea.style.top = '-999999px'
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
          }

          console.log(`📋 Copied coordinates: ${coordinatesText}`)
          onCoordinatesCopied?.(true)
        } catch (error) {
          console.error('Failed to copy coordinates:', error)
          onCoordinatesCopied?.(true)
        }
      })

      // Handle distance measurement clicks
      map.on('click', (e) => {
        if (isDistanceMeasuringRef.current) {
          const { lat, lng } = e.lngLat
          console.log(`📏 Adding distance measurement point at [${lat.toFixed(5)}, ${lng.toFixed(5)}]`)
          e.preventDefault()
          addDistanceMeasurementPoint({ lat, lng })
        }
      })

      mapRef.current = map
      console.log(`🗺️ Map initialized successfully`)

      // Set up event handlers immediately
      setupMapEventHandlers(map)
    }

    // Try user location first, fallback to Hardangervidda if disabled/failed
    if (navigator.geolocation) {
      console.log('🌍 Attempting to get user location...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCenter: [number, number] = [position.coords.longitude, position.coords.latitude]
          console.log(`📍 Using user location`)
          initializeWithLocation(userCenter)
        },
        (error) => {
          console.log(`❌ Geolocation failed: ${error.message}, using Hardangervidda fallback`)
          const hardangervidda: [number, number] = [7.47408, 60.13022]
          initializeWithLocation(hardangervidda)
        },
        {
          enableHighAccuracy: false, // Faster location acquisition
          timeout: 1500, // Reduced from 5000ms to 1500ms for faster fallback
          maximumAge: 300000
        }
      )
    } else {
      console.log('📍 No geolocation support, using Hardangervidda as default')
      const hardangervidda: [number, number] = [7.47408, 60.13022] // Hardangervidda coordinates
      const map = initializeWithLocation(hardangervidda)
      console.log(`🗺️ [DEBUG] Map from initializeWithLocation (no geolocation):`, !!map)
      if (map) {
        setupMapEventHandlers(map)
      } else {
        console.error(`❌ [ERROR] Map initialization failed with Hardangervidda center`)
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Initialize map only once - style changes handled by separate effect
  // mapType intentionally excluded to prevent map re-initialization on type changes

  // Handle map type changes - dynamically update map style
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current
    console.log(`🗺️ Map type switching effect triggered: ${mapType}`)

    // Preserve current map position and zoom before style change
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom()
    const currentBearing = map.getBearing()
    const currentPitch = map.getPitch()

    console.log(`📍 Current position before switch: center=[${currentCenter.lng.toFixed(4)}, ${currentCenter.lat.toFixed(4)}], zoom=${currentZoom.toFixed(2)}`)

    // Update map style based on mapType
    const newStyle = createMapStyle(mapType)
    map.setStyle(newStyle)

    // Restore map position after style loads
    void map.once('styledata', () => {
      console.log(`🎨 Style loaded for ${mapType}, restoring position...`)

      // Update zoom limits based on map type
      const newMaxZoom = mapType === 'topo' ? 18 : 17 // Reduced satellite to 17 to avoid "Map data not yet available" tiles
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

      console.log(`✅ Map type switched to ${mapType}, position restored to [${currentCenter.lng.toFixed(4)}, ${currentCenter.lat.toFixed(4)}], zoom=${targetZoom.toFixed(2)}`)

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
    // API-based POI rendering

    // Clean up existing POI overlays
    const existingOverlays = document.querySelectorAll('.custom-poi-overlay')
    existingOverlays.forEach(overlay => overlay.remove())

    // Creating POI markers

    // Create API-based POI markers using custom DOM overlays positioned over the map
    pois.forEach((poi, _index) => {
      // Creating POI marker

      // Create overlay container
      const overlay = document.createElement('div')
      overlay.className = 'custom-poi-overlay'
      overlay.style.cssText = `
        position: absolute;
        z-index: 10;
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
        markerElement.style.zIndex = '15'
      })
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1.0)'
        markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
        markerElement.style.zIndex = '10'
      })

      // Optimized popup content creation - simplified and lazy loaded
      const createPopupContent = (poi: POI): string => {
        const isMobile = window.innerWidth < 768

        // Simplified popup for faster rendering
        return `
          <div style="background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                      max-width: ${isMobile ? '85vw' : '320px'}; min-width: 280px;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <button onclick="this.closest('.maplibregl-popup').remove()" style="
              position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border: none;
              background: rgba(0,0,0,0.1); border-radius: 6px; cursor: pointer; display: flex;
              align-items: center; justify-content: center; font-size: 16px; color: #666;">×</button>
            <div style="padding: 14px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <div style="width: 20px; height: 20px; border-radius: 50%; background: ${poi.color || '#7c3aed'}; flex-shrink: 0;"></div>
                <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #1F2937;">${poi.name}</h3>
              </div>
              <div style="font-size: 13px; color: #4B5563; line-height: 1.4;">${poi.description}</div>
            </div>
          </div>
        `
      }

      // Add click handler for custom popup
      markerElement.addEventListener('click', (e) => {
        // If in distance measurement mode, allow click to propagate to map
        if (isDistanceMeasuringRef.current) {
          // POI clicked in measurement mode
          return
        }

        e.preventDefault()
        e.stopPropagation()

        // Close any existing popups
        document.querySelectorAll('.maplibregl-popup').forEach(popup => popup.remove())

        // Use simplified popup for all POIs - better performance
        const popupContent = createPopupContent(poi)

        // Create MapLibre popup that follows the marker
        new maplibregl.Popup({
          closeButton: false, // Disable default close button since we have custom ones
          closeOnClick: false,
          offset: [0, -15] // Offset above the marker
        })
          .setLngLat([poi.lng, poi.lat])
          .setHTML(popupContent)
          .addTo(map)
      })
    })

    // Created POI overlays
  }, [mapLoaded, pois])

  // Handle trail click events
  const handleTrailClick = useCallback((trail: Trail, lngLat: maplibregl.LngLat) => {
    console.log(`🥾 Trail clicked: ${trail.properties.name}`)

    _setSelectedTrail(trail)

    // Call parent handler if provided (this opens the trail details modal)
    if (onTrailSelect) {
      onTrailSelect(trail)
    }

    // Create popup with trail information
    const _popup = new maplibregl.Popup()
      .setLngLat(lngLat)
      .setHTML(`
        <div style="padding: 12px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #3e4533; font-size: 16px;">${trail.properties.name}</h3>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #666;">
            <div><strong>Type:</strong> ${trail.properties.type}</div>
            <div><strong>Difficulty:</strong> ${trail.properties.difficulty}</div>
            <div><strong>Distance:</strong> ${(trail.properties.distance / 1000).toFixed(1)} km</div>
            <div><strong>Municipality:</strong> ${trail.properties.municipality}</div>
            ${trail.properties.surface ? `<div><strong>Surface:</strong> ${trail.properties.surface}</div>` : ''}
            ${trail.properties.maintainer ? `<div><strong>Maintainer:</strong> ${trail.properties.maintainer}</div>` : ''}
          </div>
          ${trail.properties.description ? `
            <div style="margin-top: 8px; font-size: 12px; color: #555;">
              ${trail.properties.description}
            </div>
          ` : ''}
        </div>
      `)
      .addTo(mapRef.current!)

    // Optional: Center map on trail
    const trailBounds = TrailUtils.getTrailBounds(trail)
    if (trailBounds) {
      mapRef.current!.fitBounds([
        [trailBounds.west, trailBounds.south],
        [trailBounds.east, trailBounds.north]
      ], { padding: 50 })
    }
  }, [onTrailSelect])

  // Setup trail click and hover interactions
  const setupTrailInteractions = useCallback(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    // Add click handler for trails
    Object.keys(TRAIL_STYLES).forEach(trailType => {
      const layerId = `trails-${trailType}`

      map.on('click', layerId, (e) => {
        if (!e.features || e.features.length === 0) return

        const feature = e.features[0]
        const trailId = feature.properties?.id

        if (trailId) {
          const trail = trails.find(t => t.id === trailId)
          if (trail) {
            handleTrailClick(trail, e.lngLat)
          }
        }
      })

      // Change cursor on hover
      map.on('mouseenter', layerId, (e) => {
        map.getCanvas().style.cursor = 'pointer'

        // Highlight trail if callback provided
        if (onTrailHighlight && e.features?.[0]) {
          const trailId = e.features[0].properties?.id
          if (trailId) {
            const trail = trails.find(t => t.id === trailId)
            if (trail) {
              onTrailHighlight(trail)
            }
          }
        }
      })

      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = ''

        // Clear trail highlight if callback provided
        if (onTrailHighlight) {
          onTrailHighlight(null)
        }
      })
    })
  }, [onTrailHighlight, handleTrailClick, trails])

  // Add WMS trail layers (new primary method)
  const addWMSTrailLayers = useCallback((activeTypes: ('hiking' | 'skiing' | 'cycling' | 'other')[]) => {
    if (!mapRef.current) return

    const map = mapRef.current

    console.log('🔄 Adding WMS trail layers from Turrutebasen')

    // Get all WMS sources from the service
    const wmsSources = TurrutebasenService.getWMSLayerSources()

    activeTypes.forEach(trailType => {
      const layerId = `trails-${trailType}-wms`
      const sourceId = `turrutebasen-${trailType}`

      // Check if source exists in our WMS sources
      if (wmsSources[sourceId]) {
        try {
          // Add source if not already added
          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, wmsSources[sourceId])
          }

          // Add layer if not already added
          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'raster',
              source: sourceId,
              paint: {
                'raster-opacity': 0.8
              }
            })
          }

          console.log(`✅ Added WMS trail layer: ${layerId}`)
        } catch (error) {
          console.error(`❌ Failed to add WMS trail layer for ${trailType}:`, error)
        }
      } else {
        console.warn(`⚠️ No WMS source available for trail type: ${trailType}`)
      }
    })
  }, [])

  // Toggle WMS trail layer visibility
  const toggleWMSTrailLayer = useCallback((trailType: 'hiking' | 'skiing' | 'cycling' | 'other', visible: boolean) => {
    if (!mapRef.current) return

    const map = mapRef.current
    const layerId = `trails-${trailType}-wms`

    try {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
        console.log(`🔄 ${visible ? 'Showing' : 'Hiding'} WMS trail layer: ${layerId}`)
      }
    } catch (error) {
      console.error(`❌ Failed to toggle WMS trail layer ${layerId}:`, error)
    }
  }, [])

  // Add trail vector data to map
  const addTrailsToMap = useCallback((trailData: Trail[]) => {
    if (!mapRef.current || trailData.length === 0) return

    const map = mapRef.current

    // Convert trails to GeoJSON FeatureCollection
    const trailsGeoJSON = {
      type: 'FeatureCollection' as const,
      features: trailData.map(trail => ({
        type: 'Feature' as const,
        id: trail.id,
        geometry: trail.geometry,
        properties: {
          id: trail.id,
          name: trail.properties.name,
          type: trail.properties.type,
          difficulty: trail.properties.difficulty,
          distance: trail.properties.distance,
          municipality: trail.properties.municipality,
          surface: trail.properties.surface,
          maintainer: trail.properties.maintainer
        }
      }))
    }

    // Add trail data source
    map.addSource('trails-data', {
      // eslint-disable-next-line no-restricted-syntax
      type: 'geojson',
      data: trailsGeoJSON,
      lineMetrics: true
    })

    // Add trail layers for each type with proper styling
    Object.entries(TRAIL_STYLES).forEach(([trailType, style]) => {
      // Add glow effect layer (bottom)
      map.addLayer({
        id: `trails-${trailType}-glow`,
        type: 'line',
        source: 'trails-data',
        filter: ['==', ['get', 'type'], trailType],
        paint: {
          'line-color': style.glowColor || style.color + '40',
          'line-width': style.width + 2,
          'line-blur': 2,
          'line-opacity': 0.6
        }
      })

      // Add main trail layer (top)
      const paintProperties: Record<string, unknown> = {
        'line-color': style.color,
        'line-width': style.width,
        'line-opacity': style.opacity
      }

      // Only add dasharray if it's defined
      if (style.dashArray) {
        paintProperties['line-dasharray'] = style.dashArray
      }

      map.addLayer({
        id: `trails-${trailType}`,
        type: 'line',
        source: 'trails-data',
        filter: ['==', ['get', 'type'], trailType],
        paint: paintProperties
      })

      console.log(`✅ Added vector trail layer: trails-${trailType}`)
    })

    // Add trail click handlers
    setupTrailInteractions()
  }, [setupTrailInteractions])

  // Load trails for current map view
  const loadTrailsForCurrentView = useCallback(async (activeTypes: ('hiking' | 'skiing' | 'cycling' | 'other')[]) => {
    if (!mapRef.current) return

    const map = mapRef.current
    const bounds = map.getBounds()

    const trailBounds: BoundingBox = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    }

    // Skip loading if bounds haven't changed significantly
    if (lastTrailBounds &&
        Math.abs(trailBounds.north - lastTrailBounds.north) < 0.01 &&
        Math.abs(trailBounds.south - lastTrailBounds.south) < 0.01 &&
        Math.abs(trailBounds.east - lastTrailBounds.east) < 0.01 &&
        Math.abs(trailBounds.west - lastTrailBounds.west) < 0.01) {
      return
    }

    _setTrailsLoading(true)
    setLastTrailBounds(trailBounds)

    try {
      console.log(`🥾 Loading trails from Turrutebasen for types:`, activeTypes)
      console.log(`📍 Bounds:`, trailBounds)

      // Fetch trails from Turrutebasen WFS
      const fetchedTrails = await TurrutebasenService.fetchTrailsInBounds(trailBounds, {
        maxFeatures: 200 // Limit for performance
      })

      // Filter trails by active types
      const filteredTrails = fetchedTrails.filter(trail => {
        const trailType = trail.properties.type === 'mixed' ? 'other' : trail.properties.type
        return activeTypes.includes(trailType as 'hiking' | 'skiing' | 'cycling' | 'other')
      })

      console.log(`✅ Loaded ${filteredTrails.length} trails from Turrutebasen`)
      setTrails(filteredTrails)

      // Add trails to map
      addTrailsToMap(filteredTrails)

    } catch (error) {
      console.error('❌ Failed to load trails:', error)

      // Fallback to WMS overlay if vector data fails
      console.log('🔄 Falling back to WMS trail overlay')
      addWMSTrailLayers(activeTypes)

    } finally {
      _setTrailsLoading(false)
    }
  }, [addTrailsToMap, addWMSTrailLayers, lastTrailBounds])

  // TRAIL VECTOR LAYER MANAGEMENT - Handle Norwegian hiking trails from Turrutebasen
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current

    // Helper function to check if any trail categories are active
    const _getActiveTrailTypes = (): ('hiking' | 'skiing' | 'cycling' | 'other')[] => {
      const activeTypes: ('hiking' | 'skiing' | 'cycling' | 'other')[] = []

      // Check for specific trail subcategories
      if (categoryState.checked.fotrute) activeTypes.push('hiking')
      if (categoryState.checked.skiloype_trail) activeTypes.push('skiing')
      if (categoryState.checked.sykkelrute) activeTypes.push('cycling')
      if (categoryState.checked.andre_turruter) activeTypes.push('other')

      return activeTypes
    }

    // Use activeTrailTypes prop directly - converting to the expected format
    const trailTypesForLayer = activeTrailTypes.map(type =>
      type === 'mixed' ? 'other' : type
    ) as ('hiking' | 'skiing' | 'cycling' | 'other')[]

    // Remove existing trail layers
    const existingTrailLayers = [
      'trails-hiking', 'trails-skiing', 'trails-cycling', 'trails-other',
      'trails-hiking-glow', 'trails-skiing-glow', 'trails-cycling-glow', 'trails-other-glow'
    ]
    existingTrailLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
    })

    // Remove existing trail sources
    const existingTrailSources = ['trails-data']
    existingTrailSources.forEach(sourceId => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    })

    // Add WMS trail layers for active categories
    if (trailTypesForLayer.length > 0) {
      console.log('🥾 Adding WMS trail layers for active types:', trailTypesForLayer)
      addWMSTrailLayers(trailTypesForLayer)

      // Toggle visibility for all trail types
      const allTypes: ('hiking' | 'skiing' | 'cycling' | 'other')[] = ['hiking', 'skiing', 'cycling', 'other']
      allTypes.forEach(type => {
        const isActive = trailTypesForLayer.includes(type)
        toggleWMSTrailLayer(type, isActive)
      })
    } else {
      console.log('🚫 No trail categories active - hiding all trail layers')
      // Hide all WMS trail layers
      const allTypes: ('hiking' | 'skiing' | 'cycling' | 'other')[] = ['hiking', 'skiing', 'cycling', 'other']
      allTypes.forEach(type => {
        toggleWMSTrailLayer(type, false)
      })
      setTrails([])
    }
  }, [mapLoaded, categoryState, activeTrailTypes, addWMSTrailLayers, toggleWMSTrailLayer])

  // Load trails when map moves (debounced)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    let timeoutId: NodeJS.Timeout

    const handleMapMove = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        // Convert activeTrailTypes prop to expected format
        const trailTypesForMove = activeTrailTypes.map(type =>
          type === 'mixed' ? 'other' : type
        ) as ('hiking' | 'skiing' | 'cycling' | 'other')[]

        if (trailTypesForMove.length > 0) {
          void loadTrailsForCurrentView(trailTypesForMove)
        }
      }, 1000) // 1 second debounce
    }

    mapRef.current.on('moveend', handleMapMove)

    return () => {
      if (mapRef.current) {
        mapRef.current.off('moveend', handleMapMove)
      }
      clearTimeout(timeoutId)
    }
  }, [mapLoaded, activeTrailTypes, lastTrailBounds, loadTrailsForCurrentView])

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
    if (!mapRef.current) return

    // If userLocation is null, remove markers and return
    if (!userLocation) {
      console.log('📍 User location cleared - removing markers')
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove()
        userLocationMarkerRef.current = null
      }
      if (positionMarkerRef.current) {
        positionMarkerRef.current.remove()
        positionMarkerRef.current = null
      }
      return
    }

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
      background: linear-gradient(135deg, #3e4533, #0891b2);
      border: 3px solid white;
      box-shadow: 0 4px 16px rgba(62, 69, 51, 0.4), 0 2px 8px rgba(0,0,0,0.1);
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
        style={{
          width: '100%',
          height: '100%',
          background: '#f0f0f0' // Temporary background to verify container visibility
        }}
      />

      {/* Debug status indicator */}
      {mapInitError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 0, 0, 0.9)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 1000,
          maxWidth: '80%',
          textAlign: 'center'
        }}>
          ❌ Map initialization failed:<br />
          {mapInitError}
        </div>
      )}

      {!mapInitialized && !mapInitError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          fontSize: '16px',
          zIndex: 1000
        }}>
          🗺️ Initializing map...
        </div>
      )}

      
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
            box-shadow: 0 4px 16px rgba(62, 69, 51, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 0 rgba(122, 132, 113, 0.7);
          }
          70% {
            box-shadow: 0 4px 16px rgba(62, 69, 51, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 10px rgba(122, 132, 113, 0);
          }
          100% {
            box-shadow: 0 4px 16px rgba(62, 69, 51, 0.4), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 0 rgba(122, 132, 113, 0);
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

        /* Coordinate copy animation */
        @keyframes coordinatePulse {
          0% {
            transform: scale(1);
            box-shadow: 0 4px 16px rgba(62, 69, 51, 0.4);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 6px 24px rgba(62, 69, 51, 0.6), 0 0 0 8px rgba(62, 69, 51, 0.2);
          }
          100% {
            transform: scale(1.05);
            box-shadow: 0 4px 16px rgba(62, 69, 51, 0.4);
          }
        }

        /* Distance measurement markers - force red color */
        .distance-marker {
          width: 16px !important;
          height: 16px !important;
          background: #ff4444 !important;
          background-color: #ff4444 !important;
          border: 3px solid white !important;
          border-radius: 50% !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4) !important;
          z-index: 1000 !important;
        }

        /* Distance measurement lines */
        .distance-line-container {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          pointer-events: none !important;
          z-index: 999 !important;
        }

        .distance-line {
          background-color: #ff4444 !important;
          z-index: 999 !important;
        }

        .distance-label {
          background: rgba(255, 255, 255, 0.95) !important;
          color: #ff4444 !important;
          border: 1px solid #ff4444 !important;
          z-index: 1000 !important;
          font-weight: bold !important;
        }

        /* Aggressive POI marker overrides */
        .custom-poi-marker {
          transition: all 0.2s ease !important;
          z-index: 10 !important;
          position: relative !important;
        }

        .custom-poi-marker:hover {
          transform: scale(1.15) !important;
          z-index: 15 !important;
        }

        /* Ensure consistent POI overlay z-index across all map types */
        .custom-poi-overlay {
          z-index: 1 !important;
          position: absolute !important;
        }

        /* Force all POI markers to stay below popups with maximum specificity */
        div.custom-poi-overlay div.custom-poi-marker {
          z-index: 1 !important;
          position: relative !important;
        }

        div.custom-poi-overlay div.custom-poi-marker:hover {
          z-index: 2 !important;
        }

        /* CRITICAL FIX: Ensure MapLibre popups have higher z-index than POI markers */
        .maplibregl-popup {
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

MapLibreMapComponent.displayName = 'MapLibreMap'
export const MapLibreMap = MapLibreMapComponent

// Extend window for search marker
declare global {
  interface Window {
    searchMarker?: maplibregl.Marker
  }
}

// Helper function to adjust color brightness
function _adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
}
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { MapLibreMap, MapLibreMapRef } from './components/MapLibreMap'
import { CategoryPanel } from './components/CategoryPanel'
import { TrailPanel } from './components/TrailPanel'
import { NaturskogPanel } from './components/NaturskogPanel'
import { HurtigtasterButton } from './components/HurtigtasterButton'
import { SlettDataButton } from './components/SlettDataButton'
import { AdminControls } from './components/AdminControls'
import { TrailDetails } from './components/TrailDetails'
import { SearchBox, SearchBoxRef } from './components/SearchBox'
import { CoordinateDisplay } from './components/CoordinateDisplay'
import { MapTypePanel } from './components/MapTypePanel'
import { categoryTree, CategoryState, POI, POIType } from './data/pois'
import type { Trail, TrailType } from './data/trails'
import { OverpassService, OverpassPOI } from './services/overpassService'
import { SearchResult, SearchService } from './services/searchService'
import { poiDataService } from './services/poiDataService'
import { TilfluktsromService, TilfluktsromPOI } from './services/tilfluktsromService'
import { EnturService, EnturStop } from './services/enturService'
import { krigsminneEnhancementService } from './services/krigsminneEnhancementService'
import { DistanceMeasurement } from './services/distanceService'
import { NaturskogLayerType, NaturskogService } from './services/naturskogService'
import { TurrutebasenService } from './services/turrutebasenService'
import { useUIStore } from './state/uiStore'
import { UIProvider } from './state/UIProvider'
import { HurtigtasterModal } from './features/shortcuts/HurtigtasterModal'
import { TegnforklaringModal } from './features/legend/TegnforklaringModal'
import { AdminLoginModal } from './components/modal/AdminLoginModal'
import { AdminPanel } from './components/modal/AdminPanel'
import { InstallPromptModal } from './components/InstallPromptModal'
import './services/adminService' // Import to make adminService available globally

function MapLibreTrakkeAppInner() {
  // UI Store for modal management
  const {
    isHurtigtasterOpen,
    isTegnforklaringOpen,
    closeHurtigtaster,
    closeTegnforklaring
  } = useUIStore()

  // Category state - "På eventyr" expanded, no categories checked by default
  const [categoryState, setCategoryState] = useState<CategoryState>({
    checked: {
      // No categories checked by default - user must actively select them
    },
    expanded: {
      // Keep "På eventyr" collapsed by default - user can expand if interested
      // 'på_eventyr': false (default state)
    }
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Hidden by default
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [mapType, setMapType] = useState<'topo' | 'satellite'>('topo') // Default to topo map
  const [currentViewport, setCurrentViewport] = useState<{ north: number; south: number; east: number; west: number; zoom: number } | null>(null)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [mapBearing, setMapBearing] = useState(0) // Track current map bearing for compass
  const [currentZoom, setCurrentZoom] = useState(7) // Track current zoom level for scale display (matches initial map zoom)
  const [currentCoordinates, setCurrentCoordinates] = useState<{lat: number, lng: number} | null>(null) // Track cursor coordinates
  const [coordinatesCopied, setCoordinatesCopied] = useState(false) // Track coordinate copy feedback
  const [mapControlsVisible, setMapControlsVisible] = useState(true) // Track map controls visibility

  // Distance measurement state
  const [distanceMeasurements, setDistanceMeasurements] = useState<DistanceMeasurement[]>([])
  const [isDistanceMeasuring, setIsDistanceMeasuring] = useState(false)

  // Layer state tracking for re-initialization after style changes
  const [activeNaturskogLayers, setActiveNaturskogLayers] = useState<Set<NaturskogLayerType>>(new Set())

  // Attribution modal state
  const [isAttributionOpen, setIsAttributionOpen] = useState(false)

  // PWA Install Prompt state
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  // POI data state (currently only Krigsminne from OpenStreetMap)
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Trail data state
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null)
  const [_highlightedTrail, setHighlightedTrail] = useState<Trail | null>(null)
  const [showTrailDetails, setShowTrailDetails] = useState(false)
  const [_activeTrailTypes, _setActiveTrailTypes] = useState<TrailType[]>([])

  // Ref for search input to enable keyboard shortcut focus
  const searchInputRef = useRef<SearchBoxRef>(null)
  const _searchService = useRef(new SearchService())
  const _tilfluktsromService = useRef(new TilfluktsromService())
  const mapRef = useRef<MapLibreMapRef>(null)



  // Handle search result selection
  const handleSearchResultClick = useCallback((result: SearchResult) => {
    // Clear any previous search result first
    setSearchResult(null)
    // Set new search result after a brief delay to ensure cleanup
    setTimeout(() => {
      setSearchResult(result)
    }, 50)
  }, [])

  // Handle location button click - with toggle functionality
  const handleLocationClick = useCallback(() => {

    // Toggle off: If location is already active, clear it
    if (userLocation && !locationLoading) {
      setUserLocation(null)
      return
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser')
      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        // Check if location is within Norwegian bounds
        const norwegianBounds = {
          north: 72.0,
          south: 57.5,
          east: 32.0,
          west: 4.0
        }

        if (latitude >= norwegianBounds.south && latitude <= norwegianBounds.north &&
            longitude >= norwegianBounds.west && longitude <= norwegianBounds.east) {
          setUserLocation({ lat: latitude, lng: longitude })
        } else {
          console.warn('⚠️ Location outside Norway bounds, but setting regardless')
          setUserLocation({ lat: latitude, lng: longitude })
        }

        setLocationLoading(false)
      },
      (error) => {
        console.error('Error getting location:', error.message)
        setLocationLoading(false)

        // Provide user-friendly error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error('Location access denied by user')
            break
          case error.POSITION_UNAVAILABLE:
            console.error('Location information unavailable')
            break
          case error.TIMEOUT:
            console.error('Location request timed out')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [locationLoading, userLocation])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  // Enhanced keyboard shortcuts for navigation and search
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K / ⌘+K: Open sidebar and focus search (or close if search already focused)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        event.stopPropagation()

        const activeElement = document.activeElement as HTMLElement
        const isSearchFocused = activeElement?.closest('[data-search-box]')

        if (sidebarCollapsed) {
          // Sidebar is collapsed, open it first then focus search
          setSidebarCollapsed(false)
          setTimeout(() => {
            searchInputRef.current?.focusInput()
          }, 300) // Wait for sidebar animation
        } else if (isSearchFocused) {
          // Search is already focused, close sidebar
          setSidebarCollapsed(true)
        } else {
          // Sidebar is open but search not focused, focus search
          searchInputRef.current?.focusInput()
        }
      }
      
      // Escape: Collapse sidebar (if open) or blur search (if focused)
      else if (event.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement
        const isSearchFocused = activeElement?.closest('[data-search-box]')
        
        if (isSearchFocused) {
          // If search is focused, blur it first
          activeElement?.blur()
          event.preventDefault()
        } else if (!sidebarCollapsed) {
          // If sidebar is open and search not focused, collapse sidebar
          setSidebarCollapsed(true)
          event.preventDefault()
        }
      }
      
      // Ctrl+B / ⌘+B: Toggle sidebar
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        event.stopPropagation()
        toggleSidebar()
      }
    }
    
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [sidebarCollapsed, toggleSidebar])

  // PWA Install Prompt - show on first visit or after 7 days if dismissed (MOBILE ONLY)
  useEffect(() => {
    const checkInstallPrompt = () => {
      const DISMISSED_KEY = 'pwa-install-dismissed'
      const INSTALLED_KEY = 'pwa-installed'

      // Only show on mobile devices (not desktop)
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = /iphone|ipad|ipod|android/.test(userAgent)

      if (!isMobile) {
        return // Skip install prompt on desktop
      }

      // Check if already installed (standalone mode)
      // iOS Safari has a non-standard 'standalone' property on navigator
      interface NavigatorStandalone extends Navigator {
        standalone?: boolean
      }
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as NavigatorStandalone).standalone === true
        || document.referrer.includes('android-app://')

      if (isStandalone) {
        localStorage.setItem(INSTALLED_KEY, 'true')
        return
      }

      // Check if user has installed before
      if (localStorage.getItem(INSTALLED_KEY)) {
        return
      }

      // Check if user dismissed the prompt
      const dismissedTime = localStorage.getItem(DISMISSED_KEY)
      if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
        if (daysSinceDismissed < 7) {
          return
        }
      }

      // Show prompt after a short delay (let the page load first)
      const timer = setTimeout(() => {
        setShowInstallPrompt(true)
      }, 3000)

      return () => clearTimeout(timer)
    }

    checkInstallPrompt()
  }, [])

  const handleInstallPromptClose = useCallback(() => {
    setShowInstallPrompt(false)
  }, [])

  const handleCategoryToggle = useCallback((nodeId: string) => {
    setCategoryState(prev => {
      const newChecked = { ...prev.checked }
      const isCurrentlyChecked = prev.checked[nodeId]
      const isChecked = !isCurrentlyChecked
      
      // Update the clicked category
      newChecked[nodeId] = isChecked
      
      // Find the node in the category tree
      const findNode = (nodes: typeof categoryTree, id: string): typeof categoryTree[0] | null => {
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
          const setChildrenState = (children: typeof categoryTree, state: boolean) => {
            children.forEach(child => {
              newChecked[child.id] = state
              if (child.children) {
                setChildrenState(child.children, state)
              }
            })
          }
          setChildrenState(clickedNode.children, isChecked)
        }
        
        // If this is a child category, handle parent state logic
        if (clickedNode.parent) {
          const parentNode = findNode(categoryTree, clickedNode.parent)
          if (parentNode?.children) {
            const allChildrenChecked = parentNode.children.every(child => newChecked[child.id])
            const someChildrenChecked = parentNode.children.some(child => newChecked[child.id])
            
            if (allChildrenChecked) {
              // If all children are checked, check parent
              newChecked[clickedNode.parent] = true
            } else if (!someChildrenChecked) {
              // If no children are checked, uncheck parent
              newChecked[clickedNode.parent] = false
            }
          }
        }
      }
      
      const newState = {
        ...prev,
        checked: newChecked
      }
      

      // Handle category selection changes
      setTimeout(async () => {
        const activeCategories = getActiveCategories(newState)
        
        if (activeCategories.length === 0) {
          setPois([])
          return
        }
        
        // Load POI data only if we have viewport (prevents loading during initial render)
        if (currentViewport) {
          setLoading(true)
          setError(null)
          
          try {
            let allPOIs: POI[] = []
            
            // Load Krigsminne from OpenStreetMap if krigsminne category is active
            if (activeCategories.includes('krigsminne')) {
              const overpassPOIs = await OverpassService.fetchKrigsminnePOIs(currentViewport)

              const transformedOverpassPOIs = await transformOverpassPOIs(overpassPOIs)
              allPOIs = [...allPOIs, ...transformedOverpassPOIs]

            }
            
            // Load cave entrances from OpenStreetMap if hule category is active
            if (activeCategories.includes('hule')) {
              const cavePOIs = await OverpassService.fetchCaveEntrancePOIs(currentViewport)
              
              const transformedCavePOIs = transformCavePOIs(cavePOIs)
              allPOIs = [...allPOIs, ...transformedCavePOIs]
              
            }
            
            // Load observation towers from OpenStreetMap if observasjonstårn category is active
            if (activeCategories.includes('observasjonstårn')) {
              const towerPOIs = await OverpassService.fetchObservationTowerPOIs(currentViewport)
              
              const transformedTowerPOIs = transformTowerPOIs(towerPOIs)
              allPOIs = [...allPOIs, ...transformedTowerPOIs]
              

              // Also load hunting stands for observasjonstårn category
              const huntingStandPOIs = await OverpassService.fetchHuntingStandPOIs(currentViewport)
              
              const transformedHuntingStandPOIs = transformHuntingStandPOIs(huntingStandPOIs)
              allPOIs = [...allPOIs, ...transformedHuntingStandPOIs]
              
            }

            // Load fire pits from OpenStreetMap if bålplass category is active
            if (activeCategories.includes('bålplass')) {
              const firepitPOIs = await OverpassService.fetchFirepitPOIs(currentViewport)
              
              const transformedFirepitPOIs = transformFirepitPOIs(firepitPOIs)
              allPOIs = [...allPOIs, ...transformedFirepitPOIs]
              
            }

            // Load shelters from OpenStreetMap if gapahuk_vindskjul category is active
            if (activeCategories.includes('gapahuk_vindskjul')) {
              const shelterPOIs = await OverpassService.fetchShelterPOIs(currentViewport)

              const transformedShelterPOIs = transformShelterPOIs(shelterPOIs)
              allPOIs = [...allPOIs, ...transformedShelterPOIs]

            }

            // Load tilfluktsrom from Geonorge WFS if tilfluktsrom category is active
            if (activeCategories.includes('tilfluktsrom')) {
              try {
                const tilfluktsromPOIs = await _tilfluktsromService.current.fetchTilfluktsrom(currentViewport)

                const transformedTilfluktsromPOIs = transformTilfluktsromPOIs(tilfluktsromPOIs)
                allPOIs = [...allPOIs, ...transformedTilfluktsromPOIs]

              } catch (tilfluktsromError) {
                console.error('❌ Error loading tilfluktsrom data:', tilfluktsromError)
                setError(`Feil ved lasting av tilfluktsrom: ${tilfluktsromError instanceof Error ? tilfluktsromError.message : 'Ukjent feil'}`)
              }
            }

            // Load bus stops from Entur API if bussholdeplass category is active
            // Only load when zoomed in (zoom >= 10) to avoid overwhelming the map
            if (activeCategories.includes('bussholdeplass')) {
              if (currentViewport.zoom >= 10) {
                try {
                  const busStops = await EnturService.fetchBusStops(currentViewport)

                  const transformedBusStops = transformEnturStops(busStops, 'bus')
                  allPOIs = [...allPOIs, ...transformedBusStops]

                } catch (enturError) {
                  console.error('❌ Error loading bus stops:', enturError)
                  setError(`Feil ved lasting av bussholdeplasser: ${enturError instanceof Error ? enturError.message : 'Ukjent feil'}`)
                }
              }
            }

            // Load train stations from Entur API if togstasjon category is active
            // Train stations can load at lower zoom (8+) as there are fewer of them
            if (activeCategories.includes('togstasjon')) {
              if (currentViewport.zoom >= 8) {
                try {
                  const trainStations = await EnturService.fetchTrainStations(currentViewport)

                  const transformedStations = transformEnturStops(trainStations, 'train')
                  allPOIs = [...allPOIs, ...transformedStations]

                } catch (enturError) {
                  console.error('❌ Error loading train stations:', enturError)
                  setError(`Feil ved lasting av togstasjoner: ${enturError instanceof Error ? enturError.message : 'Ukjent feil'}`)
                }
              }
            }

            // Load cable cars from OpenStreetMap if taubane category is active
            if (activeCategories.includes('taubane')) {
              const cableCarPOIs = await OverpassService.fetchCableCarPOIs(currentViewport)

              const transformedCableCarPOIs = transformCableCarPOIs(cableCarPOIs)
              allPOIs = [...allPOIs, ...transformedCableCarPOIs]

            }

            // Load waterfalls from OpenStreetMap if foss category is active
            if (activeCategories.includes('foss')) {
              const waterfallPOIs = await OverpassService.fetchWaterfallPOIs(currentViewport)

              const transformedWaterfallPOIs = transformWaterfallPOIs(waterfallPOIs)
              allPOIs = [...allPOIs, ...transformedWaterfallPOIs]

            }

            // Load viewpoints from OpenStreetMap if utsiktspunkt category is active
            if (activeCategories.includes('utsiktspunkt')) {
              const viewpointPOIs = await OverpassService.fetchViewpointPOIs(currentViewport)

              const transformedViewpointPOIs = transformViewpointPOIs(viewpointPOIs)
              allPOIs = [...allPOIs, ...transformedViewpointPOIs]

            }


            // Load custom POIs from local storage for all active categories
            const customPOIs = await poiDataService.getPOIsByCategories(activeCategories)
            if (customPOIs.length > 0) {
              allPOIs = [...allPOIs, ...(customPOIs as POI[])]
            }

            setPois(allPOIs)
          } catch (err) {
            console.error('❌ Error loading POIs:', err)
            setError('Kunne ikke laste POI-data')
            setPois([])
          } finally {
            setLoading(false)
          }
        }
      }, 100)

      return newState
    })
  }, [currentViewport]) // eslint-disable-line react-hooks/exhaustive-deps -- Transform functions are stable useCallback hooks

  const handleExpandToggle = useCallback((nodeId: string) => {
    setCategoryState(prev => ({
      ...prev,
      expanded: {
        ...prev.expanded,
        [nodeId]: !prev.expanded[nodeId]
      }
    }))
  }, [])

  // Function to refresh POI data when new POIs are added
  const handlePOIAdded = useCallback(() => {
    // Trigger category toggle to reload POIs for active categories
    const activeCategories = getActiveCategories(categoryState)
    if (activeCategories.length > 0 && currentViewport) {
      // Simulate a category state change to trigger POI reload
      setCategoryState(prev => ({ ...prev }))
    }
  }, [categoryState, currentViewport])

  // Function to handle map type changes
  const handleMapTypeChange = useCallback((newMapType: 'topo' | 'satellite') => {
    setMapType(newMapType)
  }, [])

  const handleViewportChange = useCallback((viewport: { north: number; south: number; east: number; west: number; zoom: number }) => {
    setCurrentViewport(viewport)
    setCurrentZoom(viewport.zoom)

    // Only reload POIs for significant viewport changes (not during zoom animations)
    // The category toggle handler will load POIs when categories change
    // This prevents the flickering during zoom by avoiding redundant POI loading
  }, [])

  // Calculate accurate map scale for display
  const getScaleText = useCallback((zoom: number, latitude: number = 60.13): string => {
    // Standard Web Mercator scale calculation
    // At equator: 156543.03392 meters per pixel at zoom 0
    // Adjusted for latitude using cosine correction
    const metersPerPixel = 156543.03392 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom)

    // Standard scale bar lengths (in pixels) and corresponding distances
    const scaleBarPixels = 100 // Standard 100px scale bar
    const scaleBarMeters = metersPerPixel * scaleBarPixels

    // Round to nice cartographic values
    if (scaleBarMeters >= 1000) {
      const km = scaleBarMeters / 1000
      if (km >= 100) return `${Math.round(km / 50) * 50}km`
      else if (km >= 10) return `${Math.round(km / 10) * 10}km`
      else if (km >= 5) return `${Math.round(km / 5) * 5}km`
      else if (km >= 1) return `${Math.round(km)}km`
      else return `${(km).toFixed(1)}km`
    } else {
      if (scaleBarMeters >= 1000) return `${Math.round(scaleBarMeters / 100) * 100}m`
      else if (scaleBarMeters >= 500) return `${Math.round(scaleBarMeters / 100) * 100}m`
      else if (scaleBarMeters >= 100) return `${Math.round(scaleBarMeters / 50) * 50}m`
      else if (scaleBarMeters >= 50) return `${Math.round(scaleBarMeters / 10) * 10}m`
      else if (scaleBarMeters >= 10) return `${Math.round(scaleBarMeters / 5) * 5}m`
      else return `${Math.round(scaleBarMeters)}m`
    }
  }, [])

  // Get max zoom level for current map type
  const _getMaxZoom = useCallback(() => {
    return mapType === 'topo' ? 18 : 17 // Reduced satellite to 17 to avoid "Map data not yet available" tiles
  }, [mapType])

  const handleBearingChange = useCallback((bearing: number) => {
    setMapBearing(bearing)
  }, [])

  const handleCoordinatesChange = useCallback((coordinates: {lat: number, lng: number} | null) => {
    setCurrentCoordinates(coordinates)
  }, [])

  const handleCoordinatesCopied = useCallback((copied: boolean) => {
    setCoordinatesCopied(copied)
    if (copied) {
      // Auto-reset after 2 seconds
      setTimeout(() => setCoordinatesCopied(false), 2000)
    }
  }, [])

  // Trail interaction handlers
  const handleTrailSelect = useCallback((trail: Trail) => {
    setSelectedTrail(trail)
    setShowTrailDetails(true)

    // Focus map on trail bounds
    if (mapRef.current) {
      const map = mapRef.current.getMap()
      if (map && trail.geometry.coordinates.length > 0) {
        // Calculate trail bounds
        const coords = trail.geometry.coordinates
        const bounds = coords.reduce((acc, coord) => {
          return {
            north: Math.max(acc.north, coord[1]),
            south: Math.min(acc.south, coord[1]),
            east: Math.max(acc.east, coord[0]),
            west: Math.min(acc.west, coord[0])
          }
        }, {
          north: coords[0][1],
          south: coords[0][1],
          east: coords[0][0],
          west: coords[0][0]
        })

        // Add some padding to bounds
        const padding = 0.01
        map.fitBounds([
          [bounds.west - padding, bounds.south - padding],
          [bounds.east + padding, bounds.north + padding]
        ], { padding: 50, duration: 1000 })
      }
    }
  }, [])

  const handleTrailHighlight = useCallback((trail: Trail | null) => {
    setHighlightedTrail(trail)
  }, [])

  const handleCloseTrailDetails = useCallback(() => {
    setShowTrailDetails(false)
    setSelectedTrail(null)
  }, [])

  const handleTrailTypesChange = useCallback((activeTypes: TrailType[]) => {
    _setActiveTrailTypes(activeTypes)

    // Update trail visibility on map
    if (mapRef.current) {
      const map = mapRef.current.getMap()
      if (map) {
        // Hide all trail layers first
        const allTrailTypes: TrailType[] = ['hiking', 'cycling', 'skiing', 'other']
        allTrailTypes.forEach(type => {
          const layerId = `turrutebasen-${type}`
          try {
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(layerId, 'visibility', 'none')
            }
          } catch (error) {
            console.warn(`Could not hide trail layer ${layerId}:`, error)
          }
        })

        // Show selected trail layers (with lazy loading)
        activeTypes.forEach(type => {
          const layerId = `turrutebasen-${type}`
          const sourceId = `turrutebasen-${type}`

          try {
            // Lazy initialization: Add layer if it doesn't exist
            if (!map.getLayer(layerId)) {

              // Get layer configuration
              const turrutebasenSources = TurrutebasenService.getWMSLayerSources()
              const source = turrutebasenSources[sourceId]

              if (source) {
                // Add source if it doesn't exist
                if (!map.getSource(sourceId)) {
                  map.addSource(sourceId, source)
                }

                // Add raster layer for WMS
                map.addLayer({
                  id: layerId,
                  type: 'raster',
                  source: sourceId,
                  paint: {
                    'raster-opacity': 0.8
                  }
                })
              }
            }

            // Show the layer
            map.setLayoutProperty(layerId, 'visibility', 'visible')
          } catch (error) {
            console.warn(`Could not show trail layer ${layerId}:`, error)
          }
        })
      }
    }
  }, [])

  // Handle Naturskog layer toggles
  const handleNaturskogLayerToggle = useCallback((layerType: NaturskogLayerType, enabled: boolean) => {

    // Track active layers for re-initialization after style changes
    setActiveNaturskogLayers(prev => {
      const newSet = new Set(prev)
      if (enabled) {
        newSet.add(layerType)
      } else {
        newSet.delete(layerType)
      }
      return newSet
    })

    if (mapRef.current) {
      const map = mapRef.current.getMap()
      if (map) {
        const layerId = `naturskog-${layerType}`
        const sourceId = `naturskog-${layerType}`

        try {
          // Lazy initialization: Add layer if it doesn't exist
          if (!map.getLayer(layerId)) {

            // Get layer configuration
            const naturskogSources = NaturskogService.getWMSLayerSources()
            const naturskogLayers = NaturskogService.getMapLayers()

            const source = naturskogSources[sourceId]
            const layerConfig = naturskogLayers.find(l => l.id === layerId)

            if (source && layerConfig) {
              // Add source if it doesn't exist
              if (!map.getSource(sourceId)) {
                map.addSource(sourceId, source)
              }

              // Add layer
              map.addLayer(layerConfig)
            }
          }

          // Toggle layer visibility
          map.setLayoutProperty(layerId, 'visibility', enabled ? 'visible' : 'none')
        } catch (error) {
          console.warn(`⚠️ Could not toggle Naturskog layer ${layerType}:`, error)
        }
      }
    }
  }, [])

  // Re-apply active layers after map style changes
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current.getMap()
    if (!map) return

    // Wait for style to load before re-adding layers
    const handleStyleLoad = () => {

      // Re-trigger trail layers if any are active
      if (_activeTrailTypes.length > 0) {
        handleTrailTypesChange(_activeTrailTypes)
      }

      // Re-trigger Naturskog layers if any are active
      if (activeNaturskogLayers.size > 0) {
        activeNaturskogLayers.forEach(layerType => {
          handleNaturskogLayerToggle(layerType, true)
        })
      }
    }

    void map.once('styledata', handleStyleLoad)

    return () => {
      if (map) {
        map.off('styledata', handleStyleLoad)
      }
    }
  }, [mapType, _activeTrailTypes, activeNaturskogLayers, handleTrailTypesChange, handleNaturskogLayerToggle])

  // Helper function to get active category IDs from category state
  const getActiveCategories = (state: CategoryState): string[] => {
    const activeCategories: string[] = []
    
    function checkNode(node: typeof categoryTree[0]) {
      if (state.checked[node.id]) {
        // Categories with actual POI data
        if (node.id === 'krigsminne') {
          activeCategories.push('krigsminne')
        } else if (node.id === 'hule') {
          activeCategories.push('hule')
        } else if (node.id === 'observasjonstårn') {
          activeCategories.push('observasjonstårn')
        } else if (node.id === 'bålplass') {
          activeCategories.push('bålplass')
        } else if (node.id === 'gapahuk_vindskjul') {
          activeCategories.push('gapahuk_vindskjul')
        } else if (node.id === 'tilfluktsrom') {
          activeCategories.push('tilfluktsrom')
        } else if (node.id === 'bussholdeplass') {
          activeCategories.push('bussholdeplass')
        } else if (node.id === 'togstasjon') {
          activeCategories.push('togstasjon')
        }
      }
      if (node.children) {
        node.children.forEach(checkNode)
      }
    }
    
    categoryTree.forEach(checkNode)
    return activeCategories
  }


  // Transform Overpass POIs to our POI interface with enhanced data
  const transformOverpassPOIs = async (overpassPOIs: OverpassPOI[]): Promise<POI[]> => {

    const transformedPOIs = await Promise.all(
      overpassPOIs.map(async poi => {
        const basePOI: POI = {
          id: poi.id,
          name: ensureUTF8(poi.name),
          description: ensureUTF8(poi.tags.description) || 'Krigsminne',
          type: 'war_memorials' as POIType,
          color: '#7c3aed', // På eventyr category color (purple) - war memorials
          lat: poi.lat,
          lng: poi.lng
        }

        // Enhance with additional data for Krigsminne POIs
        try {
          const enhancedData = await krigsminneEnhancementService.enhancePOI(
            poi.lat,
            poi.lng,
            poi.name
          )

          if (enhancedData && Object.keys(enhancedData).length > 0) {
            basePOI.enhancedData = enhancedData
          }
        } catch (enhancementError) {
          console.warn(`⚠️ Could not enhance ${poi.name}:`, enhancementError)
        }

        return basePOI
      })
    )

    return transformedPOIs
  }

  // Transform Cave entrance POIs to our POI interface
  const transformCavePOIs = (cavePOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = cavePOIs.map(poi => ({
      id: poi.id,
      name: ensureUTF8(poi.name),
      description: ensureUTF8(poi.tags.description) || 'Hule', // Use exact category name
      type: 'nature_gems' as POIType, // Keep existing POI type for compatibility
      color: '#7c3aed', // På eventyr category color (purple) - hule belongs to this category
      lat: poi.lat,
      lng: poi.lng
    }))
    
    return transformedPOIs
  }

  // Transform observation tower POIs to our POI interface
  const transformTowerPOIs = (towerPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = towerPOIs.map(poi => ({
      id: poi.id,
      name: ensureUTF8(poi.name),
      description: ensureUTF8(poi.tags.description) || 'Observasjonstårn', // Use exact category name
      type: 'viewpoints' as POIType, // All tower POIs are categorized as viewpoints
      color: '#7c3aed', // På eventyr category color (purple) - observation towers
      lat: poi.lat,
      lng: poi.lng
    }))
    
    return transformedPOIs
  }

  // Transform hunting stand POIs to our POI interface
  const transformHuntingStandPOIs = (huntingStandPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = huntingStandPOIs.map(poi => {
      // Extract specific name or use location-based fallback
      let specificName = poi.name
      if (!specificName || specificName === 'Jakttårn') {
        specificName = poi.tags.place || poi.tags.addr_place || poi.tags.addr_city || 
                      poi.tags['name:place'] || `Jakttårn`
      }
      
      // Create category-specific description
      const categoryInfo = 'Observasjonstårn'
      const additionalInfo = []
      
      if (poi.tags.hunting === 'yes') additionalInfo.push('Jakttårn')
      if (poi.tags.access) additionalInfo.push(`Tilgang: ${translateTagValue(poi.tags.access)}`)
      if (poi.tags.height) additionalInfo.push(`Høyde: ${poi.tags.height}m`)
      
      const description = additionalInfo.length > 0 
        ? `${categoryInfo}. ${additionalInfo.join('. ')}`
        : categoryInfo
      
      return {
        id: poi.id,
        name: ensureUTF8(specificName),
        description: ensureUTF8(description),
        type: 'viewpoints' as POIType,
        lat: poi.lat,
        lng: poi.lng,
        color: '#7c3aed' // På eventyr category color (purple) - observation towers  
      }
    })
    
    return transformedPOIs
  }

  // Transform firepit POIs to our POI interface
  const transformFirepitPOIs = (firepitPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = firepitPOIs.map(poi => {
      // Extract specific name or use location-based fallback
      let specificName = poi.name
      if (!specificName || specificName === 'Bål-/grillplass') {
        // Try to get location name from tags
        specificName = poi.tags.place || poi.tags.addr_place || poi.tags.addr_city || 
                      poi.tags['name:place'] || `Bål-/grillplass`
      }
      
      // Create category-specific description
      const categoryInfo = 'Bål-/grillplass'
      const additionalInfo = []
      
      if (poi.tags.fuel) additionalInfo.push(`Brennstoff: ${translateTagValue(poi.tags.fuel)}`)
      if (poi.tags.access) additionalInfo.push(`Tilgang: ${translateTagValue(poi.tags.access)}`)
      if (poi.tags.fee === 'yes') additionalInfo.push('Avgift påkrevd')
      if (poi.tags.fee === 'no') additionalInfo.push('Gratis')
      
      const description = additionalInfo.length > 0 
        ? `${categoryInfo}. ${additionalInfo.join('. ')}`
        : categoryInfo
      
      return {
        id: poi.id,
        name: ensureUTF8(specificName),
        description: ensureUTF8(description),
        type: 'fire_places' as POIType,
        lat: poi.lat,
        lng: poi.lng,
        color: '#3e4533' // Use "Aktivitet" category color (green)
      }
    })
    
    return transformedPOIs
  }

  // Transform shelter POIs to our POI interface
  const transformShelterPOIs = (shelterPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = shelterPOIs.map(poi => {
      // Extract specific name or use location-based fallback
      let specificName = poi.name
      if (!specificName || specificName === 'Gapahuk/vindskjul') {
        specificName = poi.tags.place || poi.tags.addr_place || poi.tags.addr_city || 
                      poi.tags['name:place'] || `Gapahuk/vindskjul`
      }
      
      // Create category-specific description
      const categoryInfo = 'Gapahuk/vindskjul'
      const additionalInfo = []
      
      if (poi.tags.shelter_type) additionalInfo.push(translateTagValue(poi.tags.shelter_type))
      
      if (poi.tags.capacity) additionalInfo.push(`Kapasitet: ${poi.tags.capacity} personer`)
      if (poi.tags.access) additionalInfo.push(`Tilgang: ${translateTagValue(poi.tags.access)}`)
      if (poi.tags.fee === 'yes') additionalInfo.push('Avgift påkrevd')
      if (poi.tags.fee === 'no') additionalInfo.push('Gratis')
      
      const description = additionalInfo.length > 0 
        ? `${categoryInfo}. ${additionalInfo.join('. ')}`
        : categoryInfo
      
      return {
        id: poi.id,
        name: ensureUTF8(specificName),
        description: ensureUTF8(description),
        type: 'wilderness_shelter' as POIType,
        lat: poi.lat,
        lng: poi.lng,
        color: '#b45309' // Use "Overnatte" category color (orange)
      }
    })
    
    return transformedPOIs
  }

  // Transform tilfluktsrom POIs to our POI interface
  const transformTilfluktsromPOIs = (tilfluktsromPOIs: TilfluktsromPOI[]): POI[] => {
    const transformedPOIs = tilfluktsromPOIs.map(poi => ({
      id: poi.id,
      name: ensureUTF8(poi.name),
      description: ensureUTF8(poi.tags.description ?? 'Offentlig tilfluktsrom'),
      type: 'emergency_shelters' as POIType,
      lat: poi.lat,
      lng: poi.lng,
      color: '#ea580c' // Use "Service" category color (orange)
    }))

    return transformedPOIs
  }

  // Transform Entur stops (bus/train) to our POI interface
  const transformEnturStops = (enturStops: EnturStop[], stopType: 'bus' | 'train'): POI[] => {
    const transportColor = '#0284c7' // Transport category color
    const isBus = stopType === 'bus'

    const transformedPOIs = enturStops.map(stop => ({
      id: stop.id,
      name: ensureUTF8(stop.name),
      description: stop.locality
        ? `${isBus ? 'Bussholdeplass' : 'Togstasjon'} i ${stop.locality}`
        : isBus ? 'Bussholdeplass' : 'Togstasjon',
      type: (isBus ? 'public_transport' : 'train_stations') as POIType,
      lat: stop.lat,
      lng: stop.lng,
      color: transportColor
    }))

    return transformedPOIs
  }

  // Transform cable car POIs to our POI interface
  const transformCableCarPOIs = (cableCarPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = cableCarPOIs.map(poi => {
      let specificName = poi.name
      if (!specificName || specificName === 'Taubane') {
        specificName = poi.tags.place || poi.tags.addr_place || poi.tags.addr_city ||
                      poi.tags['name:place'] || 'Taubane'
      }

      const categoryInfo = 'Taubane'
      const additionalInfo = []

      if (poi.tags.aerialway === 'cable_car') additionalInfo.push('Kabelbane')
      else if (poi.tags.aerialway === 'gondola') additionalInfo.push('Gondol')
      else if (poi.tags.aerialway === 'goods') additionalInfo.push('Godsbane')

      if (poi.tags.access) additionalInfo.push(`Tilgang: ${translateTagValue(poi.tags.access)}`)
      if (poi.tags.capacity) additionalInfo.push(`Kapasitet: ${poi.tags.capacity}`)

      const description = additionalInfo.length > 0
        ? `${categoryInfo}. ${additionalInfo.join('. ')}`
        : categoryInfo

      return {
        id: poi.id,
        name: ensureUTF8(specificName),
        description: ensureUTF8(description),
        type: 'cable_cars' as POIType,
        lat: poi.lat,
        lng: poi.lng,
        color: '#0284c7' // Transport category color (blue)
      }
    })

    return transformedPOIs
  }

  // Transform waterfall POIs to our POI interface
  const transformWaterfallPOIs = (waterfallPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = waterfallPOIs.map(poi => {
      let specificName = poi.name
      if (!specificName || specificName === 'Foss') {
        specificName = poi.tags.place || poi.tags.addr_place || poi.tags.addr_city ||
                      poi.tags['name:place'] || 'Foss'
      }

      const categoryInfo = 'Foss'
      const additionalInfo = []

      if (poi.tags.height) additionalInfo.push(`Høyde: ${poi.tags.height}m`)
      if (poi.tags.intermittent === 'yes') additionalInfo.push('Sesongavhengig')

      const description = additionalInfo.length > 0
        ? `${categoryInfo}. ${additionalInfo.join('. ')}`
        : categoryInfo

      return {
        id: poi.id,
        name: ensureUTF8(specificName),
        description: ensureUTF8(description),
        type: 'nature_gems' as POIType,
        lat: poi.lat,
        lng: poi.lng,
        color: '#7c3aed' // Naturperle category color (purple)
      }
    })

    return transformedPOIs
  }

  // Transform viewpoint POIs to our POI interface
  const transformViewpointPOIs = (viewpointPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = viewpointPOIs.map(poi => {
      let specificName = poi.name
      if (!specificName || specificName === 'Utsiktspunkt') {
        specificName = poi.tags.place || poi.tags.addr_place || poi.tags.addr_city ||
                      poi.tags['name:place'] || 'Utsiktspunkt'
      }

      const categoryInfo = 'Utsiktspunkt'
      const additionalInfo = []

      if (poi.tags.ele) additionalInfo.push(`Høyde: ${poi.tags.ele}moh`)
      if (poi.tags.direction) additionalInfo.push(`Retning: ${poi.tags.direction}°`)
      if (poi.tags.access) additionalInfo.push(`Tilgang: ${translateTagValue(poi.tags.access)}`)

      const description = additionalInfo.length > 0
        ? `${categoryInfo}. ${additionalInfo.join('. ')}`
        : categoryInfo

      return {
        id: poi.id,
        name: ensureUTF8(specificName),
        description: ensureUTF8(description),
        type: 'viewpoints' as POIType,
        lat: poi.lat,
        lng: poi.lng,
        color: '#7c3aed' // Naturperle category color (purple)
      }
    })

    return transformedPOIs
  }

  // Helper function to translate common OpenStreetMap tag values to Norwegian
  const translateTagValue = (tagValue: string): string => {
    const translations: Record<string, string> = {
      // Access values
      'private': 'privat',
      'no': 'ingen tilgang',
      'yes': 'offentlig tilgang',
      'customers': 'kun for kunder',
      'permit': 'kun med tillatelse',
      'public': 'offentlig',
      // Shelter types
      'basic_hut': 'enkel hytte',
      'weather_shelter': 'værbeskyttelse', 
      'rock_shelter': 'bergskjul',
      'lavvu': 'lavvo',
      // Fuel types (common ones)
      'wood': 'ved',
      'charcoal': 'kull',
      'gas': 'gass',
      'electric': 'elektrisk',
      // General
      'unknown': 'ukjent'
    }
    
    return translations[tagValue.toLowerCase()] || tagValue
  }

  // Helper function to ensure proper UTF-8 encoding for Norwegian characters
  const ensureUTF8 = (text: string): string => {
    if (!text) return text
    
    // Fix common Norwegian character encoding issues
    return text
      .replace(/Ã¦/g, 'æ')
      .replace(/Ã¸/g, 'ø') 
      .replace(/Ã¥/g, 'å')
      .replace(/Ã†/g, 'Æ')
      .replace(/Ã˜/g, 'Ø')
      .replace(/Ã…/g, 'Å')
      .replace(/â€"/g, '–')
      .replace(/â€™/g, "'")
  }

  return (
    <>
      {/* CSS for location button loading animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div className="app" style={{ 
        position: 'relative',
        width: '100vw',
        height: '100vh', 
        fontFamily: 'Exo 2, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
      {/* Map Container - Full Viewport */}
      <div className="map-container" style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        zIndex: 0
      }}>
        {/* MapLibre Map */}
        <MapLibreMap
          ref={mapRef}
          pois={pois}
          categoryState={categoryState}
          categoryTree={categoryTree}
          onCategoryToggle={handleCategoryToggle}
          onExpandToggle={handleExpandToggle}
          onViewportChange={handleViewportChange}
          onBearingChange={handleBearingChange}
          onCoordinatesChange={handleCoordinatesChange}
          onCoordinatesCopied={handleCoordinatesCopied}
          searchResult={searchResult}
          userLocation={userLocation}
          sidebarCollapsed={sidebarCollapsed}
          mapType={mapType}
          distanceMeasurements={distanceMeasurements}
          onDistanceMeasurementUpdate={setDistanceMeasurements}
          isDistanceMeasuring={isDistanceMeasuring}
          onDistanceMeasuringChange={setIsDistanceMeasuring}
          activeTrailTypes={_activeTrailTypes}
          onTrailSelect={handleTrailSelect}
          onTrailHighlight={handleTrailHighlight}
        />
      </div>

      {/* Sidebar Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: sidebarCollapsed ? '0px' : '340px',
        height: '100vh',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 80,
        boxShadow: sidebarCollapsed ? 'none' : '4px 0 20px rgba(0, 0, 0, 0.08)'
      }}>
        {!sidebarCollapsed && (
          <>
            {/* Header */}
            <div style={{
              padding: '24px 20px 20px',
              borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)'
            }}>
              <h1 style={{
                margin: '0 0 8px 0',
                fontSize: '24px',
                fontWeight: '600',
                color: '#3e4533',
                fontFamily: 'Exo 2, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  fontFamily: 'Material Symbols Outlined',
                  fontSize: '26px',
                  color: '#3e4533',
                  fontWeight: '400',
                  fontVariationSettings: '"wght" 400'
                }}>
                  forest
                </span>
                Tråkke
              </h1>
              <p style={{
                margin: '-10px 0 8px 0',
                fontSize: '13px',
                color: '#6b7280', // Lighter text as specified in UI refinements
                fontWeight: '400',
                lineHeight: '1.5',
                letterSpacing: '0.1px',
                fontStyle: 'italic'
              }}>
                Oppdag Norge med turskoa på
              </p>

            </div>

            {/* Search */}
            <div style={{ padding: '20px 20px 16px' }}>
              <SearchBox
                ref={searchInputRef}
                onLocationSelect={handleSearchResultClick}
                pois={pois}
                placeholder="Hvor går turen?"
              />
            </div>

            {/* Coordinate Display (mobile only) */}
            <CoordinateDisplay coordinates={currentCoordinates} />

            {/* Categories and Footer */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '0 20px 0px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <MapTypePanel
                mapType={mapType}
                onMapTypeChange={handleMapTypeChange}
              />

              <CategoryPanel
                categoryTree={categoryTree}
                categoryState={categoryState}
                onCategoryToggle={handleCategoryToggle}
                onExpandToggle={handleExpandToggle}
                pois={pois}
                loading={loading}
                error={error}
              />

              <NaturskogPanel
                onLayerToggle={handleNaturskogLayerToggle}
              />
              <TrailPanel
                onTrailTypesChange={handleTrailTypesChange}
              />

              <HurtigtasterButton />

              <SlettDataButton />

              <AdminControls />

              {/* Last updated text - flows with content */}
              <div style={{
                marginTop: 'auto',
                marginBottom: '24px',
                padding: '16px 0 20px',
                textAlign: 'left',
                borderTop: '1px solid rgba(241, 245, 249, 0.6)',
                background: 'rgba(248, 250, 252, 0.8)',
                backdropFilter: 'blur(8px)'
              }}>
                <p style={{
                  margin: '0',
                  fontSize: '10px',
                  color: '#94a3b8',
                  fontWeight: '400',
                  lineHeight: '1.5',
                  letterSpacing: '0.2px',
                  textTransform: 'uppercase',
                  opacity: 0.8
                }}>
                  Under utvikling • Sist oppdatert 27. okt 2025
                </p>
              </div>
            </div>
          </>
        )}
        
      </div>
      
      {/* Sidebar Toggle Button - Right Edge */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar navigation"
        className="sidebar-toggle"
        tabIndex={2}
        style={{
          position: 'absolute',
          left: sidebarCollapsed ? '0' : '340px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 90,
          width: '32px',
          height: '48px',
          background: sidebarCollapsed ? 'rgba(255, 255, 255, 0.95)' : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '0 8px 8px 0',
          border: 'none',
          borderLeft: sidebarCollapsed ? 'none' : '1px solid #e2e8f0',
          boxShadow: sidebarCollapsed ? '2px 0 8px rgba(0, 0, 0, 0.1)' : 'none',
          backdropFilter: 'blur(8px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginLeft: sidebarCollapsed ? '0' : '-1px',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = sidebarCollapsed ? 'rgba(255, 255, 255, 1.0)' : '#ffffff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = sidebarCollapsed ? 'rgba(255, 255, 255, 0.95)' : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleSidebar()
          }
        }}
      >
        <span style={{
          fontFamily: 'Material Symbols Outlined',
          fontSize: '16px',
          color: '#555'
        }}>
          {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* UI Overlay Components */}

      {/* Unified Map Controls - Right Side (Order: Zoom group, Location, Ruler, Info) */}
      {mapControlsVisible && (
        <div className="map-controls" style={{
          position: 'absolute',
          bottom: '24px',
          right: (() => {
            if (window.innerWidth < 768) {
              // On mobile, always position at right edge regardless of sidebar state
              return '3px'
            }
            return '11px'
          })(),
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
        {/* Eye Button - Controls Toggle */}
        <button
          onClick={() => setMapControlsVisible(!mapControlsVisible)}
          aria-label={mapControlsVisible ? "Hide map controls" : "Show map controls"}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            fontSize: '12px',
            color: '#374151'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '16px',
            transform: mapControlsVisible ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease'
          }}>
            {mapControlsVisible ? 'visibility_off' : 'visibility'}
          </span>
        </button>

        {/* 1. Zoom Button Group (connected vertically) with Current Zoom and Scale Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
        }}>
          {/* Zoom In (+) */}
          <button
            aria-label="Zoom in"
            tabIndex={3}
            style={{
              width: '44px',
              height: '44px',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
              fontSize: '20px',
              fontWeight: '500',
              color: '#111827'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            onClick={() => {
              if (mapRef.current) {
                const map = mapRef.current.getMap()
                if (map) {
                  map.zoomIn()
                }
              }
            }}
          >
            <span>+</span>
          </button>

          {/* Current Scale Display */}
          <div style={{
            width: '44px',
            padding: '8px 4px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.02)'
          }}>
            <span style={{
              fontSize: '9px',
              fontWeight: '500',
              color: '#374151',
              lineHeight: '1',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              {getScaleText(currentZoom, currentCoordinates?.lat)}
            </span>
          </div>

          {/* Zoom Out (–) */}
          <button
            aria-label="Zoom out"
            tabIndex={4}
            style={{
              width: '44px',
              height: '44px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
              fontSize: '20px',
              fontWeight: '500',
              color: '#111827'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            onClick={() => {
              if (mapRef.current) {
                const map = mapRef.current.getMap()
                if (map) {
                  map.zoomOut()
                }
              }
            }}
          >
            <span>−</span>
          </button>
        </div>

        {/* 2. Location/Navigation Combined (reset bearing + go to location) */}
        <button
          aria-label={locationLoading ? "Getting location..." : "Reset orientation and center on my location"}
          tabIndex={5}
          disabled={locationLoading}
          style={{
            width: '44px',
            height: '44px',
            background: (userLocation || locationLoading) ? '#3e4533' : 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            cursor: locationLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: locationLoading ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!locationLoading) {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.background = (userLocation || locationLoading) ? '#2d3327' : '#ffffff'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'
            }
          }}
          onMouseLeave={(e) => {
            if (!locationLoading) {
              e.currentTarget.style.transform = 'scale(1.0)'
              e.currentTarget.style.background = (userLocation || locationLoading) ? '#3e4533' : 'rgba(255, 255, 255, 0.9)'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)'
            }
          }}
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.resetBearing()
            }
            handleLocationClick()
          }}
        >
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '20px',
            color: (userLocation || locationLoading) ? 'white' : '#111827',
            transform: `rotate(${-mapBearing}deg)`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: locationLoading ? 'spin 1s linear infinite' : 'none'
          }}>
            {locationLoading ? 'sync' : 'navigation'}
          </span>
        </button>

        {/* 3. Distance Measurement */}
        <button
          aria-label={mapRef.current?.getMap() ? (isDistanceMeasuring ? "Finish distance measurement" : "Start distance measurement") : "Distance measurement"}
          tabIndex={6}
          style={{
            width: '44px',
            height: '44px',
            background: isDistanceMeasuring ? '#3e4533' : 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.background = isDistanceMeasuring ? '#2d3327' : '#ffffff'
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1.0)'
            e.currentTarget.style.background = isDistanceMeasuring ? '#3e4533' : 'rgba(255, 255, 255, 0.9)'
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)'
          }}
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.toggleDistanceMeasurement()
            }
          }}
        >
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '20px',
            color: isDistanceMeasuring ? 'white' : '#111827'
          }}>
            straighten
          </span>
        </button>

        {/* 4. Clear Distance Measurements */}
        {distanceMeasurements.length > 0 && (
          <button
            aria-label="Clear all distance measurements"
            tabIndex={7}
            style={{
              width: '44px',
              height: '44px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.background = '#ffffff'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1.0)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)'
            }}
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.clearDistanceMeasurements()
              }
            }}
          >
            <span style={{
              fontFamily: 'Material Symbols Outlined',
              fontSize: '20px',
              color: '#111827'
            }}>
              clear_all
            </span>
          </button>
        )}

        {/* 5. Info/Attribution Button */}
        <button
          aria-label="Map information and credits"
          tabIndex={8}
          style={{
            width: '44px',
            height: '44px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.background = '#ffffff'
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1.0)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)'
          }}
          onClick={() => setIsAttributionOpen(true)}
        >
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '20px',
            color: '#111827'
          }}>
            info
          </span>
        </button>

        </div>
      )}

      {/* Floating Eye Button - Visible when controls are hidden */}
      {!mapControlsVisible && (
        <button
          onClick={() => setMapControlsVisible(true)}
          aria-label="Show map controls"
          style={{
            position: 'absolute',
            bottom: '24px',
            right: (() => {
              if (window.innerWidth < 768) {
                // On mobile, always position at right edge regardless of sidebar state
                return '3px'
              }
              return '11px'
            })(),
            zIndex: 101,
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            fontSize: '12px',
            color: '#374151'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '16px'
          }}>
            visibility
          </span>
        </button>
      )}

      {/* Distance Measurement Mode Indicator */}
      {isDistanceMeasuring && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          backgroundColor: '#3e4533',
          color: 'white',
          padding: '4px 6px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          fontSize: '12px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.3s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '14px'
          }}>
            touch_app
          </span>
          <span>
            {window.innerWidth < 768 ? 'Trykk på kartet for å måle' : 'Klikk på kartet for å måle avstand'}
          </span>
        </div>
      )}

      {/* Coordinates Copied Confirmation */}
      {coordinatesCopied && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          backgroundColor: '#3e4533',
          color: 'white',
          padding: '4px 6px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          fontSize: '12px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.3s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '14px'
          }}>
            check_circle
          </span>
          <span>
            Koordinater kopiert!
          </span>
        </div>
      )}

      {/* Legacy compass container (keeping for styling but now empty) */}
      <div
        className="compass-container"
        style={{ display: 'none' }}
      >
        <button
          aria-label="Reset map orientation to north"
          tabIndex={7}
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '6px',
            border: 'none',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'}
          onMouseDown={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
          onMouseUp={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'}
          onClick={() => {
            // Reset map bearing to 0 (north up)
            if (mapRef.current) {
              mapRef.current.resetBearing()
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (mapRef.current) {
                mapRef.current.resetBearing()
              }
            }
          }}
        >
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '18px',
            color: '#555',
            display: 'inline-block',
            transform: `rotate(${-mapBearing}deg)`,
            transition: 'transform 0.3s ease'
          }}>
            navigation
          </span>
        </button>
      </div>

      
      </div>

      {/* Responsive and Accessibility Styles */}
      <style>{`
        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        /* Mobile Responsive Styles */
        @media (max-width: 767px) {

          .sidebar-toggle {
            width: 40px !important;
            height: 56px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
          }

          .coordinate-display {
            bottom: 24px !important;
            left: 12px !important;
          }
        }

        /* Focus indicators for accessibility - only show on keyboard focus */
        .sidebar-toggle:focus-visible,
        .map-controls button:focus-visible {
          outline: 2px solid #9ca3af !important;
          outline-offset: 2px !important;
        }

        /* Remove focus outline on mouse click but keep for keyboard navigation */
        .sidebar-toggle:focus:not(:focus-visible),
        .map-controls button:focus:not(:focus-visible) {
          outline: none !important;
        }

        /* Touch targets - minimum 44px for mobile */
        @media (max-width: 767px) {
          .map-controls button {
            min-width: 44px !important;
            min-height: 44px !important;
          }
          
          .sidebar-toggle {
            min-width: 44px !important;
            min-height: 56px !important;
          }
        }

        /* Performance optimizations */
        .map-controls,
        .compass-container,
        .sidebar-toggle,
        .credits-container {
          will-change: transform;
        }
      `}</style>

      {/* Modal components */}
      {/* Attribution Modal */}
      {isAttributionOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setIsAttributionOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: window.innerWidth < 768 ? '16px' : '28px',
              maxWidth: window.innerWidth < 768 ? '340px' : '500px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              maxHeight: window.innerWidth < 768 ? '85vh' : '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: window.innerWidth < 768 ? '12px' : '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                Datakilder
              </h2>
              <button
                onClick={() => setIsAttributionOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{
                  fontFamily: 'Material Symbols Outlined',
                  fontSize: '24px',
                  color: '#6b7280'
                }}>
                  close
                </span>
              </button>
            </div>

            <div style={{ fontSize: window.innerWidth < 768 ? '13px' : '14px', color: '#374151', lineHeight: window.innerWidth < 768 ? '1.5' : '1.6' }}>
              <p style={{ marginTop: 0 }}>
                <strong>Karttype:</strong> {mapType === 'topo' ? 'Topografisk kart' : 'Satellittkart'}
              </p>

              {mapType === 'topo' ? (
                <>
                  <p>
                    <strong>Kartdata fra Kartverket:</strong><br />
                    Topografiske kartdata leveres av Kartverket via WMTS-tjenesten.
                    Kartverket er Norges offisielle kartmyndighet.
                  </p>
                  <p>
                    <strong>© Kartverket</strong><br />
                    <a
                      href="https://www.kartverket.no"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#667154', textDecoration: 'underline' }}
                    >
                      www.kartverket.no
                    </a>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Satellittbilder fra Esri:</strong><br />
                    Satellittbildene leveres av Esri World Imagery og gir global dekning
                    med høy oppløsning. Bildene er sammensatt fra flere kommersielle og
                    offentlige kilder.
                  </p>
                  <p>
                    <strong>© Esri</strong><br />
                    <a
                      href="https://www.esri.com/en-us/arcgis/products/imagery/imagery-sources"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#667154', textDecoration: 'underline' }}
                    >
                      Esri World Imagery
                    </a>
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    <strong>Merk:</strong> Satellittbildene lastes fra servere i USA (arcgisonline.com).
                    Din IP-adresse vil bli sendt til Esri for å hente kartfliser, i henhold til
                    deres personvernregler.
                  </p>
                </>
              )}

              <p>
                <strong>Kategorier (POI-data) og kartlag:</strong><br />
                Leveres fra flere kilder:
              </p>
              <ul style={{ marginTop: window.innerWidth < 768 ? '6px' : '8px', marginBottom: window.innerWidth < 768 ? '8px' : '12px', paddingLeft: '20px', lineHeight: window.innerWidth < 768 ? '1.6' : '1.8' }}>
                <li>
                  <strong>Flere kategorier</strong> – Fra OpenStreetMap, et brukerstyrt og gratis kartprosjekt som samler geografiske data og gjør dem tilgjengelig for alle
                  <br />
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#667154', textDecoration: 'underline', fontSize: '13px' }}
                  >
                    © OpenStreetMap-bidragsytere
                  </a>
                </li>
                <li style={{ marginTop: window.innerWidth < 768 ? '6px' : '8px' }}>
                  <strong>Tilfluktsrom</strong> – Datasett i Geonorges kartkatalog
                  <br />
                  <a
                    href="https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#667154', textDecoration: 'underline', fontSize: '13px' }}
                  >
                    © Direktoratet for samfunnssikkerhet og beredskap
                  </a>
                </li>
                <li style={{ marginTop: window.innerWidth < 768 ? '6px' : '8px' }}>
                  <strong>Bussholdeplass og togstasjon</strong> – Fra Entur, Norges nasjonale register for kollektivtrafikk
                  <br />
                  <a
                    href="https://developer.entur.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#667154', textDecoration: 'underline', fontSize: '13px' }}
                  >
                    © Entur
                  </a>
                </li>
                <li style={{ marginTop: window.innerWidth < 768 ? '6px' : '8px' }}>
                  <strong>Naturskog</strong> – Datasett i Geonorges kartkatalog
                  <br />
                  <a
                    href="https://kartkatalog.geonorge.no/metadata/naturskog-v1/a0062ac4-8ee0-408f-9373-4c8b8c3088d8"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#667154', textDecoration: 'underline', fontSize: '13px' }}
                  >
                    © Miljødirektoratet
                  </a>
                </li>
                <li style={{ marginTop: window.innerWidth < 768 ? '6px' : '8px' }}>
                  <strong>Turløype</strong> – Datasett (turrutebasen) i Geonorges kartkatalog
                  <br />
                  <a
                    href="https://kartkatalog.geonorge.no/metadata/turrutebasen/d1422d17-6d95-4ef1-96ab-8af31744dd63?search=turrut"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#667154', textDecoration: 'underline', fontSize: '13px' }}
                  >
                    © Kartverket
                  </a>
                </li>
              </ul>


              <div style={{
                marginTop: window.innerWidth < 768 ? '12px' : '20px',
                padding: window.innerWidth < 768 ? '8px' : '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  <strong>I henhold til </strong>
                <a
                  href="https://data.norge.no/nlod/no/2.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#667154', textDecoration: 'underline' }}
                >
                  Norsk lisens for offentlige data (NLOD)
                </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <HurtigtasterModal
        isOpen={isHurtigtasterOpen}
        onClose={closeHurtigtaster}
      />

      <TegnforklaringModal
        isOpen={isTegnforklaringOpen}
        onClose={closeTegnforklaring}
      />

      {/* PWA Install Prompt Modal */}
      {showInstallPrompt && (
        <InstallPromptModal
          onClose={handleInstallPromptClose}
        />
      )}

      {/* Trail Details Modal */}
      {showTrailDetails && (
        <TrailDetails
          trail={selectedTrail}
          onClose={handleCloseTrailDetails}
        />
      )}

      {/* Admin Modal components */}
      <AdminLoginModal />
      <AdminPanel
        onCategoryToggle={handleCategoryToggle}
        categoryState={categoryState}
        onPOIAdded={handlePOIAdded}
      />
    </>
  )
}

// Main component wrapped with UI Provider
export function MapLibreTrakkeApp() {
  return (
    <UIProvider>
      <MapLibreTrakkeAppInner />
    </UIProvider>
  )
}
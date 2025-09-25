import React, { useState, useCallback, useRef, useEffect } from 'react'
import { MapLibreMap, MapLibreMapRef } from './components/MapLibreMap'
import { CategoryPanel } from './components/CategoryPanel'
import { SearchBox, SearchBoxRef } from './components/SearchBox'
import { categoryTree, CategoryState, POI, POIType } from './data/pois'
import { OverpassService, OverpassPOI } from './services/overpassService'
import { KartverketTrailService } from './services/kartverketTrailService'
import { SearchResult, SearchService } from './services/searchService'
import { poiDataService } from './services/poiDataService'
import { TilfluktsromService, TilfluktsromPOI } from './services/tilfluktsromService'
import { krigsminneEnhancementService } from './services/krigsminneEnhancementService'
import { DistanceMeasurement } from './services/distanceService'
import { useUIStore } from './state/uiStore'
import { UIProvider } from './state/UIProvider'
import { HurtigtasterModal } from './features/shortcuts/HurtigtasterModal'
import { TegnforklaringModal } from './features/legend/TegnforklaringModal'
import { AdminLoginModal } from './components/modal/AdminLoginModal'
import { AdminPanel } from './components/modal/AdminPanel'
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

  // Distance measurement state
  const [distanceMeasurements, setDistanceMeasurements] = useState<DistanceMeasurement[]>([])
  const [isDistanceMeasuring, setIsDistanceMeasuring] = useState(false)

  // POI data state (currently only Krigsminne from OpenStreetMap)
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ref for search input to enable keyboard shortcut focus
  const searchInputRef = useRef<SearchBoxRef>(null)
  const _searchService = useRef(new SearchService())
  const _tilfluktsromService = useRef(new TilfluktsromService())
  const mapRef = useRef<MapLibreMapRef>(null)

  console.log(`🎯 MapLibre App: ${pois.length} POIs loaded`)


  // Handle search result selection
  const handleSearchResultClick = useCallback((result: SearchResult) => {
    // Clear any previous search result first
    setSearchResult(null)
    // Set new search result after a brief delay to ensure cleanup
    setTimeout(() => {
      setSearchResult(result)
      console.log('📍 Navigerer til:', result.displayName)
    }, 50)
  }, [])

  // Handle location button click
  const handleLocationClick = useCallback(() => {
    console.log('🔘 Position button clicked!')
    console.log('🔘 Current userLocation state:', userLocation)
    console.log('🔘 Current locationLoading state:', locationLoading)

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser')
      return
    }

    setLocationLoading(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log('📍 User location obtained:', latitude, longitude)
        console.log('📍 Setting userLocation state...')

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
          console.log('✅ Location set within Norway bounds:', { lat: latitude, lng: longitude })
        } else {
          console.warn('⚠️ Location outside Norway bounds, but setting regardless')
          setUserLocation({ lat: latitude, lng: longitude })
          console.log('✅ Location set outside Norway bounds:', { lat: latitude, lng: longitude })
        }

        setLocationLoading(false)
        console.log('📍 Location loading set to false')
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
          if (parentNode && parentNode.children) {
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
      
      console.log(`🔄 Category toggle:`, { nodeId, isChecked, newChecked })

      // Handle category selection changes
      setTimeout(async () => {
        const activeCategories = getActiveCategories(newState)
        console.log(`🏷️ Categories changed. Active categories: ${activeCategories.join(', ')}`)
        
        if (activeCategories.length === 0) {
          setPois([])
          console.log(`🏷️ No categories selected, cleared POIs`)
          return
        }
        
        // Load POI data only if we have viewport (prevents loading during initial render)
        if (currentViewport) {
          console.log('📍 Current viewport:', currentViewport)
          setLoading(true)
          setError(null)
          
          try {
            let allPOIs: POI[] = []
            
            // Load Krigsminne from OpenStreetMap if krigsminne category is active
            if (activeCategories.includes('krigsminne')) {
              console.log('🏰 Loading enhanced Krigsminne from OpenStreetMap with viewport:', currentViewport)
              const overpassPOIs = await OverpassService.fetchKrigsminnePOIs(currentViewport)
              console.log('📊 Raw Overpass POIs received:', overpassPOIs.length, overpassPOIs)

              const transformedOverpassPOIs = await transformOverpassPOIs(overpassPOIs)
              allPOIs = [...allPOIs, ...transformedOverpassPOIs]

              console.log(`🏰 Loaded ${transformedOverpassPOIs.length} enhanced Krigsminne POIs from OpenStreetMap`)
            }
            
            // Load cave entrances from OpenStreetMap if hule category is active
            if (activeCategories.includes('hule')) {
              console.log('🕳️ Loading cave entrances from OpenStreetMap with viewport:', currentViewport)
              const cavePOIs = await OverpassService.fetchCaveEntrancePOIs(currentViewport)
              console.log('📊 Raw Cave POIs received:', cavePOIs.length, cavePOIs)
              
              const transformedCavePOIs = transformCavePOIs(cavePOIs)
              allPOIs = [...allPOIs, ...transformedCavePOIs]
              
              console.log(`🕳️ Loaded ${transformedCavePOIs.length} cave entrance POIs from OpenStreetMap`)
            }
            
            // Load observation towers from OpenStreetMap if observasjonstårn category is active
            if (activeCategories.includes('observasjonstårn')) {
              console.log('🗼 Loading observation towers from OpenStreetMap with viewport:', currentViewport)
              const towerPOIs = await OverpassService.fetchObservationTowerPOIs(currentViewport)
              console.log('📊 Raw Tower POIs received:', towerPOIs.length, towerPOIs)
              
              const transformedTowerPOIs = transformTowerPOIs(towerPOIs)
              allPOIs = [...allPOIs, ...transformedTowerPOIs]
              
              console.log(`🗼 Loaded ${transformedTowerPOIs.length} observation tower POIs from OpenStreetMap`)

              // Also load hunting stands for observasjonstårn category
              console.log('🦌 Loading hunting stands from OpenStreetMap with viewport:', currentViewport)
              const huntingStandPOIs = await OverpassService.fetchHuntingStandPOIs(currentViewport)
              console.log('📊 Raw Hunting Stand POIs received:', huntingStandPOIs.length, huntingStandPOIs)
              
              const transformedHuntingStandPOIs = transformHuntingStandPOIs(huntingStandPOIs)
              allPOIs = [...allPOIs, ...transformedHuntingStandPOIs]
              
              console.log(`🦌 Loaded ${transformedHuntingStandPOIs.length} hunting stand POIs from OpenStreetMap`)
            }

            // Load fire pits from OpenStreetMap if bålplass category is active
            if (activeCategories.includes('bålplass')) {
              console.log('🔥 Loading fire pits from OpenStreetMap with viewport:', currentViewport)
              const firepitPOIs = await OverpassService.fetchFirepitPOIs(currentViewport)
              console.log('📊 Raw Firepit POIs received:', firepitPOIs.length, firepitPOIs)
              
              const transformedFirepitPOIs = transformFirepitPOIs(firepitPOIs)
              allPOIs = [...allPOIs, ...transformedFirepitPOIs]
              
              console.log(`🔥 Loaded ${transformedFirepitPOIs.length} fire pit POIs from OpenStreetMap`)
            }

            // Load shelters from OpenStreetMap if gapahuk_vindskjul category is active
            if (activeCategories.includes('gapahuk_vindskjul')) {
              console.log('🏠 Loading shelters from OpenStreetMap with viewport:', currentViewport)
              const shelterPOIs = await OverpassService.fetchShelterPOIs(currentViewport)
              console.log('📊 Raw Shelter POIs received:', shelterPOIs.length, shelterPOIs)

              const transformedShelterPOIs = transformShelterPOIs(shelterPOIs)
              allPOIs = [...allPOIs, ...transformedShelterPOIs]

              console.log(`🏠 Loaded ${transformedShelterPOIs.length} shelter POIs from OpenStreetMap`)
            }

            // Load tilfluktsrom from Geonorge WFS if tilfluktsrom category is active
            if (activeCategories.includes('tilfluktsrom')) {
              console.log('🛡️ Loading tilfluktsrom from Geonorge WFS with viewport:', currentViewport)
              try {
                const tilfluktsromPOIs = await _tilfluktsromService.current.fetchTilfluktsrom(currentViewport)
                console.log('📊 Raw Tilfluktsrom POIs received:', tilfluktsromPOIs.length, tilfluktsromPOIs)

                const transformedTilfluktsromPOIs = transformTilfluktsromPOIs(tilfluktsromPOIs)
                allPOIs = [...allPOIs, ...transformedTilfluktsromPOIs]

                console.log(`🛡️ Loaded ${transformedTilfluktsromPOIs.length} tilfluktsrom POIs from Geonorge WFS`)
              } catch (tilfluktsromError) {
                console.error('❌ Error loading tilfluktsrom data:', tilfluktsromError)
                setError(`Feil ved lasting av tilfluktsrom: ${tilfluktsromError instanceof Error ? tilfluktsromError.message : 'Ukjent feil'}`)
              }
            }

            // Load hiking trails from Kartverket if turløype category is active
            if (activeCategories.includes('turløype')) {
              console.log('🥾 Loading Norwegian hiking trails from Kartverket with viewport:', currentViewport)
              
              // Check if Kartverket trail service is available
              const serviceAvailable = await KartverketTrailService.checkServiceAvailability()
              if (serviceAvailable) {
                console.log('✅ Kartverket trail service is available')
                // Note: Currently showing trails via WMS layer instead of individual POIs
                // This provides comprehensive trail coverage across Norway
                console.log('📍 Norwegian hiking trails will be displayed as map overlay')
                console.log('🗺️ Trail data source:', KartverketTrailService.getDataSourceInfo().name)
              } else {
                console.warn('⚠️ Kartverket trail service unavailable - check network connection')
              }
            }

            // Load custom POIs from local storage for all active categories
            console.log('🏛️ Loading custom POIs for active categories:', activeCategories)
            const customPOIs = await poiDataService.getPOIsByCategories(activeCategories)
            if (customPOIs.length > 0) {
              console.log(`📊 Loaded ${customPOIs.length} custom POIs:`, customPOIs)
              allPOIs = [...allPOIs, ...(customPOIs as POI[])]
            } else {
              console.log('📭 No custom POIs found for active categories')
            }

            if (allPOIs.length === 0) {
              console.log('⚠️ No active categories with POI data:', activeCategories)
            }
            
            console.log('🎯 Setting POIs on map:', allPOIs)
            setPois(allPOIs)
            console.log(`🏷️ Loaded ${allPOIs.length} total POIs for active categories: ${activeCategories.join(', ')}`)
          } catch (err) {
            console.error('❌ Error loading POIs:', err)
            setError('Kunne ikke laste POI-data')
            setPois([])
          } finally {
            setLoading(false)
          }
        } else {
          console.log('⚠️ No viewport available, skipping POI loading')
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
    console.log('🔄 POI added, refreshing data...')
    // Trigger category toggle to reload POIs for active categories
    const activeCategories = getActiveCategories(categoryState)
    if (activeCategories.length > 0 && currentViewport) {
      // Simulate a category state change to trigger POI reload
      setCategoryState(prev => ({ ...prev }))
    }
  }, [categoryState, currentViewport])

  // Function to handle map type changes
  const handleMapTypeChange = useCallback((newMapType: 'topo' | 'satellite') => {
    console.log(`🗺️ Changing map type from ${mapType} to ${newMapType}`)
    setMapType(newMapType)
  }, [mapType])

  const handleViewportChange = useCallback((viewport: { north: number; south: number; east: number; west: number; zoom: number }) => {
    setCurrentViewport(viewport)
    console.log('🗺️ Viewport changed:', viewport)
    
    // Only reload POIs for significant viewport changes (not during zoom animations)
    // The category toggle handler will load POIs when categories change
    // This prevents the flickering during zoom by avoiding redundant POI loading
  }, [])

  const handleBearingChange = useCallback((bearing: number) => {
    setMapBearing(bearing)
  }, [])

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
    console.log('🎨 Enhancing POIs with historical data and media...')

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
            console.log(`✨ Enhanced ${poi.name} with rich data`)
          }
        } catch (enhancementError) {
          console.warn(`⚠️ Could not enhance ${poi.name}:`, enhancementError)
        }

        return basePOI
      })
    )

    console.log('🔄 Transformed enhanced POIs:', transformedPOIs.map(p =>
      `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}${p.enhancedData ? ' (ENHANCED)' : ''}`
    ))
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
    
    console.log('🔄 Transformed Cave POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
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
    
    console.log('🔄 Transformed Tower POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
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
    
    console.log('🔄 Transformed Hunting Stand POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
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
        color: '#0d9488' // Use "Aktivitet" category color (teal)
      }
    })
    
    console.log('🔄 Transformed Firepit POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
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
    
    console.log('🔄 Transformed Shelter POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
    return transformedPOIs
  }

  // Transform tilfluktsrom POIs to our POI interface
  const transformTilfluktsromPOIs = (tilfluktsromPOIs: TilfluktsromPOI[]): POI[] => {
    const transformedPOIs = tilfluktsromPOIs.map(poi => ({
      id: poi.id,
      name: ensureUTF8(poi.name),
      description: ensureUTF8(poi.tags.description || 'Offentlig tilfluktsrom'),
      type: 'emergency_shelters' as POIType,
      lat: poi.lat,
      lng: poi.lng,
      color: '#ea580c' // Use "Service" category color (orange)
    }))

    console.log('🔄 Transformed Tilfluktsrom POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
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
          searchResult={searchResult}
          userLocation={userLocation}
          sidebarCollapsed={sidebarCollapsed}
          mapType={mapType}
          distanceMeasurements={distanceMeasurements}
          onDistanceMeasurementUpdate={setDistanceMeasurements}
          isDistanceMeasuring={isDistanceMeasuring}
          onDistanceMeasuringChange={setIsDistanceMeasuring}
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
                margin: '0',
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

            {/* Categories */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '0 20px 0px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ flex: 1, paddingBottom: '20px' }}>
                <CategoryPanel
                  categoryTree={categoryTree}
                  categoryState={categoryState}
                  onCategoryToggle={handleCategoryToggle}
                  onExpandToggle={handleExpandToggle}
                  pois={pois}
                  loading={loading}
                  error={error}
                  mapType={mapType}
                  onMapTypeChange={handleMapTypeChange}
                />
              </div>
              
              {/* Last updated text at bottom */}
              <div style={{
                padding: '16px 20px 20px',
                textAlign: 'center',
                borderTop: '1px solid rgba(241, 245, 249, 0.6)',
                marginTop: 'auto',
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
                  Under utvikling • Sist oppdatert 18. sept 2025
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
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '0 8px 8px 0',
          border: 'none',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(8px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 1.0)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'}
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

      {/* Unified Map Controls - Right Side (Order: Compass, Location, Zoom In, Zoom Out) */}
      <div className="map-controls" style={{
        position: 'absolute',
        bottom: '52px', // 16px (attribution bottom) + 24px (attribution height) + 12px (gap) = 52px
        right: '24px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px' // Equal 12px spacing between buttons as specified
      }}>
        {/* 1. Compass (reset map to north) */}
        <button
          aria-label="Reset map orientation to north"
          tabIndex={3}
          style={{
            width: '44px', // 44x44px as specified
            height: '44px',
            background: 'rgba(255, 255, 255, 0.9)', // Specified background
            borderRadius: '8px', // Specified border-radius
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)', // Specified shadow
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)' // Specified hover effect
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
              mapRef.current.resetBearing()
            }
          }}
        >
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '20px',
            color: '#111827', // Specified icon color
            transform: `rotate(${-mapBearing}deg)`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            navigation
          </span>
        </button>

        {/* 2. Location (center on user's position) */}
        <button
          aria-label={locationLoading ? "Getting location..." : "Center map on my location"}
          tabIndex={4}
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
          onClick={handleLocationClick}
        >
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '20px',
            color: (userLocation || locationLoading) ? 'white' : '#111827',
            animation: locationLoading ? 'spin 1s linear infinite' : 'none'
          }}>
            {locationLoading ? 'sync' : 'my_location'}
          </span>
        </button>

        {/* 3. Zoom In (+) */}
        <button
          aria-label="Zoom in"
          tabIndex={5}
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
            transition: 'all 0.2s ease',
            fontSize: '20px',
            fontWeight: '500',
            color: '#111827'
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
              const map = mapRef.current.getMap()
              if (map) {
                map.zoomIn()
              }
            }
          }}
        >
          +
        </button>

        {/* 4. Zoom Out (–) */}
        <button
          aria-label="Zoom out"
          tabIndex={6}
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
            transition: 'all 0.2s ease',
            fontSize: '20px',
            fontWeight: '500',
            color: '#111827'
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
              const map = mapRef.current.getMap()
              if (map) {
                map.zoomOut()
              }
            }
          }}
        >
          −
        </button>

        {/* 5. Distance Measurement */}
        <button
          aria-label={mapRef.current?.getMap() ? (isDistanceMeasuring ? "Finish distance measurement" : "Start distance measurement") : "Distance measurement"}
          tabIndex={7}
          style={{
            width: '44px',
            height: '44px',
            background: isDistanceMeasuring ? '#0d9488' : 'rgba(255, 255, 255, 0.9)',
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
            e.currentTarget.style.background = isDistanceMeasuring ? '#0a756e' : '#ffffff'
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1.0)'
            e.currentTarget.style.background = isDistanceMeasuring ? '#0d9488' : 'rgba(255, 255, 255, 0.9)'
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

        {/* 6. Clear Distance Measurements */}
        {distanceMeasurements.length > 0 && (
          <button
            aria-label="Clear all distance measurements"
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

      </div>

      {/* Persistent Attribution Credits - Bottom Right */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 50,
          fontSize: '12px',
          color: '#6b7280', // Specified color
          pointerEvents: 'none' // Credits should not be interactive
        }}
      >
        {mapType === 'topo'
          ? '© Kartverket | © OpenStreetMap-bidragsytere'
          : '© Esri | © OpenStreetMap-bidragsytere'
        }
      </div>


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
        /* Mobile Responsive Styles */
        @media (max-width: 767px) {
          .map-controls {
            right: 16px !important;
          }

          .sidebar-toggle {
            width: 40px !important;
            height: 56px !important;
          }

          .coordinate-display {
            bottom: 12px !important;
            font-size: 11px !important;
            padding: 6px 12px !important;
            left: 12px !important;
          }
        }

        /* Focus indicators for accessibility - clean grey styling */
        
        .sidebar-toggle:focus,
        .map-controls button:focus {
          outline: 2px solid #9ca3af !important;
          outline-offset: 2px !important;
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
      <HurtigtasterModal
        isOpen={isHurtigtasterOpen}
        onClose={closeHurtigtaster}
      />

      <TegnforklaringModal
        isOpen={isTegnforklaringOpen}
        onClose={closeTegnforklaring}
      />

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
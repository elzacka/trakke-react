import React, { useState, useCallback, useRef, useEffect } from 'react'
import { MapLibreMap } from './components/MapLibreMap'
import { CategoryPanel } from './components/CategoryPanel'
import { SearchBox, SearchBoxRef } from './components/SearchBox/SearchBox'
import { categoryTree, CategoryState, POI, POIType } from './data/pois'
import { OverpassService, OverpassPOI } from './services/overpassService'
import { KartverketTrailService } from './services/kartverketTrailService'
import { SearchResult } from './services/searchService'

export function MapLibreTrakkeApp() {
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
  const [currentViewport, setCurrentViewport] = useState<{ north: number; south: number; east: number; west: number; zoom: number } | null>(null)

  // POI data state (currently only Krigsminne from OpenStreetMap)
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ref for SearchBox to enable keyboard shortcut focus
  const searchBoxRef = useRef<SearchBoxRef>(null)

  console.log(`🎯 MapLibre App: ${pois.length} POIs loaded`)

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  // Enhanced keyboard shortcuts for navigation and search
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K / ⌘+K: Open sidebar and focus search (or just focus if already open)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        event.stopPropagation()
        
        if (sidebarCollapsed) {
          // Sidebar is collapsed, open it first then focus search
          setSidebarCollapsed(false)
          setTimeout(() => {
            searchBoxRef.current?.focusInput()
          }, 300) // Wait for sidebar animation
        } else {
          // Sidebar is open, just focus search
          searchBoxRef.current?.focusInput()
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
              console.log('🏰 Loading Krigsminne from OpenStreetMap with viewport:', currentViewport)
              const overpassPOIs = await OverpassService.fetchKrigsminnePOIs(currentViewport)
              console.log('📊 Raw Overpass POIs received:', overpassPOIs.length, overpassPOIs)
              
              const transformedOverpassPOIs = transformOverpassPOIs(overpassPOIs)
              allPOIs = [...allPOIs, ...transformedOverpassPOIs]
              
              console.log(`🏰 Loaded ${transformedOverpassPOIs.length} Krigsminne POIs from OpenStreetMap`)
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
  }, [currentViewport, setPois])

  const handleExpandToggle = useCallback((nodeId: string) => {
    setCategoryState(prev => ({
      ...prev,
      expanded: {
        ...prev.expanded,
        [nodeId]: !prev.expanded[nodeId]
      }
    }))
  }, [])

  const handleLocationSelect = useCallback((result: SearchResult) => {
    setSearchResult(result)
    console.log('🔍 Search result selected:', result)
    // The MapLibre component will handle centering when searchResult changes
  }, [])

  const handleViewportChange = useCallback((viewport: { north: number; south: number; east: number; west: number; zoom: number }) => {
    setCurrentViewport(viewport)
    console.log('🗺️ Viewport changed:', viewport)
    
    // Only reload POIs for significant viewport changes (not during zoom animations)
    // The category toggle handler will load POIs when categories change
    // This prevents the flickering during zoom by avoiding redundant POI loading
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
        }
      }
      if (node.children) {
        node.children.forEach(checkNode)
      }
    }
    
    categoryTree.forEach(checkNode)
    return activeCategories
  }


  // Transform Overpass POIs to our POI interface
  const transformOverpassPOIs = (overpassPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = overpassPOIs.map(poi => ({
      id: poi.id,
      name: poi.name,
      description: poi.tags.description || `${poi.type} - Historisk eller militært anlegg`,
      type: 'war_memorials' as POIType, // All Overpass POIs are categorized as war memorials
      lat: poi.lat,
      lng: poi.lng
    }))
    
    console.log('🔄 Transformed POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
    return transformedPOIs
  }

  // Transform Cave entrance POIs to our POI interface
  const transformCavePOIs = (cavePOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = cavePOIs.map(poi => ({
      id: poi.id,
      name: poi.name,
      description: poi.tags.description || `${poi.type} - Naturlig huleinngang`,
      type: 'nature_gems' as POIType, // All cave POIs are categorized as nature gems
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
      name: poi.name,
      description: poi.tags.description || `${poi.type} - Observasjonstårn eller vakttårn`,
      type: 'viewpoints' as POIType, // All tower POIs are categorized as viewpoints
      lat: poi.lat,
      lng: poi.lng
    }))
    
    console.log('🔄 Transformed Tower POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
    return transformedPOIs
  }

  // Transform hunting stand POIs to our POI interface
  const transformHuntingStandPOIs = (huntingStandPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = huntingStandPOIs.map(poi => ({
      id: poi.id,
      name: poi.name,
      description: poi.tags.description || `${poi.type} - Jakttårn eller observasjonsplass`,
      type: 'viewpoints' as POIType, // Hunting stands are categorized as viewpoints
      lat: poi.lat,
      lng: poi.lng
    }))
    
    console.log('🔄 Transformed Hunting Stand POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
    return transformedPOIs
  }

  // Transform firepit POIs to our POI interface
  const transformFirepitPOIs = (firepitPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = firepitPOIs.map(poi => ({
      id: poi.id,
      name: poi.name,
      description: poi.tags.description || `${poi.type} - Bålplass eller grillplass`,
      type: 'fire_places' as POIType, // Fire pits are categorized as fire places
      lat: poi.lat,
      lng: poi.lng
    }))
    
    console.log('🔄 Transformed Firepit POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
    return transformedPOIs
  }

  // Transform shelter POIs to our POI interface
  const transformShelterPOIs = (shelterPOIs: OverpassPOI[]): POI[] => {
    const transformedPOIs = shelterPOIs.map(poi => ({
      id: poi.id,
      name: poi.name,
      description: poi.tags.description || `${poi.type} - Gapahuk, vindskjul eller skjerming`,
      type: 'wilderness_shelter' as POIType, // Shelters are categorized as wilderness shelter
      lat: poi.lat,
      lng: poi.lng
    }))
    
    console.log('🔄 Transformed Shelter POIs:', transformedPOIs.map(p => `${p.name} at [${p.lat}, ${p.lng}] - ${p.description}`))
    return transformedPOIs
  }

  return (
    <div className="app" style={{ 
      display: 'flex', 
      height: '100vh', 
      fontFamily: 'Exo 2, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '0px' : '320px',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {!sidebarCollapsed && (
          <>
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff'
            }}>
              <h1 style={{
                margin: '0 0 8px 0',
                fontSize: '22px',
                fontWeight: '500',
                color: '#3e4533',
                fontFamily: 'Exo 2, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ 
                  fontFamily: 'Material Symbols Outlined', 
                  fontSize: '24px',
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
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Oppdag Norge med turskoa på
              </p>
            </div>

            {/* Search */}
            <div style={{ padding: '16px' }}>
              <SearchBox ref={searchBoxRef} onLocationSelect={handleLocationSelect} pois={pois} />
            </div>

            {/* Categories */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '0 16px 0px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ flex: 1, paddingBottom: '16px' }}>
                <CategoryPanel
                  categoryTree={categoryTree}
                  categoryState={categoryState}
                  onCategoryToggle={handleCategoryToggle}
                  onExpandToggle={handleExpandToggle}
                  pois={pois}
                  loading={loading}
                  error={error}
                />
              </div>
              
              {/* Last updated text at bottom */}
              <div style={{
                padding: '8px 16px 16px',
                textAlign: 'left',
                borderTop: '1px solid #f1f5f9',
                marginTop: 'auto'
              }}>
                <p style={{
                  margin: '0',
                  fontSize: '10px',
                  color: '#94a3b8',
                  fontStyle: 'italic'
                }}>
                  Under utvikling. Sist oppdatert: 7. september 2025.
                </p>
              </div>
            </div>
          </>
        )}
        
      </div>
      
      {/* Chevron toggle button - always visible, positioned at edge */}
      <button
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          top: '50%',
          left: sidebarCollapsed ? '0px' : '320px',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          backgroundColor: '#ffffff',
          border: '1px solid #d1d5db',
          borderRadius: sidebarCollapsed ? '0 6px 6px 0' : '6px 0 0 6px',
          width: '24px',
          height: '48px',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.3s ease'
        }}
      >
        <span style={{ 
          fontFamily: 'Material Symbols Outlined', 
          fontSize: '16px',
          color: '#374151'
        }}>
          {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* Main content */}
      <div style={{ flex: 1, position: 'relative' }}>

        {/* MapLibre Map */}
        <MapLibreMap
          pois={pois}
          categoryState={categoryState}
          categoryTree={categoryTree}
          onCategoryToggle={handleCategoryToggle}
          onExpandToggle={handleExpandToggle}
          onViewportChange={handleViewportChange}
          searchResult={searchResult}
        />
      </div>
    </div>
  )
}
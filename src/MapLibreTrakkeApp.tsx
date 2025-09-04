import React, { useState, useCallback } from 'react'
import { MapLibreMap } from './components/MapLibreMap'
import { CategoryPanel } from './components/CategoryPanel'
import { SearchBox } from './components/SearchBox'
import { categoryTree, CategoryState, POI } from './data/pois'
import { KartverketPOIService, KartverketPOI } from './services/kartverketPOIService'
import { OverpassService, OverpassPOI } from './services/overpassService'
import { SearchResult } from './services/searchService'

export function MapLibreTrakkeApp() {
  // Category state - starts with all categories unchecked as requested
  const [categoryState, setCategoryState] = useState<CategoryState>({
    checked: {
      // All POIs unchecked and not visible by default on app load
    },
    expanded: {
      // Start collapsed, user can expand as needed
    }
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Hidden by default
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [currentViewport, setCurrentViewport] = useState<{ north: number; south: number; east: number; west: number; zoom: number } | null>(null)

  // POI data state (Norwegian outdoor recreation)
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log(`🎯 MapLibre App: ${pois.length} POIs loaded`)

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
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

      // Handle category selection changes with Kartverket API
      setTimeout(async () => {
        const activeCategories = getActiveCategories(newState)
        console.log(`🏷️ Categories changed. Active categories: ${activeCategories.join(', ')}`)
        
        // Load POI data from multiple sources for selected categories if we have viewport
        if (currentViewport && activeCategories.length > 0) {
          setLoading(true)
          setError(null)
          
          try {
            // Load POIs from Kartverket (general outdoor recreation POIs)
            const kartverketPOIs = await KartverketPOIService.fetchPOIs(currentViewport, activeCategories)
            const transformedKartverketPOIs = transformKartverketPOIs(kartverketPOIs)
            
            let allPOIs = [...transformedKartverketPOIs]
            
            // Also load Kriegsminner from OpenStreetMap if war_memorials category is active
            if (activeCategories.includes('war_memorials')) {
              console.log('🏰 Loading Kriegsminner from OpenStreetMap...')
              const overpassPOIs = await OverpassService.fetchKrigsminnerPOIs(currentViewport)
              const transformedOverpassPOIs = transformOverpassPOIs(overpassPOIs)
              allPOIs = [...allPOIs, ...transformedOverpassPOIs]
              console.log(`🏰 Added ${transformedOverpassPOIs.length} Kriegsminner POIs from OpenStreetMap`)
            }
            
            setPois(allPOIs)
            console.log(`🏷️ Loaded ${allPOIs.length} total POIs for categories: ${activeCategories.join(', ')}`)
          } catch (err) {
            console.error('❌ Error loading POIs:', err)
            setError('Kunne ikke laste POI-data')
            setPois([])
          } finally {
            setLoading(false)
          }
        } else if (activeCategories.length === 0) {
          setPois([])
          console.log(`🏷️ No categories selected, cleared POIs`)
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

  const handleViewportChange = useCallback(async (viewport: { north: number; south: number; east: number; west: number; zoom: number }) => {
    setCurrentViewport(viewport)
    console.log('🗺️ Viewport changed:', viewport)
    
    // Load POI data from Kartverket for active categories
    const activeCategories = getActiveCategories(categoryState)
    if (activeCategories.length > 0) {
      setLoading(true)
      setError(null)
      
      try {
        // Load POIs from Kartverket (general outdoor recreation POIs)
        const kartverketPOIs = await KartverketPOIService.fetchPOIs(viewport, activeCategories)
        const transformedKartverketPOIs = transformKartverketPOIs(kartverketPOIs)
        
        let allPOIs = [...transformedKartverketPOIs]
        
        // Also load Kriegsminner from OpenStreetMap if war_memorials category is active
        if (activeCategories.includes('war_memorials')) {
          console.log('🏰 Loading Kriegsminner from OpenStreetMap for viewport...')
          const overpassPOIs = await OverpassService.fetchKrigsminnerPOIs(viewport)
          const transformedOverpassPOIs = transformOverpassPOIs(overpassPOIs)
          allPOIs = [...allPOIs, ...transformedOverpassPOIs]
          console.log(`🏰 Added ${transformedOverpassPOIs.length} Kriegsminner POIs from OpenStreetMap`)
        }
        
        setPois(allPOIs)
        console.log(`🏷️ Loaded ${allPOIs.length} total POIs for viewport`)
      } catch (err) {
        console.error('❌ Error loading POIs:', err)
        setError('Kunne ikke laste POI-data')
        setPois([])
      } finally {
        setLoading(false)
      }
    } else {
      setPois([])
    }
  }, [categoryState])

  // Helper function to get active category IDs from category state
  const getActiveCategories = (state: CategoryState): string[] => {
    const activeCategories: string[] = []
    
    function checkNode(node: typeof categoryTree[0]) {
      if (state.checked[node.id]) {
        // Map UI category IDs to Kartverket categories
        const kartverketCategory = mapUItoKartverketCategory(node.id)
        if (kartverketCategory && !activeCategories.includes(kartverketCategory)) {
          activeCategories.push(kartverketCategory)
        }
      }
      if (node.children) {
        node.children.forEach(checkNode)
      }
    }
    
    categoryTree.forEach(checkNode)
    // Only return actual categories, not 'all' - POIs should only show when explicitly checked
    return activeCategories
  }

  // Map UI category IDs to Kartverket categories
  const mapUItoKartverketCategory = (uiCategoryId: string): string | null => {
    const mapping: Record<string, string> = {
      // Main categories
      'outdoor_activities': 'turløyper',
      'water_activities': 'bade', 
      'accommodation': 'sove',
      'nature_experiences': 'naturperler',
      'services_infrastructure': 'service',
      // Sub-categories
      'turløyper': 'turløyper',
      'hiking': 'turløyper', 
      'mountain_peaks': 'turløyper',
      'ski_trails': 'turløyper',
      'sove': 'sove',
      'staffed_huts': 'sove',
      'self_service_huts': 'sove',
      'camping_site': 'sove',
      'tent_area': 'sove',
      'wilderness_shelter': 'sove',
      'wild_camping': 'sove',
      'hammock_spots': 'sove',
      'bade': 'bade',
      'swimming': 'bade',
      'beach': 'bade',
      'naturperler': 'naturperler',
      'viewpoints': 'naturperler',
      'nature_gems': 'naturperler',
      'service': 'service',
      'parking': 'service',
      'rest_areas': 'service',
      'toilets': 'service',
      'drinking_water': 'service',
      'fire_places': 'service',
      'information_boards': 'service'
    }
    console.log(`🗂️ Mapping UI category '${uiCategoryId}' to Kartverket category '${mapping[uiCategoryId] || 'null'}'`)
    return mapping[uiCategoryId] || null
  }

  // Transform Kartverket POIs to our POI interface
  const transformKartverketPOIs = (kartverketPOIs: KartverketPOI[]): POI[] => {
    return kartverketPOIs.map(poi => ({
      id: poi.id,
      name: poi.name,
      description: `${poi.type}${poi.maintenance ? ` - ${poi.maintenance}` : ''}`,
      type: poi.category,
      lat: poi.lat,
      lng: poi.lng
    }))
  }

  // Transform Overpass POIs to our POI interface
  const transformOverpassPOIs = (overpassPOIs: OverpassPOI[]): POI[] => {
    return overpassPOIs.map(poi => ({
      id: poi.id,
      name: poi.name,
      description: poi.tags.description || `${poi.type} - Historisk eller militært anlegg`,
      type: 'war_memorials', // All Overpass POIs are categorized as war memorials
      lat: poi.lat,
      lng: poi.lng
    }))
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
                fontSize: '24px',
                fontWeight: '700',
                color: '#3e4533',
                fontFamily: 'Exo 2, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ 
                  fontFamily: 'Material Symbols Outlined', 
                  fontSize: '28px',
                  color: '#3e4533'
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
              <SearchBox onLocationSelect={handleLocationSelect} pois={pois} />
            </div>

            {/* Categories */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '0 16px 16px'
            }}>
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
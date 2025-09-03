import React, { useState, useCallback } from 'react'
import { MapLibreMap } from './components/MapLibreMap'
import { CategoryPanel } from './components/CategoryPanel'
import { SearchBox } from './components/SearchBox'
import { categoryTree, CategoryState, POI } from './data/pois'
import { useViewportPOIData } from './hooks/useViewportPOIData'
import { SearchResult } from './services/searchService'

export function MapLibreTrakkeApp() {
  // Category state - starts with nothing selected (clean map on load)
  const [categoryState, setCategoryState] = useState<CategoryState>({
    checked: {}, // No categories checked initially
    expanded: {
      // Expand main categories for better UX
      outdoor_activities: true,
      water_activities: true,
      accommodation: true,
      cultural_heritage: true,
      services_infrastructure: true
    }
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [currentViewport, setCurrentViewport] = useState<{ north: number; south: number; east: number; west: number; zoom: number } | null>(null)

  // POI data hook
  const { pois, loading, error, loadPOIsForViewport, clearPOIs } = useViewportPOIData()

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

      // Load/clear POIs based on category selection
      setTimeout(() => {
        const activeTypes = getActivePOITypes(newState)
        if (activeTypes.length === 0) {
          clearPOIs()
        } else if (currentViewport) {
          // Load POIs for the currently selected categories
          loadPOIsForViewport(currentViewport, activeTypes as any[])
        }
        console.log(`🏷️ Categories changed. Active types: ${activeTypes.join(', ')}`)
      }, 100)

      return newState
    })
  }, [clearPOIs, currentViewport, loadPOIsForViewport])

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
    // TODO: Center map on search result
    console.log('🔍 Search result:', result)
  }, [])

  const handleViewportChange = useCallback((viewport: { north: number; south: number; east: number; west: number; zoom: number }) => {
    setCurrentViewport(viewport)
    console.log('🗺️ Viewport changed:', viewport)
    
    // Load POIs for current active categories if any are selected
    const activeTypes = getActivePOITypes(categoryState)
    if (activeTypes.length > 0) {
      loadPOIsForViewport(viewport, activeTypes as any[])
    }
  }, [categoryState, loadPOIsForViewport])

  // Helper function to get active POI types from category state
  const getActivePOITypes = (state: CategoryState): string[] => {
    const activeTypes: string[] = []
    
    function checkNode(node: typeof categoryTree[0]) {
      if (state.checked[node.id] && node.poiTypes) {
        node.poiTypes.forEach(type => activeTypes.push(type))
      }
      if (node.children) {
        node.children.forEach(checkNode)
      }
    }
    
    categoryTree.forEach(checkNode)
    return activeTypes
  }

  return (
    <div className="app" style={{ 
      display: 'flex', 
      height: '100vh', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '0px' : '320px',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column'
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
                color: '#1f2937'
              }}>
                Tråkke
              </h1>
              <p style={{
                margin: '0',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Norsk friluftsliv med Kartverket
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

      {/* Main content */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            top: '16px',
            left: sidebarCollapsed ? '16px' : '336px',
            zIndex: 1000,
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '8px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'left 0.3s ease'
          }}
        >
          <span style={{ 
            fontFamily: 'Material Symbols Outlined', 
            fontSize: '18px',
            color: '#374151'
          }}>
            {sidebarCollapsed ? 'menu_open' : 'menu'}
          </span>
        </button>

        {/* MapLibre Map */}
        <MapLibreMap
          pois={pois}
          categoryState={categoryState}
          categoryTree={categoryTree}
          onCategoryToggle={handleCategoryToggle}
          onExpandToggle={handleExpandToggle}
          onViewportChange={handleViewportChange}
        />
      </div>
    </div>
  )
}
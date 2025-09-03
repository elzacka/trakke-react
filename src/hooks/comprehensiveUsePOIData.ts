// src/hooks/comprehensiveUsePOIData.ts - Complete POI data loading for all categories
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { POI, updatePoisData, manualPoisData, loadKrigsminnerPOIs, loadUtsiktspunkterPOIs, POIType } from '../data/pois'
import { ComprehensiveOSMService, OSM_CATEGORY_MAPPINGS } from '../services/comprehensiveOSMService'

export interface ComprehensivePOIDataState {
  pois: POI[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  categoryProgress: Record<POIType, 'pending' | 'loading' | 'completed' | 'error'>
  totalCategories: number
  completedCategories: number
}

export function useComprehensivePOIData() {
  const availableCategories = Object.keys(OSM_CATEGORY_MAPPINGS) as POIType[]
  
  const [state, setState] = useState<ComprehensivePOIDataState>({
    pois: manualPoisData, // Start with manual POI data for immediate display
    loading: false,
    error: null,
    lastUpdated: new Date(),
    categoryProgress: availableCategories.reduce((acc, cat) => ({ ...acc, [cat]: 'pending' }), {} as Record<POIType, 'pending' | 'loading' | 'completed' | 'error'>),
    totalCategories: availableCategories.length,
    completedCategories: 0
  })

  // Prevent multiple initial loads
  const hasLoadedRef = useRef(false)

  // Create OSM service instance
  const osmService = useMemo(() => new ComprehensiveOSMService(), [])

  const fetchComprehensiveData = useCallback(async () => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      completedCategories: 0
    }))
    
    console.log('🚀 Starting comprehensive POI data loading...')
    console.log(`📊 Will load ${availableCategories.length} OSM categories + external datasets`)
    
    try {
      // === PHASE 1: Load External Datasets (GeoJSON) ===
      console.log('📥 Phase 1: Loading external datasets...')
      
      const [loadedKrigsminnerPOIs, loadedUtsiktspunkterPOIs] = await Promise.all([
        loadKrigsminnerPOIs(),
        loadUtsiktspunkterPOIs()
      ])
      
      console.log(`✅ External datasets loaded:`)
      console.log(`   - Krigsminner: ${loadedKrigsminnerPOIs.length} POIs`)
      console.log(`   - Utsiktspunkter: ${loadedUtsiktspunkterPOIs.length} POIs`)

      // Update with external data immediately
      const externalPOIs = [...loadedKrigsminnerPOIs, ...loadedUtsiktspunkterPOIs]
      setState(prev => ({
        ...prev,
        pois: [...manualPoisData, ...externalPOIs],
        lastUpdated: new Date()
      }))

      // === PHASE 2: Load OSM Categories ===
      console.log('📥 Phase 2: Loading OSM categories...')
      
      // Prioritized loading order
      const highPriorityCategories: POIType[] = [
        'hiking', 'mountain_peaks', 'viewpoints', 'staffed_huts', 
        'self_service_huts', 'camping_site', 'wilderness_shelter'
      ]
      
      const mediumPriorityCategories: POIType[] = [
        'nature_gems', 'archaeological', 'churches', 'parking', 
        'rest_areas', 'drinking_water', 'information_boards'
      ]
      
      const lowPriorityCategories = availableCategories.filter(
        cat => !highPriorityCategories.includes(cat) && !mediumPriorityCategories.includes(cat)
      )

      const allOSMPOIs: POI[] = []
      let completedCount = 0

      // Load categories in priority order
      const loadCategoryBatch = async (categories: POIType[], delayMs: number) => {
        for (const category of categories) {
          try {
            setState(prev => ({
              ...prev,
              categoryProgress: { ...prev.categoryProgress, [category]: 'loading' }
            }))

            console.log(`🔄 Loading ${category} POIs...`)
            const elements = await osmService.getPOIsForCategory(category)
            const categoryPOIs = elements.map(el => osmService.convertToPOI(el, category))
            
            allOSMPOIs.push(...categoryPOIs)
            completedCount++

            setState(prev => ({
              ...prev,
              pois: [...manualPoisData, ...externalPOIs, ...allOSMPOIs],
              categoryProgress: { ...prev.categoryProgress, [category]: 'completed' },
              completedCategories: completedCount,
              lastUpdated: new Date()
            }))

            console.log(`✅ ${category}: ${categoryPOIs.length} POIs (${completedCount}/${availableCategories.length} categories)`)

            // Delay between requests to respect API limits
            if (delayMs > 0) {
              await new Promise(resolve => setTimeout(resolve, delayMs))
            }
            
          } catch (error) {
            console.error(`❌ Failed to load ${category}:`, error)
            setState(prev => ({
              ...prev,
              categoryProgress: { ...prev.categoryProgress, [category]: 'error' }
            }))
          }
        }
      }

      // Load in batches with appropriate delays
      await loadCategoryBatch(highPriorityCategories, 3000)  // 3 second delay for high priority
      await loadCategoryBatch(mediumPriorityCategories, 2000) // 2 second delay for medium priority  
      await loadCategoryBatch(lowPriorityCategories, 1000)   // 1 second delay for low priority

      // === FINAL RESULTS ===
      const finalPOIs = [...manualPoisData, ...externalPOIs, ...allOSMPOIs]
      
      console.log(`🎉 Comprehensive POI loading completed!`)
      console.log(`📊 Final results:`)
      console.log(`   - Manual samples: ${manualPoisData.length}`)
      console.log(`   - Krigsminner: ${loadedKrigsminnerPOIs.length}`)
      console.log(`   - Utsiktspunkter: ${loadedUtsiktspunkterPOIs.length}`) 
      console.log(`   - OSM categories: ${allOSMPOIs.length}`)
      console.log(`   - TOTAL POIs: ${finalPOIs.length}`)

      // Final state update
      setState(prev => ({
        ...prev,
        pois: finalPOIs,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }))

      // Update global state
      updatePoisData(finalPOIs)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('💥 Comprehensive POI loading failed:', errorMessage)
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
    }
  }, [availableCategories, osmService])

  // Auto-start loading on component mount
  useEffect(() => {
    fetchComprehensiveData()
  }, [fetchComprehensiveData])

  return {
    ...state,
    refetch: fetchComprehensiveData,
    progressPercentage: Math.round((state.completedCategories / state.totalCategories) * 100)
  }
}

// Keep the original hook for backward compatibility, but make it use comprehensive data
export function usePOIData() {
  const comprehensive = useComprehensivePOIData()
  
  return {
    pois: comprehensive.pois,
    loading: comprehensive.loading,
    error: comprehensive.error,
    lastUpdated: comprehensive.lastUpdated,
    refetch: comprehensive.refetch
  }
}
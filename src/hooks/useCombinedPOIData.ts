// Combined hook for outdoor recreation POIs and heritage POIs (weather removed)
import { useMemo } from 'react'
import { usePOIData } from './usePOIData'
import { useHeritageData } from './useHeritageData'
import { POI } from '../data/pois'

interface UseCombinedPOIDataOptions {
  heritageEnabled: boolean
}

interface UseCombinedPOIDataReturn {
  // Combined data
  allPOIs: POI[]
  totalPOIs: number
  
  // Outdoor recreation data
  outdoorPOIs: POI[]
  outdoorLoading: boolean
  outdoorError: string | null
  
  // Heritage data  
  heritagePOIs: POI[]
  heritageLoading: boolean
  heritageError: string | null
  heritageTotal: number
  
  // Combined state
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  
  // Actions
  refreshOutdoorData: () => void
  refreshHeritageData: () => Promise<void>
}

export function useCombinedPOIData({
  heritageEnabled
}: UseCombinedPOIDataOptions): UseCombinedPOIDataReturn {
  
  // Outdoor recreation POIs (no weather)
  const {
    pois: outdoorPOIs,
    loading: outdoorLoading,
    error: outdoorError,
    lastUpdated: outdoorLastUpdated,
    refreshData: refreshOutdoorData
  } = usePOIData()

  // Heritage POIs
  const {
    heritagePOIs,
    loading: heritageLoading,
    error: heritageError,
    lastUpdated: heritageLastUpdated,
    refreshData: refreshHeritageData,
    totalHeritage: heritageTotal
  } = useHeritageData({ 
    enabled: heritageEnabled,
    bbox: [4.5, 57.8, 31.5, 71.2] // Hele Norge
  })

  // Combine all POIs
  const allPOIs = useMemo(() => {
    const combined = [...outdoorPOIs]
    
    if (heritageEnabled) {
      combined.push(...heritagePOIs)
    }
    
    return combined
  }, [outdoorPOIs, heritagePOIs, heritageEnabled])

  // Combined loading state
  const loading = outdoorLoading || (heritageEnabled && heritageLoading)
  
  // Combined error state
  const error = outdoorError || (heritageEnabled ? heritageError : null)
  
  // Most recent update time
  const lastUpdated = useMemo(() => {
    const dates = [outdoorLastUpdated, heritageEnabled ? heritageLastUpdated : null]
      .filter((date): date is Date => date !== null)
    
    return dates.length > 0 
      ? new Date(Math.max(...dates.map(d => d.getTime())))
      : null
  }, [outdoorLastUpdated, heritageLastUpdated, heritageEnabled])

  return {
    // Combined data
    allPOIs,
    totalPOIs: allPOIs.length,
    
    // Outdoor recreation data
    outdoorPOIs,
    outdoorLoading,
    outdoorError,
    
    // Heritage data
    heritagePOIs,
    heritageLoading,
    heritageError,
    heritageTotal,
    
    // Combined state
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshOutdoorData,
    refreshHeritageData
  }
}
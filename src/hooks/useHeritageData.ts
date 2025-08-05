// Hook for managing heritage POI data from Riksantikvaren API
import { useState, useEffect, useCallback } from 'react'
import { riksantikvarenService, RiksantikvarenPOI } from '../services/riksantikvarenService'
import { POI, POIType } from '../data/pois'

interface UseHeritageDataOptions {
  enabled: boolean
  bbox?: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
}

interface UseHeritageDataReturn {
  heritagePOIs: POI[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refreshData: () => Promise<void>
  totalHeritage: number
}

// Default bounding box for Setesdal region (Bykle/Valle)
const DEFAULT_BBOX: [number, number, number, number] = [6.8, 59.0, 8.2, 59.8]

export function useHeritageData({ 
  enabled = true,
  bbox = DEFAULT_BBOX 
}: UseHeritageDataOptions): UseHeritageDataReturn {
  const [heritagePOIs, setHeritagePOIs] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Convert Riksantikvaren POI to our POI format
  const convertToPOI = useCallback((riksPOI: RiksantikvarenPOI): POI => {
    // Map Riksantikvaren categories to our POI types
    const categoryMap: Record<RiksantikvarenPOI['category'], POIType> = {
      'archaeological': 'archaeological',
      'military': 'war_memorials',
      'building': 'protected_buildings', 
      'underwater': 'underwater_heritage',
      'memorial': 'war_memorials'
    }

    return {
      id: riksPOI.id,
      name: riksPOI.name,
      lat: riksPOI.coordinates[1], // Riksantikvaren uses [lng, lat]
      lng: riksPOI.coordinates[0],
      description: riksPOI.description,
      type: categoryMap[riksPOI.category] || 'history_other',
      metadata: {
        period: riksPOI.period,
        protection_status: riksPOI.protection_status,
        source_url: riksPOI.source_url,
        heritage_category: riksPOI.category
      },
      api_source: 'riksantikvaren' as const,
      last_updated: riksPOI.updated_at.toISOString()
    }
  }, [])

  // Fetch heritage data
  const fetchHeritageData = useCallback(async () => {
    if (!enabled) {
      setHeritagePOIs([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🏛️ Fetching heritage POIs...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Heritage API timeout - continuing without heritage data')), 8000)
      )
      
      const dataPromise = riksantikvarenService.getHeritagePoIsInBbox(bbox)
      
      const riksPOIs = await Promise.race([dataPromise, timeoutPromise])
      
      const convertedPOIs = riksPOIs.map(convertToPOI)
      
      setHeritagePOIs(convertedPOIs)
      setLastUpdated(new Date())
      
      console.log(`✅ Loaded ${convertedPOIs.length} heritage POIs`)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading heritage data'
      setError(`Heritage data unavailable: ${errorMessage}`)
      console.warn('⚠️ Heritage POIs failed to load, continuing without them:', err)
      
      // Don't block the app - just set empty array
      setHeritagePOIs([])
    } finally {
      setLoading(false)
    }
  }, [enabled, bbox, convertToPOI])

  // Initial load
  useEffect(() => {
    fetchHeritageData()
  }, [fetchHeritageData])

  // Refresh function
  const refreshData = useCallback(async () => {
    await fetchHeritageData()
  }, [fetchHeritageData])

  return {
    heritagePOIs,
    loading,
    error,
    lastUpdated,
    refreshData,
    totalHeritage: heritagePOIs.length
  }
}
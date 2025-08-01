// src/hooks/usePOIData.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import { POI, manualPoisData, updatePoisData } from '../data/pois'
import { OSMService } from '../services/osmService'

export interface POIDataState {
  pois: POI[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function usePOIData() {
  const [state, setState] = useState<POIDataState>({
    pois: manualPoisData,
    loading: false,
    error: null,
    lastUpdated: null
  })

  // Lag OSMService kun en gang med useMemo
  const osmService = useMemo(() => new OSMService(), [])

  const fetchOSMData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      console.log('🗺️ Henter camping-data fra OpenStreetMap...')
      
      const osmElements = await osmService.getCampingPOIs()
      console.log(`📍 Fant ${osmElements.length} OSM elementer`)
      
      const osmPois: POI[] = []
      
      for (const element of osmElements) {
        const suitability = osmService.analyzeCampingSuitability(element)
        
        // Kun inkluder hvis vi har rimelig confidence
        if (suitability.confidence > 0.4) {
          const poi = osmService.convertToPOI(element, suitability)
          osmPois.push(poi)
        }
      }
      
      console.log(`✅ Konverterte ${osmPois.length} egnede camping-spotter`)
      
      // Kombiner manuelle og OSM data
      const allPois = [...manualPoisData, ...osmPois]
      
      // Oppdater global state
      updatePoisData(osmPois)
      
      setState({
        pois: allPois,
        loading: false,
        error: null,
        lastUpdated: new Date()
      })
      
    } catch (error) {
      console.error('❌ Feil ved henting av OSM data:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Ukjent feil'
      }))
    }
  }, [osmService])

  const refreshData = useCallback(() => {
    fetchOSMData()
  }, [fetchOSMData])

  // Hent data ved første last
  useEffect(() => {
    fetchOSMData()
  }, [fetchOSMData])

  return {
    ...state,
    refreshData
  }
}
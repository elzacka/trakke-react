// src/hooks/usePOIData.ts - Fikset OSM API implementering
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { POI, updatePoisData } from '../data/pois'
import { OSMService } from '../services/osmService'

export interface POIDataState {
  pois: POI[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function usePOIData() {
  const [state, setState] = useState<POIDataState>({
    pois: [], // Start with empty array - no manual data
    loading: false,
    error: null,
    lastUpdated: null
  })

  // Prevent multiple initial loads
  const hasLoadedRef = useRef(false)

  // Lag OSMService kun en gang med useMemo
  const osmService = useMemo(() => new OSMService(), [])

  const fetchOSMData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Fetching camping data from OpenStreetMap
      
      // Timeout for API call (25 sekunder som i query + buffer)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OSM API timeout etter 30 sekunder')), 30000)
      )
      
      const osmDataPromise = osmService.getCampingPOIs()
      
      // Race mellom API call og timeout
      const osmElements = await Promise.race([osmDataPromise, timeoutPromise])
      
      // Found OSM elements
      
      const osmPois: POI[] = []
      
      // Safer element processing med error handling
      for (const element of osmElements) {
        try {
          // Valider at element har nødvendige data
          if (!element.id || (!element.lat && !element.center?.lat)) {
            console.warn('⚠️ Ugyldig OSM element:', element.id)
            continue
          }
          
          const suitability = osmService.analyzeCampingSuitability(element)
          
          // Kun inkluder hvis vi har rimelig confidence
          if (suitability.confidence > 0.4) {
            const poi = osmService.convertToPOI(element, suitability)
            
            // Ekstra validering av POI
            if (poi.lat !== 0 && poi.lng !== 0) {
              osmPois.push(poi)
            }
          }
        } catch (elementError) {
          console.warn('⚠️ Feil ved prosessering av OSM element:', element.id, elementError)
          // Fortsett med neste element istedenfor å krasje
        }
      }
      
      // Converted suitable camping spots
      
      // Use only OSM data (no manual POIs)
      const allPois = osmPois
      
      // Update global state
      updatePoisData(osmPois)
      
      setState({
        pois: allPois,
        loading: false,
        error: null,
        lastUpdated: new Date()
      })
      
    } catch (error) {
      console.error('❌ Feil ved henting av OSM data:', error)
      
      // Gi mer spesifikke feilmeldinger
      let errorMessage = 'Ukjent feil ved lasting av data'
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Forespørsel tok for lang tid - prøv igjen senere'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Nettverksfeil - sjekk internett-tilkobling'
        } else {
          errorMessage = error.message
        }
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      
      // Ikke krasj appen - behold manuelle data
      // (state.pois forblir manualPoisData)
    }
  }, [osmService])

  const refreshData = useCallback(() => {
    // Manual refresh of OSM data
    fetchOSMData()
  }, [fetchOSMData])

  // Hent data ved første last - men kun én gang
  useEffect(() => {
    // Sjekk om data allerede er lastet
    if (hasLoadedRef.current) {
      return
    }

    let mounted = true
    
    // Legg til en liten delay for å la appen rendre først
    const timer = setTimeout(() => {
      if (mounted && !hasLoadedRef.current) {
        hasLoadedRef.current = true
        fetchOSMData()
      }
    }, 1000)
    
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [fetchOSMData]) // ESLint krever denne dependency

  return {
    ...state,
    refreshData
  }
}
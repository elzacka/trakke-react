// src/hooks/usePOIData.ts - Fikset OSM API implementering
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
    pois: manualPoisData, // Start med manuelle data umiddelbart
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
      
      // Timeout for API call (25 sekunder som i query + buffer)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OSM API timeout etter 30 sekunder')), 30000)
      )
      
      const osmDataPromise = osmService.getCampingPOIs()
      
      // Race mellom API call og timeout
      const osmElements = await Promise.race([osmDataPromise, timeoutPromise])
      
      console.log(`📍 Fant ${osmElements.length} OSM elementer`)
      
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
      
      console.log(`✅ Konverterte ${osmPois.length} egnede camping-spotter`)
      
      // Kombiner manuelle og OSM data
      const allPois = [...manualPoisData, ...osmPois]
      
      // Oppdater global state (optional, kan fjernes hvis ikke nødvendig)
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
    console.log('🔄 Manuell refresh av OSM data...')
    fetchOSMData()
  }, [fetchOSMData])

  // Hent data ved første last - men kun én gang
  useEffect(() => {
    let mounted = true
    
    // Legg til en liten delay for å la appen rendre først
    const timer = setTimeout(() => {
      if (mounted) {
        fetchOSMData()
      }
    }, 1000)
    
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, []) // Fjernet fetchOSMData fra dependencies for å unngå loops

  return {
    ...state,
    refreshData
  }
}
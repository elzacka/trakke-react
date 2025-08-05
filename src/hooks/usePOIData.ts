// src/hooks/usePOIData.ts - Fikset OSM API implementering
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { POI, updatePoisData, manualPoisData } from '../data/pois'
import { OSMService } from '../services/osmService'

export interface POIDataState {
  pois: POI[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function usePOIData() {
  const [state, setState] = useState<POIDataState>({
    pois: manualPoisData, // Start with manual POI data for immediate display
    loading: false,
    error: null,
    lastUpdated: new Date() // Set initial timestamp
  })

  // Prevent multiple initial loads
  const hasLoadedRef = useRef(false)

  // Lag OSMService kun en gang med useMemo
  const osmService = useMemo(() => new OSMService(), [])

  const fetchOSMData = useCallback(async () => {
    // Don't set loading to true since we already have manual POIs to show
    setState(prev => ({ ...prev, error: null }))
    console.log('🔄 Loading additional POIs from OpenStreetMap (in background)...')
    
    try {
      // Shorter timeout for better UX (8 seconds per query)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OSM API timeout etter 8 sekunder')), 8000)
      )
      
      // Fetch all OSM data types in parallel
      const [campingDataPromise, warMemorialDataPromise, outdoorRecreationDataPromise, hutAndServiceDataPromise, serviceInfrastructureDataPromise] = [
        osmService.getCampingPOIs(),
        osmService.getWarMemorialPOIs(),
        osmService.getOutdoorRecreationPOIs(),
        osmService.getHutAndServicePOIs(),
        osmService.getServiceInfrastructurePOIs()
      ]
      
      // Race each API call against timeout
      const [campingElements, warMemorialElements, outdoorRecreationElements, hutAndServiceElements, serviceInfrastructureElements] = await Promise.all([
        Promise.race([campingDataPromise, timeoutPromise]).catch(err => {
          console.warn('⚠️ Camping POIs failed to load:', err)
          return []
        }),
        Promise.race([warMemorialDataPromise, timeoutPromise]).catch(err => {
          console.warn('⚠️ War memorial POIs failed to load:', err)
          return []
        }),
        Promise.race([outdoorRecreationDataPromise, timeoutPromise]).catch(err => {
          console.warn('⚠️ Outdoor recreation POIs failed to load:', err)
          return []
        }),
        Promise.race([hutAndServiceDataPromise, timeoutPromise]).catch(err => {
          console.warn('⚠️ Hut and service POIs failed to load:', err)
          return []
        }),
        Promise.race([serviceInfrastructureDataPromise, timeoutPromise]).catch(err => {
          console.warn('⚠️ Service infrastructure POIs failed to load:', err)
          return []
        })
      ])
      
      const osmPois: POI[] = []
      
      // Process camping elements
      for (const element of campingElements) {
        try {
          if (!element.id || (!element.lat && !element.center?.lat)) {
            console.warn('⚠️ Ugyldig camping element:', element.id)
            continue
          }
          
          const suitability = osmService.analyzeCampingSuitability(element)
          
          if (suitability.confidence > 0.4) {
            const poi = osmService.convertToPOI(element, suitability)
            
            if (poi.lat !== 0 && poi.lng !== 0) {
              osmPois.push(poi)
            }
          }
        } catch (elementError) {
          console.warn('⚠️ Feil ved prosessering av camping element:', element.id, elementError)
        }
      }
      
      // Process war memorial elements
      for (const element of warMemorialElements) {
        try {
          if (!element.id || (!element.lat && !element.center?.lat)) {
            console.warn('⚠️ Ugyldig krigsminne element:', element.id)
            continue
          }
          
          const poi = osmService.convertWarMemorialToPOI(element)
          
          if (poi.lat !== 0 && poi.lng !== 0) {
            osmPois.push(poi)
          }
        } catch (elementError) {
          console.warn('⚠️ Feil ved prosessering av krigsminne element:', element.id, elementError)
        }
      }
      
      // Process outdoor recreation elements
      for (const element of outdoorRecreationElements) {
        try {
          if (!element.id || (!element.lat && !element.center?.lat)) {
            console.warn('⚠️ Ugyldig friluftsliv element:', element.id)
            continue
          }
          
          const poi = osmService.convertOutdoorRecreationToPOI(element)
          
          if (poi.lat !== 0 && poi.lng !== 0) {
            osmPois.push(poi)
          }
        } catch (elementError) {
          console.warn('⚠️ Feil ved prosessering av friluftsliv element:', element.id, elementError)
        }
      }
      
      // Process hut and service elements
      for (const element of hutAndServiceElements) {
        try {
          if (!element.id || (!element.lat && !element.center?.lat)) {
            console.warn('⚠️ Ugyldig hytte/service element:', element.id)
            continue
          }
          
          const poi = osmService.convertHutAndServiceToPOI(element)
          
          if (poi.lat !== 0 && poi.lng !== 0) {
            osmPois.push(poi)
          }
        } catch (elementError) {
          console.warn('⚠️ Feil ved prosessering av hytte/service element:', element.id, elementError)
        }
      }
      
      // Process service infrastructure elements
      for (const element of serviceInfrastructureElements) {
        try {
          if (!element.id || (!element.lat && !element.center?.lat)) {
            console.warn('⚠️ Ugyldig service/infrastruktur element:', element.id)
            continue
          }
          
          const poi = osmService.convertServiceInfrastructureToPOI(element)
          
          if (poi.lat !== 0 && poi.lng !== 0) {
            osmPois.push(poi)
          }
        } catch (elementError) {
          console.warn('⚠️ Feil ved prosessering av service/infrastruktur element:', element.id, elementError)
        }
      }
      
      // Combine manual POIs with OSM data
      const allPois = [...manualPoisData, ...osmPois]
      
      console.log(`✅ Loaded ${manualPoisData.length} manual + ${campingElements.length} camping + ${warMemorialElements.length} war memorial + ${outdoorRecreationElements.length} outdoor + ${hutAndServiceElements.length} hut/service + ${serviceInfrastructureElements.length} infrastructure POIs = ${allPois.length} total`)
      
      // Update global state
      updatePoisData(allPois)
      
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
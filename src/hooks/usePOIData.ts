// src/hooks/usePOIData.ts - Fikset OSM API implementering
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { POI, updatePoisData, manualPoisData, loadKrigsminnerPOIs } from '../data/pois'
import { OSMService, OSMElement } from '../services/osmService'

export interface POIDataState {
  pois: POI[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function usePOIData() {
  const [state, setState] = useState<POIDataState>({
    pois: manualPoisData, // Start with manual POI data for immediate display
    loading: false, // Don't show loading initially - load data in background
    error: null,
    lastUpdated: new Date() // Set initial timestamp
  })

  // Prevent multiple initial loads
  const hasLoadedRef = useRef(false)

  // Lag OSMService kun en gang med useMemo
  const osmService = useMemo(() => new OSMService(), [])

  const fetchOSMData = useCallback(async () => {
    // Load OSM data and Krigsminner data in background without blocking UI
    setState(prev => ({ ...prev, error: null }))
    console.log('🔄 Loading POIs from OpenStreetMap and Krigsminner data in background...')
    
    try {
      // Load Krigsminner data first
      console.log('🔄 Loading Krigsminner POIs...')
      const loadedKrigsminnerPOIs = await loadKrigsminnerPOIs()
      console.log(`✅ Loaded ${loadedKrigsminnerPOIs.length} Krigsminner POIs`)
      
      // Update state immediately with manual + Krigsminner data
      setState(prev => ({
        ...prev,
        pois: [...manualPoisData, ...loadedKrigsminnerPOIs],
        lastUpdated: new Date()
      }))
      // OSM API has 15-second queue timeout - use 12 seconds to stay within limits
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OSM API timeout etter 12 sekunder')), 12000)
      )
      
      // Helper function to retry OSM requests with exponential backoff for 429 errors
      const fetchWithRetry = async (fetchFn: () => Promise<OSMElement[]>, name: string, maxRetries: number = 3): Promise<OSMElement[]> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const result = await Promise.race([fetchFn(), timeoutPromise])
            return result
          } catch (error: unknown) {
            console.warn(`⚠️ ${name} attempt ${attempt} failed:`, error)
            
            // If it's a 429 error and we have retries left, wait longer and retry
            if (error instanceof Error && error.message.includes('429') && attempt < maxRetries) {
              const backoffDelay = Math.min(10000 + (attempt * 5000), 30000) // 10s, 15s, 20s max
              console.log(`🔄 Retrying ${name} in ${backoffDelay/1000}s due to rate limiting...`)
              await new Promise(resolve => setTimeout(resolve, backoffDelay))
              continue
            }
            
            // Final attempt failed or non-429 error
            return []
          }
        }
        return []
      }

      // Fetch OSM data sequentially with proper retry logic
      console.log('🔄 Fetching camping POIs...')
      const campingElements = await fetchWithRetry(
        () => osmService.getCampingPOIs(),
        'Camping POIs'
      )
      
      await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay per OSM guidelines
      
      // Skip war memorial POIs from OSM - we have comprehensive Krigsminner data already
      console.log('ℹ️ Skipping OSM war memorial fetch - using comprehensive Krigsminner dataset instead')
      const _warMemorialElements: OSMElement[] = []
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // Short delay to maintain API rhythm
      
      console.log('🔄 Fetching outdoor recreation POIs...')
      const outdoorRecreationElements = await fetchWithRetry(
        () => osmService.getOutdoorRecreationPOIs(),
        'Outdoor Recreation POIs'
      )
      
      await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay per OSM guidelines
      
      console.log('🔄 Fetching hut and service POIs...')
      const hutAndServiceElements = await fetchWithRetry(
        () => osmService.getHutAndServicePOIs(),
        'Hut and Service POIs'
      )
      
      await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay per OSM guidelines
      
      console.log('🔄 Fetching service infrastructure POIs...')
      const serviceInfrastructureElements = await fetchWithRetry(
        () => osmService.getServiceInfrastructurePOIs(),
        'Service Infrastructure POIs'
      )
      
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
      
      // Skip war memorial processing - using comprehensive Krigsminner dataset instead
      
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
      
      // Combine manual POIs with OSM data and Krigsminner data
      const allPois = [...manualPoisData, ...loadedKrigsminnerPOIs, ...osmPois]
      
      console.log(`✅ Data Loading Results:`)
      console.log(`   Camping elements: ${campingElements.length}`)
      console.log(`   War memorial elements: ${_warMemorialElements.length} (using Krigsminner dataset instead)`)
      console.log(`   Outdoor recreation elements: ${outdoorRecreationElements.length}`)
      console.log(`   Hut/service elements: ${hutAndServiceElements.length}`)
      console.log(`   Infrastructure elements: ${serviceInfrastructureElements.length}`)
      console.log(`   Manual POIs: ${manualPoisData.length}`)
      console.log(`   Krigsminner POIs: ${loadedKrigsminnerPOIs.length}`)
      console.log(`   Total POIs: ${allPois.length} (${osmPois.length} from OSM + ${manualPoisData.length} manual + ${loadedKrigsminnerPOIs.length} Krigsminner)`)
      
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
      
      // Ikke krasj appen - return empty array on error
      // (state.pois forblir tom array)
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
// src/hooks/useViewportPOIData.ts - Viewport-based POI loading (industry standard)
import { useState, useCallback, useRef } from 'react'
import { POI, POIType } from '../data/pois'
import { OSMService, ViewportBounds } from '../services/osmService'

export interface ViewportPOIDataState {
  pois: POI[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface POICache {
  [key: string]: {
    pois: POI[]
    timestamp: number
    bounds: ViewportBounds
  }
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

// Maximum POIs per viewport to prevent performance issues
const MAX_POIS_PER_VIEWPORT = 1000

export function useViewportPOIData() {
  const [state, setState] = useState<ViewportPOIDataState>({
    pois: [],
    loading: false,
    error: null,
    lastUpdated: null
  })

  const osmService = useRef(new OSMService())
  const cacheRef = useRef<POICache>({})
  const loadingRef = useRef(false)

  const getCacheKey = (bounds: ViewportBounds, poiTypes: POIType[]): string => {
    const boundsStr = `${bounds.north.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.west.toFixed(4)}`
    const typesStr = poiTypes.sort().join(',')
    return `${boundsStr}:${typesStr}`
  }

  const isValidCache = (cacheEntry: POICache[string], requestedBounds: ViewportBounds): boolean => {
    const now = Date.now()
    if (now - cacheEntry.timestamp > CACHE_DURATION) return false

    // Check if cached bounds contain the requested bounds
    const cached = cacheEntry.bounds
    return cached.north >= requestedBounds.north &&
           cached.south <= requestedBounds.south &&
           cached.east >= requestedBounds.east &&
           cached.west <= requestedBounds.west
  }

  const loadPOIsForViewport = useCallback(async (
    bounds: ViewportBounds,
    poiTypes: POIType[]
  ) => {
    if (loadingRef.current || poiTypes.length === 0) return

    const cacheKey = getCacheKey(bounds, poiTypes)
    const cached = cacheRef.current[cacheKey]

    // Return cached data if valid
    if (cached && isValidCache(cached, bounds)) {
      setState(prev => ({
        ...prev,
        pois: cached.pois,
        lastUpdated: new Date(cached.timestamp)
      }))
      return
    }

    loadingRef.current = true
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      console.log(`🗺️ Loading POIs for viewport:`, bounds)
      console.log(`📋 Requested types:`, poiTypes)

      const allPOIs: POI[] = []

      // Load only requested POI types for current viewport
      for (const poiType of poiTypes) {
        try {
          let elements: any[] = []
          
          switch (poiType) {
            // Accommodation
            case 'camping_site':
            case 'tent_area':
            case 'wild_camping':
              elements = await osmService.current.getCampingPOIsInBounds(bounds)
              break
            case 'staffed_huts':
            case 'self_service_huts':
            case 'wilderness_shelter':
              elements = await osmService.current.getHutPOIsInBounds(bounds)
              break
            
            // Outdoor Activities
            case 'hiking':
            case 'mountain_peaks':
            case 'viewpoints':
            case 'nature_gems':
              elements = await osmService.current.getOutdoorRecreationPOIsInBounds(bounds)
              break
            case 'swimming':
            case 'beach':
            case 'lakes_rivers':
              elements = await osmService.current.getWaterActivitiesPOIsInBounds(bounds)
              break
            case 'ski_trails':
              elements = await osmService.current.getSkiTrailsPOIsInBounds(bounds)
              break
            case 'fishing_spots':
            case 'canoeing':
            case 'ice_fishing':
              elements = await osmService.current.getWaterSportsPOIsInBounds(bounds)
              break
            
            // Cultural Heritage
            case 'war_memorials':
            case 'peace_monuments':
            case 'archaeological':
            case 'churches':
            case 'protected_buildings':
            case 'industrial_heritage':
              elements = await osmService.current.getCulturalHeritagePOIsInBounds(bounds)
              break
            
            // Services & Infrastructure
            case 'parking':
            case 'toilets':
            case 'drinking_water':
            case 'rest_areas':
              elements = await osmService.current.getServicePOIsInBounds(bounds)
              break
            case 'public_transport':
            case 'train_stations':
              elements = await osmService.current.getTransportPOIsInBounds(bounds)
              break
            case 'cable_cars':
              elements = await osmService.current.getCableCarsPOIsInBounds(bounds)
              break
            case 'information_boards':
            case 'fire_places':
              elements = await osmService.current.getRecreationServicesPOIsInBounds(bounds)
              break
            
            // Specialized
            case 'mountain_service':
            case 'accessible_sites':
              elements = await osmService.current.getSpecializedServicesPOIsInBounds(bounds)
              break
            
            default:
              console.log(`⚠️ POI type ${poiType} not implemented yet`)
              continue
          }

          // Process elements for this POI type
          console.log(`🔄 Processing ${elements.length} elements for ${poiType}`)
          let successfulConversions = 0
          let failedConversions = 0
          
          for (const element of elements) {
            try {
              const poi = osmService.current.convertElementToPOI(element, poiType)
              if (poi && poi.lat !== 0 && poi.lng !== 0) {
                // Verify POI is within bounds and under limit
                if (poi.lat <= bounds.north && poi.lat >= bounds.south &&
                    poi.lng <= bounds.east && poi.lng >= bounds.west &&
                    allPOIs.length < MAX_POIS_PER_VIEWPORT) {
                  allPOIs.push(poi)
                  successfulConversions++
                } else {
                  failedConversions++
                }
              } else {
                failedConversions++
              }
            } catch (error) {
              console.warn(`⚠️ Failed to process element:`, error)
              failedConversions++
            }
          }
          
          console.log(`📊 ${poiType}: ${successfulConversions} successful, ${failedConversions} failed conversions`)

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (typeError) {
          console.warn(`⚠️ Failed to load ${poiType} POIs:`, typeError)
        }
      }

      console.log(`✅ Loaded ${allPOIs.length} POIs for viewport`)
      if (allPOIs.length >= MAX_POIS_PER_VIEWPORT) {
        console.warn(`⚠️ Hit POI limit of ${MAX_POIS_PER_VIEWPORT}. Zoom in for more detailed results.`)
      }

      // Cache the results
      const now = Date.now()
      cacheRef.current[cacheKey] = {
        pois: allPOIs,
        timestamp: now,
        bounds
      }

      setState(prev => ({
        ...prev,
        pois: allPOIs,
        loading: false,
        lastUpdated: new Date(now)
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load POI data'
      console.error('💥 Viewport POI loading failed:', error)
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
    } finally {
      loadingRef.current = false
    }
  }, [])

  const clearPOIs = useCallback(() => {
    setState(prev => ({
      ...prev,
      pois: []
    }))
  }, [])

  const clearCache = useCallback(() => {
    cacheRef.current = {}
  }, [])

  return {
    ...state,
    loadPOIsForViewport,
    clearPOIs,
    clearCache
  }
}
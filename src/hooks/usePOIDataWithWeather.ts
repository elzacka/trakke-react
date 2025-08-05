// src/hooks/usePOIDataWithWeather.ts - Enhanced POI data hook with weather integration

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { POI, manualPoisData, updatePoisData } from '../data/pois'
import { OSMService } from '../services/osmService'
import { WeatherService } from '../services/weatherService'

export interface POIDataWithWeatherState {
  pois: POI[]
  loading: boolean
  weatherLoading: boolean
  error: string | null
  weatherError: string | null
  lastUpdated: Date | null
  weatherLastUpdated: Date | null
  poisWithWeather: number
}

export function usePOIDataWithWeather(enableWeather: boolean = true) {
  const [state, setState] = useState<POIDataWithWeatherState>({
    pois: manualPoisData,
    loading: false,
    weatherLoading: false,
    error: null,
    weatherError: null,
    lastUpdated: null,
    weatherLastUpdated: null,
    poisWithWeather: 0
  })

  const hasLoadedRef = useRef(false)
  const weatherService = useMemo(() => new WeatherService(), [])
  const osmService = useMemo(() => new OSMService(), [])

  // Fetch POI data (same as original hook)
  const fetchOSMData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Fetching camping data from OpenStreetMap
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OSM API timeout etter 8 sekunder')), 8000)
      )
      
      const osmDataPromise = osmService.getCampingPOIs()
      const osmElements = await Promise.race([osmDataPromise, timeoutPromise])
      
      // Found OSM elements
      
      const osmPois: POI[] = []
      
      for (const element of osmElements) {
        try {
          if (!element.id || (!element.lat && !element.center?.lat)) {
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
          console.warn('⚠️ Feil ved prosessering av OSM element:', element.id, elementError)
        }
      }
      
      // Converted suitable camping spots
      
      const allPois = [...manualPoisData, ...osmPois]
      updatePoisData(osmPois)
      
      setState(prev => ({
        ...prev,
        pois: allPois,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }))
      
      // Weather data will be fetched by separate effect after POI data is updated
      
    } catch (error) {
      console.error('❌ Feil ved henting av OSM data:', error)
      
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
    }
  }, [osmService])

  // Fetch weather data for POIs with timeout to prevent blocking
  const fetchWeatherForPOIs = useCallback(async (pois: POI[]) => {
    if (!enableWeather || pois.length === 0) return

    setState(prev => ({ ...prev, weatherLoading: true, weatherError: null }))
    
    try {
      // Add timeout to prevent weather from blocking the app
      const timeoutPromise = new Promise<POI[]>((_, reject) =>
        setTimeout(() => reject(new Error('Weather API timeout - continuing without weather data')), 10000)
      )
      
      const weatherPromise = Promise.all(
        pois.map(async (poi, index) => {
          try {
            // Add small delay to respect rate limits (20 req/sec = 50ms between requests)
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }

            const weatherSummary = await weatherService.getWeatherSummary(poi.lat, poi.lng)
            
            if (weatherSummary) {
              return {
                ...poi,
                weather: {
                  temperature: weatherSummary.temperature,
                  symbolCode: weatherSummary.symbolCode,
                  description: weatherSummary.description,
                  precipitation: weatherSummary.precipitation,
                  windSpeed: weatherSummary.windSpeed,
                  lastUpdated: weatherSummary.time
                }
              }
            }
            
            return poi
          } catch (weatherError) {
            console.warn(`⚠️ Kunne ikke hente værdata for ${poi.name}:`, weatherError)
            return poi
          }
        })
      )

      const poisWithWeather = await Promise.race([weatherPromise, timeoutPromise])
      const poisWithWeatherCount = poisWithWeather.filter(poi => poi.weather).length
      
      setState(prev => ({
        ...prev,
        pois: poisWithWeather,
        weatherLoading: false,
        weatherError: null,
        weatherLastUpdated: new Date(),
        poisWithWeather: poisWithWeatherCount
      }))
      
    } catch (error) {
      console.warn('⚠️ Weather service timeout or error:', error)
      
      // Continue without weather data - don't block the app
      setState(prev => ({
        ...prev,
        pois, // Keep original POIs without weather
        weatherLoading: false,
        weatherError: error instanceof Error ? error.message : 'Kunne ikke hente værdata'
      }))
    }
  }, [weatherService, enableWeather])

  // Refresh weather data for existing POIs
  const refreshWeatherData = useCallback(() => {
    if (!enableWeather) return
    
    // Refreshing weather data
    fetchWeatherForPOIs(state.pois)
  }, [state.pois, enableWeather, fetchWeatherForPOIs])

  // Refresh all data
  const refreshData = useCallback(() => {
    // Manual refresh of all data
    fetchOSMData()
  }, [fetchOSMData])

  // Get POIs with good weather for outdoor activities
  const getGoodWeatherPOIs = useCallback(() => {
    return state.pois.filter(poi => {
      if (!poi.weather) return false
      return weatherService.isGoodWeatherForOutdoors(poi.weather.symbolCode)
    })
  }, [state.pois, weatherService])

  // Initial data fetch
  useEffect(() => {
    if (hasLoadedRef.current) return

    let mounted = true
    
    const timer = setTimeout(() => {
      if (mounted && !hasLoadedRef.current) {
        hasLoadedRef.current = true
        fetchOSMData()
      }
    }, 100)
    
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [fetchOSMData])

  // Fetch weather data when POI data changes - removed fetchWeatherForPOIs from deps to prevent infinite loops
  useEffect(() => {
    if (!enableWeather || state.loading || state.pois.length === 0) return
    
    fetchWeatherForPOIs(state.pois)
  }, [state.pois.length, state.loading, enableWeather]) // Use pois.length instead of full pois array

  // Clean up expired weather cache periodically
  useEffect(() => {
    if (!enableWeather) return

    const cleanupInterval = setInterval(() => {
      weatherService.clearExpiredCache()
    }, 15 * 60 * 1000) // Every 15 minutes

    return () => clearInterval(cleanupInterval)
  }, [weatherService, enableWeather])

  return {
    ...state,
    refreshData,
    refreshWeatherData,
    getGoodWeatherPOIs,
    hasWeatherData: state.poisWithWeather > 0
  }
}
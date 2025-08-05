// Combined hook for outdoor recreation POIs, weather data, and heritage POIs
import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePOIDataWithWeather } from './usePOIDataWithWeather'
import { useHeritageData } from './useHeritageData'
import { POI } from '../data/pois'

interface UseCombinedPOIDataOptions {
  weatherEnabled: boolean
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
  
  // Weather data
  weatherLoading: boolean
  weatherError: string | null
  poisWithWeather: number
  hasWeatherData: boolean
  goodWeatherPOIs: POI[]
  weatherLastUpdated: Date | null
  
  // Combined state
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  
  // Actions
  refreshOutdoorData: () => void
  refreshHeritageData: () => Promise<void>
  refreshWeatherData: () => void
  getGoodWeatherPOIs: () => POI[]
}

export function useCombinedPOIData({
  weatherEnabled,
  heritageEnabled
}: UseCombinedPOIDataOptions): UseCombinedPOIDataReturn {
  
  // Outdoor recreation POIs with weather
  const {
    pois: outdoorPOIs,
    loading: outdoorLoading,
    weatherLoading,
    error: outdoorError,
    weatherError,
    lastUpdated: outdoorLastUpdated,
    weatherLastUpdated,
    poisWithWeather,
    hasWeatherData,
    refreshData: refreshOutdoorData,
    refreshWeatherData,
    getGoodWeatherPOIs
  } = usePOIDataWithWeather(weatherEnabled)

  // Heritage POIs
  const {
    heritagePOIs,
    loading: heritageLoading,
    error: heritageError,
    lastUpdated: heritageLastUpdated,
    refreshData: refreshHeritageData,
    totalHeritage: heritageTotal
  } = useHeritageData({ 
    enabled: false, // Force disabled to prevent CORS errors
    bbox: [4.5, 57.8, 31.5, 71.2] // Hele Norge
  })

  // Combine all POIs
  const allPOIs = useMemo(() => {
    return [...outdoorPOIs, ...heritagePOIs]
  }, [outdoorPOIs, heritagePOIs])

  // Combined loading state - exclude weather loading to prevent blocking
  const loading = outdoorLoading || heritageLoading
  
  // Removed logging to prevent console spam

  // Combined error state
  const error = useMemo(() => {
    const errors = [outdoorError, heritageError, weatherError].filter(Boolean)
    return errors.length > 0 ? errors.join('; ') : null
  }, [outdoorError, heritageError, weatherError])

  // Combined last updated
  const lastUpdated = useMemo(() => {
    const dates = [outdoorLastUpdated, heritageLastUpdated].filter(Boolean) as Date[]
    return dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
  }, [outdoorLastUpdated, heritageLastUpdated])

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
    
    // Weather data
    weatherLoading,
    weatherError,
    poisWithWeather,
    hasWeatherData,
    goodWeatherPOIs: getGoodWeatherPOIs(),
    weatherLastUpdated,
    
    // Combined state
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshOutdoorData,
    refreshHeritageData,
    refreshWeatherData,
    getGoodWeatherPOIs
  }
}
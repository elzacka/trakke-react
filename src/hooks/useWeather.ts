// src/hooks/useWeather.ts - Custom hook for weather data management

import { useState, useEffect, useCallback, useMemo } from 'react'
import { WeatherService } from '../services/weatherService'
import { WeatherSummary } from '../types/weather'

interface UseWeatherResult {
  weather: WeatherSummary | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useWeather = (
  lat: number | null, 
  lng: number | null, 
  altitude?: number
): UseWeatherResult => {
  const [weather, setWeather] = useState<WeatherSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weatherService = useMemo(() => new WeatherService(), [])

  const fetchWeather = useCallback(async () => {
    if (lat === null || lng === null) {
      setWeather(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const weatherSummary = await weatherService.getWeatherSummary(lat, lng, altitude)
      setWeather(weatherSummary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke hente værdata')
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }, [lat, lng, altitude, weatherService])

  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  return {
    weather,
    loading,
    error,
    refetch: fetchWeather
  }
}

// Hook for multiple locations (batch weather fetching)
export const useMultipleWeather = (
  locations: Array<{ lat: number; lng: number; altitude?: number; id: string }>
): Record<string, UseWeatherResult> => {
  const [weatherData, setWeatherData] = useState<Record<string, UseWeatherResult>>({})

  const weatherService = useMemo(() => new WeatherService(), [])

  useEffect(() => {
    const fetchAllWeather = async () => {
      const results: Record<string, UseWeatherResult> = {}

      // Initialize loading states
      locations.forEach(location => {
        results[location.id] = {
          weather: null,
          loading: true,
          error: null,
          refetch: async () => {}
        }
      })
      setWeatherData({ ...results })

      // Fetch weather for each location with rate limiting
      for (const location of locations) {
        try {
          const weatherSummary = await weatherService.getWeatherSummary(
            location.lat, 
            location.lng, 
            location.altitude
          )

          results[location.id] = {
            weather: weatherSummary,
            loading: false,
            error: null,
            refetch: async () => {
              const refreshed = await weatherService.getWeatherSummary(
                location.lat, 
                location.lng, 
                location.altitude
              )
              setWeatherData(prev => ({
                ...prev,
                [location.id]: {
                  ...prev[location.id],
                  weather: refreshed
                }
              }))
            }
          }
        } catch (err) {
          results[location.id] = {
            weather: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Værdata ikke tilgjengelig',
            refetch: async () => {}
          }
        }

        // Update state after each fetch
        setWeatherData({ ...results })

        // Small delay to respect rate limits
        if (locations.indexOf(location) < locations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }

    if (locations.length > 0) {
      fetchAllWeather()
    }
  }, [locations, weatherService])

  return weatherData
}
// src/services/weatherService.ts - YR.no LocationForecast API integration

import { WeatherData, WeatherSummary, WeatherTimeseries, WEATHER_SYMBOLS, DEFAULT_WEATHER_SYMBOL } from '../types/weather'

export interface YRNoResponse {
  type: string
  geometry: {
    type: string
    coordinates: [number, number, number]
  }
  properties: {
    meta: {
      updated_at: string
      units: Record<string, string>
    }
    timeseries: WeatherTimeseries[]
  }
}

export class WeatherService {
  private readonly baseUrl = 'https://api.met.no/weatherapi/locationforecast/2.0'
  private readonly userAgent = 'Trakke/1.0 lene.zachariassen@gmail.com'
  private readonly cache = new Map<string, { data: WeatherData; expires: number }>()
  private readonly localStorageKey = 'trakke_weather_cache'
  private readonly rateLimitDelay = 100 // 100ms minimum between requests (10 req/sec max)
  private lastRequestTime = 0
  private retryCount = 0
  private readonly maxRetries = 3

  /**
   * Load cache from localStorage on initialization
   */
  constructor() {
    this.loadCacheFromStorage()
  }

  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.localStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'object' && value && 'expires' in value && 'data' in value) {
            const cacheEntry = value as { data: WeatherData; expires: number }
            // Only load non-expired entries
            if (Date.now() < cacheEntry.expires) {
              this.cache.set(key, cacheEntry)
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load weather cache from localStorage:', error)
    }
  }

  private saveCacheToStorage(): void {
    try {
      const cacheObject = Object.fromEntries(this.cache.entries())
      localStorage.setItem(this.localStorageKey, JSON.stringify(cacheObject))
    } catch (error) {
      console.warn('Failed to save weather cache to localStorage:', error)
    }
  }

  /**
   * Henter værdata for gitt posisjon fra YR.no LocationForecast API
   */
  async getWeatherData(lat: number, lng: number, altitude?: number): Promise<WeatherData | null> {
    // Don't make requests when app is not in focus to reduce API traffic
    if (typeof document !== 'undefined' && document.hidden) {
      console.log('⏸️ App not in focus, skipping weather request')
      return null
    }
    
    // Truncate coordinates to 4 decimal places as recommended
    const truncatedLat = Math.round(lat * 10000) / 10000
    const truncatedLng = Math.round(lng * 10000) / 10000
    
    const cacheKey = `${truncatedLat},${truncatedLng},${altitude || 0}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() < cached.expires) {
      return cached.data
    }

    try {
      // Rate limiting with random jitter to prevent synchronized requests
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      const randomJitter = Math.random() * 50 // 0-50ms random delay
      const totalDelay = this.rateLimitDelay + randomJitter
      
      if (timeSinceLastRequest < totalDelay) {
        await new Promise(resolve => setTimeout(resolve, totalDelay - timeSinceLastRequest))
      }

      const url = this.buildApiUrl(truncatedLat, truncatedLng, altitude)
      
      // Prepare headers with conditional request support
      const headers: Record<string, string> = {
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip'
      }
      
      // Add If-Modified-Since header if we have cached data
      if (cached && cached.data.lastUpdated) {
        headers['If-Modified-Since'] = new Date(cached.data.lastUpdated).toUTCString()
      }
      
      const response = await fetch(url, { headers })

      this.lastRequestTime = Date.now()

      // Handle 304 Not Modified - return cached data
      if (response.status === 304) {
        console.log('📦 Weather data not modified, using cached version')
        return cached ? cached.data : null
      }

      if (!response.ok) {
        if (response.status === 403) {
          console.error('🚨 MET API: Forbidden - User-Agent may be blocked. Contact: lene.zachariassen@gmail.com')
          throw new Error(`MET API Forbidden: ${response.status}`)
        } else if (response.status === 429) {
          console.error('🚨 MET API: Rate limited - implementing exponential backoff')
          
          // Exponential backoff for 429 responses
          if (this.retryCount < this.maxRetries) {
            const backoffDelay = Math.pow(2, this.retryCount) * 1000 + Math.random() * 1000 // 1s, 2s, 4s + jitter
            console.log(`⏳ Retrying after ${backoffDelay}ms (attempt ${this.retryCount + 1}/${this.maxRetries})`)
            
            this.retryCount++
            await new Promise(resolve => setTimeout(resolve, backoffDelay))
            
            // Recursive retry
            return this.getWeatherData(lat, lng, altitude)
          } else {
            this.retryCount = 0 // Reset for next request
            throw new Error(`MET API Rate Limited: Exceeded max retries`)
          }
        }
        throw new Error(`MET API error: ${response.status} ${response.statusText}`)
      }
      
      // Reset retry count on successful response
      this.retryCount = 0

      const data: YRNoResponse = await response.json()
      const weatherData = this.transformResponse(data, truncatedLat, truncatedLng, altitude)
      
      // Cache with expiration based on Expires header or default 1 hour
      const expiresHeader = response.headers.get('Expires')
      const expiresTime = expiresHeader 
        ? new Date(expiresHeader).getTime() 
        : Date.now() + (60 * 60 * 1000) // 1 hour default

      this.cache.set(cacheKey, {
        data: weatherData,
        expires: expiresTime
      })
      
      // Save to localStorage for persistent caching
      this.saveCacheToStorage()

      return weatherData

    } catch (error) {
      console.error('Error fetching weather data:', error)
      return null
    }
  }

  /**
   * Henter værsammendrag for enkel visning i UI
   */
  async getWeatherSummary(lat: number, lng: number, altitude?: number): Promise<WeatherSummary | null> {
    const weatherData = await this.getWeatherData(lat, lng, altitude)
    if (!weatherData || weatherData.forecast.length === 0) {
      return null
    }

    // Use current weather or first forecast entry
    const currentWeather = weatherData.current || weatherData.forecast[0]
    return this.createWeatherSummary(currentWeather)
  }

  /**
   * Bygger API URL med parametere
   */
  private buildApiUrl(lat: number, lng: number, altitude?: number): string {
    let url = `${this.baseUrl}/compact?lat=${lat}&lon=${lng}`
    if (altitude !== undefined) {
      url += `&altitude=${altitude}`
    }
    return url
  }

  /**
   * Transformerer YR.no respons til vårt WeatherData format
   */
  private transformResponse(response: YRNoResponse, lat: number, lng: number, altitude?: number): WeatherData {
    const timeseries = response.properties.timeseries
    
    return {
      location: {
        lat,
        lng,
        altitude
      },
      current: timeseries.length > 0 ? timeseries[0] : undefined,
      forecast: timeseries.slice(0, 24), // Next 24 hours
      lastUpdated: response.properties.meta.updated_at,
      source: 'yr_no'
    }
  }

  /**
   * Lager WeatherSummary fra WeatherTimeseries
   */
  private createWeatherSummary(weather: WeatherTimeseries): WeatherSummary {
    const details = weather.data.instant.details
    const symbolCode = weather.data.next_1_hours?.summary.symbol_code || 
                      weather.data.next_6_hours?.summary.symbol_code || 
                      'clearsky_day'
    
    const precipitation = weather.data.next_1_hours?.details.precipitation_amount || 
                         weather.data.next_6_hours?.details.precipitation_amount || 
                         0

    const symbol = WEATHER_SYMBOLS[symbolCode] || DEFAULT_WEATHER_SYMBOL

    return {
      temperature: Math.round(details.air_temperature),
      symbol: symbol.icon,
      symbolCode,
      precipitation,
      windSpeed: Math.round(details.wind_speed * 3.6), // m/s to km/h
      windDirection: details.wind_from_direction,
      humidity: Math.round(details.relative_humidity),
      description: symbol.description,
      time: weather.time
    }
  }

  /**
   * Rydder utløpt cache
   */
  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now >= value.expires) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Sjekker om værsymbol indikerer bra vær for utendørsaktiviteter
   */
  isGoodWeatherForOutdoors(symbolCode: string): boolean {
    const goodWeatherSymbols = [
      'clearsky_day',
      'clearsky_night', 
      'fair_day',
      'fair_night',
      'partlycloudy_day',
      'partlycloudy_night'
    ]
    return goodWeatherSymbols.includes(symbolCode)
  }

  /**
   * Gir anbefaling for utendørsaktivitet basert på vær
   */
  getOutdoorRecommendation(summary: WeatherSummary): {
    suitable: boolean
    recommendation: string
    warnings: string[]
  } {
    const warnings: string[] = []
    let suitable = true
    let recommendation = 'Gode forhold for utendørsaktiviteter'

    // Temperature warnings
    if (summary.temperature < 0) {
      warnings.push('Temperaturer under frysepunktet')
      recommendation = 'Pass på klær og utstyr for kaldt vær'
    } else if (summary.temperature > 25) {
      warnings.push('Høye temperaturer')
      recommendation = 'Husk solkrem og tilstrekkelig væske'
    }

    // Precipitation warnings
    if (summary.precipitation > 1) {
      warnings.push('Nedbør forventet')
      suitable = false
      recommendation = 'Vurder regntøy eller utsett turen'
    } else if (summary.precipitation > 0.1) {
      warnings.push('Lett nedbør mulig')
      recommendation = 'Vurder å ta med regntøy'
    }

    // Wind warnings
    if (summary.windSpeed > 40) {
      warnings.push('Sterk vind')
      suitable = false
      recommendation = 'Ikke anbefalt å være utendørs'
    } else if (summary.windSpeed > 20) {
      warnings.push('Frisk vind')
      recommendation = 'Vær oppmerksom på vindforhold'
    }

    // Thunder/severe weather
    if (summary.symbolCode.includes('thunder')) {
      warnings.push('Torden i området')
      suitable = false
      recommendation = 'Søk ly og utsett utendørsaktiviteter'
    }

    return {
      suitable,
      recommendation,
      warnings
    }
  }
}
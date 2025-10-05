/**
 * Service for fetching public transport stop data from Entur API
 * Entur operates Norway's national public transport registry
 *
 * API Documentation: https://developer.entur.org/pages-geocoder-api/
 * License: NLOD (Norwegian License for Open Government Data)
 */

export interface EnturStop {
  id: string // NSR:StopPlace:XXXXX
  name: string
  type: 'bus' | 'train' | 'tram' | 'metro' | 'ferry'
  lat: number
  lng: number
  locality?: string // City/area name
  category: string // Entur category
}

export interface StopBounds {
  north: number
  south: number
  east: number
  west: number
}

interface EnturFeature {
  type: string
  geometry: {
    type: string
    coordinates: [number, number]
  }
  properties: {
    id?: string
    name?: string
    label?: string
    category?: string[]
    locality?: string
    layer?: string
  }
}

interface EnturResponse {
  type: string
  features: EnturFeature[]
}

export class EnturService {
  private static readonly GEOCODER_URL = 'https://api.entur.io/geocoder/v1'
  private static readonly CLIENT_NAME = 'trakke-norwegian-outdoor-app'
  private static readonly CACHE_DURATION = 15 * 60 * 1000 // 15 minutes
  private static cache = new Map<string, { data: EnturStop[], timestamp: number }>()

  /**
   * Fetch bus stops within bounds
   */
  static async fetchBusStops(bounds: StopBounds): Promise<EnturStop[]> {
    console.log('🚌 Fetching bus stops from Entur API...')
    // Use multiple search terms to get comprehensive coverage
    return this.fetchStopsMultipleSearches(bounds, ['venue'], ['onstreetBus', 'busStation'])
  }

  /**
   * Fetch train stations within bounds
   */
  static async fetchTrainStations(bounds: StopBounds): Promise<EnturStop[]> {
    console.log('🚂 Fetching train stations from Entur API...')
    return this.fetchStopsMultipleSearches(bounds, ['venue'], ['railStation'])
  }

  /**
   * Fetch stops using multiple search terms and combine results
   * This overcomes the limitation that Entur requires a search text
   *
   * Optimizations:
   * - Parallel requests for speed
   * - Combined cache key for all searches
   * - Deduplication by stop ID
   */
  private static async fetchStopsMultipleSearches(
    bounds: StopBounds,
    layers: string[],
    stopTypes: string[]
  ): Promise<EnturStop[]> {
    // Check combined cache first
    const combinedCacheKey = `combined_${stopTypes.join(',')}_${bounds.north},${bounds.south},${bounds.east},${bounds.west}`
    const cached = this.cache.get(combinedCacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`🗄️ Using cached Entur data (${cached.data.length} stops)`)
      return cached.data
    }

    // Use common Norwegian letters/terms to get good coverage
    const searchTerms = ['a', 'b', 's', 'o', 'e']

    // **OPTIMIZATION: Run all searches in parallel instead of sequential**
    const searchPromises = searchTerms.map(term =>
      this.fetchStops(bounds, layers, stopTypes, term)
    )

    try {
      const results = await Promise.all(searchPromises)

      // Deduplicate by ID across all results
      const allStops = new Map<string, EnturStop>()
      results.forEach(stops => {
        stops.forEach(stop => {
          allStops.set(stop.id, stop)
        })
      })

      const uniqueStops = Array.from(allStops.values())
      console.log(`📊 Combined ${uniqueStops.length} unique stops from ${searchTerms.length} parallel searches`)

      // Cache the combined result
      this.cache.set(combinedCacheKey, { data: uniqueStops, timestamp: Date.now() })

      return uniqueStops
    } catch (error) {
      console.error('❌ Error in parallel searches:', error)
      return []
    }
  }

  /**
   * Generic method to fetch stops by category
   * Uses Entur's /autocomplete endpoint with a search term and bounding box
   */
  private static async fetchStops(
    bounds: StopBounds,
    layers: string[],
    stopTypes: string[],
    searchTerm: string
  ): Promise<EnturStop[]> {
    const cacheKey = `${searchTerm}_${stopTypes.join(',')}_${bounds.north},${bounds.south},${bounds.east},${bounds.west}`

    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`🗄️ Using cached Entur data (${cached.data.length} stops)`)
      return cached.data
    }

    try {
      // Use center point of bounds for reverse geocoding
      const centerLat = (bounds.north + bounds.south) / 2
      const centerLon = (bounds.east + bounds.west) / 2

      // Calculate radius from center to corner (in meters, approximate)
      const latDiff = bounds.north - centerLat
      const lonDiff = bounds.east - centerLon
      const radiusKm = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111 // 1 degree ≈ 111km
      const _radiusMeters = Math.min(radiusKm * 1000, 100000) // Cap at 100km radius (unused but kept for reference)

      // Entur geocoder autocomplete endpoint with bounding box
      // We'll filter by category in parseEnturResponse
      const params = new URLSearchParams({
        'text': searchTerm,
        'focus.point.lat': String(centerLat),
        'focus.point.lon': String(centerLon),
        'layers': layers.join(','),
        'size': '500', // Max results per search
        'boundary.rect.min_lat': String(bounds.south),
        'boundary.rect.min_lon': String(bounds.west),
        'boundary.rect.max_lat': String(bounds.north),
        'boundary.rect.max_lon': String(bounds.east)
      })

      const url = `${this.GEOCODER_URL}/autocomplete?${params.toString()}`

      console.log('📡 Entur API request:', url)

      const response = await fetch(url, {
        headers: {
          'ET-Client-Name': this.CLIENT_NAME,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Entur API error: ${response.status} ${response.statusText}`)
      }

      const data: EnturResponse = await response.json()
      const stops = this.parseEnturResponse(data, stopTypes)

      // Cache the results
      this.cache.set(cacheKey, { data: stops, timestamp: Date.now() })

      console.log(`✅ Fetched ${stops.length} stops from Entur (${stopTypes.join(', ')})`)
      return stops

    } catch (error) {
      console.error('❌ Error fetching Entur stops:', error)
      // Return empty array on error - don't break the app
      return []
    }
  }

  /**
   * Parse Entur API response to our POI format
   */
  private static parseEnturResponse(data: EnturResponse, stopTypes: string[]): EnturStop[] {
    if (!data.features || !Array.isArray(data.features)) {
      console.warn('⚠️ No features in Entur response')
      return []
    }

    const stops = data.features
      .filter((feature) => {
        // Filter by stop type
        const category = feature.properties?.category?.[0] || ''
        return stopTypes.some(type => category.toLowerCase().includes(type.toLowerCase()))
      })
      .map((feature) => {
        const props = feature.properties
        const coords = feature.geometry?.coordinates

        if (!coords || coords.length !== 2) {
          return null
        }

        // Determine type from category
        let type: 'bus' | 'train' | 'tram' | 'metro' | 'ferry' = 'bus'
        const category = props.category?.[0] || ''
        const lowerCategory = category.toLowerCase()

        if (lowerCategory.includes('rail') || lowerCategory.includes('station')) {
          type = 'train'
        } else if (lowerCategory.includes('tram')) {
          type = 'tram'
        } else if (lowerCategory.includes('metro')) {
          type = 'metro'
        } else if (lowerCategory.includes('ferry')) {
          type = 'ferry'
        }

        // Use label for display name, fallback to name
        const displayName = props.label || props.name || 'Unnamed stop'

        const enturStop: EnturStop = {
          id: props.id || `entur_${coords[1]}_${coords[0]}`,
          name: displayName,
          type,
          lat: coords[1],
          lng: coords[0],
          locality: props.locality,
          category: category
        }
        return enturStop
      })
      .filter((stop): stop is EnturStop => stop !== null)

    console.log(`📊 Parsed ${stops.length} valid stops from ${data.features.length} features`)
    return stops
  }

  /**
   * Clear cache (useful for debugging)
   */
  static clearCache(): void {
    this.cache.clear()
    console.log('🗑️ Entur cache cleared')
  }
}

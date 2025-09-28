// Turrutebasen WFS Service - Norwegian National Trail Database
// Integrates with Geonorge's official WFS endpoint for trail data

import type {
  Trail,
  TrailSearchQuery,
  TrailSearchResult,
  BoundingBox,
  TurrutebasenResponse,
  ElevationPoint,
  PlannedRoute,
  RoutePreferences
} from '../data/trails'
import { TrailUtils } from '../data/trails'
import { ElevationService } from './elevationService'

export class TurrutebasenService {

  // WFS endpoints for Turrutebasen (try in order)
  private static readonly WFS_ENDPOINTS = [
    'https://wfs.geonorge.no/skwms1/wfs.turrutebasen',
    'https://ws.geonorge.no/SKWMS1/wfs.turrutebasen',
    'https://openwfs.statkart.no/skwms1/wfs.turrutebasen'
  ]
  private static readonly WFS_VERSION = '2.0.0'

  // Feature type names in Turrutebasen WFS
  private static readonly FEATURE_TYPES = {
    trails: 'turrutebasen:turrute',
    waypoints: 'turrutebasen:turmerkepunkt',
    facilities: 'turrutebasen:turanlegg'
  } as const

  // Cache for trail data to reduce API calls
  private static trailCache = new Map<string, Trail>()
  private static cacheTimestamp = new Map<string, number>()
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Test WFS service connectivity
   */
  static async checkServiceAvailability(): Promise<boolean> {
    try {
      const response = await fetch(this.buildGetCapabilitiesURL(), {
        method: 'HEAD',
        headers: this.getStandardHeaders()
      })

      console.log(`🔍 Turrutebasen WFS service status: ${response.status}`)
      return response.ok
    } catch (error) {
      console.error('❌ Turrutebasen service unavailable:', error)
      return false
    }
  }

  /**
   * Get service capabilities and metadata
   */
  static async getServiceCapabilities(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(this.buildGetCapabilitiesURL(), {
        headers: this.getStandardHeaders()
      })

      if (!response.ok) {
        throw new Error(`WFS GetCapabilities failed: ${response.status}`)
      }

      const xml = await response.text()
      console.log('📋 Turrutebasen capabilities retrieved')
      return xml
    } catch (error) {
      console.error('❌ Failed to get service capabilities:', error)
      throw error
    }
  }

  /**
   * Fetch trails within a geographic bounding box
   */
  static async fetchTrailsInBounds(bounds: BoundingBox, options?: {
    maxFeatures?: number
    types?: string[]
  }): Promise<Trail[]> {
    console.log('🥾 Fetching trails from Turrutebasen for bounds:', bounds)

    // Try multiple endpoints
    for (let i = 0; i < this.WFS_ENDPOINTS.length; i++) {
      const endpoint = this.WFS_ENDPOINTS[i]
      try {
        console.log(`🔄 Trying endpoint ${i + 1}/${this.WFS_ENDPOINTS.length}: ${endpoint}`)

        // Build WFS GetFeature request
        const url = this.buildGetFeatureURL({
          bbox: bounds,
          maxFeatures: options?.maxFeatures || 100,
          featureType: this.FEATURE_TYPES.trails
        }, endpoint)

        console.log('📡 WFS Request URL:', url)

        const response = await fetch(url, {
          headers: this.getStandardHeaders()
        })

        if (!response.ok) {
          if (response.status === 503) {
            console.warn(`⚠️ Endpoint ${endpoint} temporarily unavailable (503)`)
            continue // Try next endpoint
          }
          throw new Error(`WFS request failed: ${response.status} ${response.statusText}`)
        }

        // Check if response is JSON or XML
        const contentType = response.headers.get('content-type') || ''
        let data: TurrutebasenResponse

        if (contentType.includes('application/json')) {
          data = await response.json()
        } else {
          // Handle XML response or other formats
          const text = await response.text()
          console.warn('⚠️ Received non-JSON response:', text.substring(0, 200) + '...')

          // For now, try next endpoint when we get XML
          // TODO: Implement XML parsing if needed
          console.warn('⚠️ XML response handling not implemented yet, trying next endpoint')
          continue
        }

        console.log(`✅ Retrieved ${data.features?.length || 0} trail features from ${endpoint}`)

        // Convert WFS features to Trail objects
        const trails = data.features.map(feature => {
          const trail = TrailUtils.convertFromTurrutebasen(feature)

          // Cache the trail data
          this.trailCache.set(trail.id, trail)
          this.cacheTimestamp.set(trail.id, Date.now())

          return trail
        })

        return trails

      } catch (error) {
        console.error(`❌ Failed to fetch trails from ${endpoint}:`, error)

        // Continue to next endpoint if available
        if (i < this.WFS_ENDPOINTS.length - 1) {
          console.log('🔄 Trying next endpoint...')
          continue
        }
      }
    }

    // All endpoints failed - provide demo trails for testing
    console.error('❌ All Turrutebasen endpoints failed, using demo trails')
    return this.getDemoTrails(bounds)
  }

  /**
   * Get detailed trail information by ID
   */
  static async getTrailById(id: string): Promise<Trail | null> {
    // Check cache first
    const cached = this.trailCache.get(id)
    const cacheTime = this.cacheTimestamp.get(id)

    if (cached && cacheTime && (Date.now() - cacheTime) < this.CACHE_DURATION) {
      console.log(`📋 Returning cached trail: ${id}`)
      return cached
    }

    try {
      const url = this.buildGetFeatureURL({
        featureId: id,
        featureType: this.FEATURE_TYPES.trails
      })

      const response = await fetch(url, {
        headers: this.getStandardHeaders()
      })

      if (!response.ok) {
        console.warn(`⚠️ Trail ${id} not found: ${response.status}`)
        return null
      }

      const data: TurrutebasenResponse = await response.json()

      if (!data.features || data.features.length === 0) {
        console.warn(`⚠️ No trail data found for ID: ${id}`)
        return null
      }

      const trail = TrailUtils.convertFromTurrutebasen(data.features[0])

      // Cache the result
      this.trailCache.set(trail.id, trail)
      this.cacheTimestamp.set(trail.id, Date.now())

      console.log(`✅ Retrieved trail: ${trail.properties.name}`)
      return trail

    } catch (error) {
      console.error(`❌ Failed to fetch trail ${id}:`, error)
      return null
    }
  }

  /**
   * Search trails by criteria
   */
  static async searchTrails(query: TrailSearchQuery): Promise<TrailSearchResult> {
    console.log('🔍 Searching trails with criteria:', query)

    const startTime = Date.now()

    try {
      // Build CQL filter for WFS query
      const filter = this.buildCQLFilter(query)

      const url = this.buildGetFeatureURL({
        bbox: query.bounds,
        maxFeatures: query.limit || 50,
        featureType: this.FEATURE_TYPES.trails,
        filter
      })

      const response = await fetch(url, {
        headers: this.getStandardHeaders()
      })

      if (!response.ok) {
        throw new Error(`Trail search failed: ${response.status}`)
      }

      const data: TurrutebasenResponse = await response.json()
      const trails = data.features.map(feature => TrailUtils.convertFromTurrutebasen(feature))

      // Apply client-side filters that WFS doesn't support
      const filteredTrails = this.applyClientSideFilters(trails, query)

      const searchTime = Date.now() - startTime

      console.log(`✅ Trail search completed: ${filteredTrails.length} results in ${searchTime}ms`)

      return {
        trails: filteredTrails,
        totalCount: data.numberReturned || filteredTrails.length,
        searchTime
      }

    } catch (error) {
      console.error('❌ Trail search failed:', error)

      return {
        trails: [],
        totalCount: 0,
        searchTime: Date.now() - startTime
      }
    }
  }

  /**
   * Get elevation profile for a trail using Kartverket elevation API
   */
  static async getElevationProfile(trail: Trail, resolution = 50): Promise<ElevationPoint[]> {
    console.log(`📈 Fetching elevation profile for trail: ${trail.properties.name}`)

    try {
      const coords = trail.geometry.coordinates
      if (!coords || coords.length < 2) {
        console.warn('⚠️ Invalid trail geometry for elevation profile')
        return []
      }

      // Use real Kartverket elevation API
      const elevationProfile = await ElevationService.generateElevationProfile(coords, resolution)

      console.log(`✅ Generated elevation profile with ${elevationProfile.length} points using Kartverket API`)
      return elevationProfile

    } catch (error) {
      console.error('❌ Failed to generate elevation profile:', error)
      return []
    }
  }

  /**
   * Plan a route between points using existing trails
   */
  static async planRoute(start: { lat: number; lng: number }, end: { lat: number; lng: number }, preferences?: RoutePreferences): Promise<PlannedRoute | null> {
    console.log('🗺️ Planning route from', start, 'to', end)

    try {
      // Find trails near start and end points
      const searchRadius = 0.01 // ~1km in degrees

      const startBounds = {
        north: start.lat + searchRadius,
        south: start.lat - searchRadius,
        east: start.lng + searchRadius,
        west: start.lng - searchRadius
      }

      const endBounds = {
        north: end.lat + searchRadius,
        south: end.lat - searchRadius,
        east: end.lng + searchRadius,
        west: end.lng - searchRadius
      }

      // Find trails in both areas
      const [startTrails, endTrails] = await Promise.all([
        this.fetchTrailsInBounds(startBounds, { maxFeatures: 20 }),
        this.fetchTrailsInBounds(endBounds, { maxFeatures: 20 })
      ])

      // Simple route planning - find connecting trails
      // This is a basic implementation; a full implementation would use graph algorithms
      const route = this.findSimpleRoute(startTrails, endTrails, start, end, preferences)

      if (route) {
        console.log(`✅ Route planned with ${route.trails.length} trail segments`)
        return route
      } else {
        console.log('⚠️ No route found between specified points')
        return null
      }

    } catch (error) {
      console.error('❌ Route planning failed:', error)
      return null
    }
  }

  // Private helper methods

  private static buildGetCapabilitiesURL(baseUrl?: string): string {
    const params = new URLSearchParams({
      service: 'WFS',
      version: this.WFS_VERSION,
      request: 'GetCapabilities'
    })

    const endpoint = baseUrl || this.WFS_ENDPOINTS[0]
    return `${endpoint}?${params.toString()}`
  }

  private static buildGetFeatureURL(options: {
    featureType: string
    bbox?: BoundingBox
    featureId?: string
    maxFeatures?: number
    filter?: string
  }, baseUrl?: string): string {
    const params = new URLSearchParams({
      service: 'WFS',
      version: this.WFS_VERSION,
      request: 'GetFeature',
      typeName: options.featureType,
      outputFormat: 'application/json',
      srsName: 'EPSG:4326'
    })

    if (options.bbox) {
      params.set('bbox', `${options.bbox.west},${options.bbox.south},${options.bbox.east},${options.bbox.north}`)
    }

    if (options.featureId) {
      params.set('featureID', options.featureId)
    }

    if (options.maxFeatures) {
      params.set('maxFeatures', options.maxFeatures.toString())
    }

    if (options.filter) {
      params.set('cql_filter', options.filter)
    }

    const endpoint = baseUrl || this.WFS_ENDPOINTS[0]
    return `${endpoint}?${params.toString()}`
  }

  private static buildCQLFilter(query: TrailSearchQuery): string | undefined {
    const filters: string[] = []

    if (query.text) {
      // Search in trail name and description
      const searchText = query.text.replace(/'/g, "''") // Escape quotes
      filters.push(`(turrutenavn ILIKE '%${searchText}%' OR beskrivelse ILIKE '%${searchText}%')`)
    }

    if (query.types && query.types.length > 0) {
      const typeFilters = query.types.map(type => {
        switch (type) {
          case 'hiking': return "rutetype ILIKE '%fot%' OR rutetype ILIKE '%gå%'"
          case 'skiing': return "rutetype ILIKE '%ski%'"
          case 'cycling': return "rutetype ILIKE '%sykkel%'"
          default: return null
        }
      }).filter(Boolean)

      if (typeFilters.length > 0) {
        filters.push(`(${typeFilters.join(' OR ')})`)
      }
    }

    if (query.municipalities && query.municipalities.length > 0) {
      const municipalityFilter = query.municipalities.map(m => `kommune='${m}'`).join(' OR ')
      filters.push(`(${municipalityFilter})`)
    }

    if (query.minDistance) {
      filters.push(`rutelengde >= ${query.minDistance}`)
    }

    if (query.maxDistance) {
      filters.push(`rutelengde <= ${query.maxDistance}`)
    }

    return filters.length > 0 ? filters.join(' AND ') : undefined
  }

  private static applyClientSideFilters(trails: Trail[], query: TrailSearchQuery): Trail[] {
    let filtered = trails

    // Apply difficulty filter
    if (query.difficulties && query.difficulties.length > 0) {
      filtered = filtered.filter(trail => query.difficulties!.includes(trail.properties.difficulty))
    }

    // Apply elevation filters
    if (query.minElevationGain !== undefined) {
      filtered = filtered.filter(trail => (trail.properties.elevationGain || 0) >= query.minElevationGain!)
    }

    if (query.maxElevationGain !== undefined) {
      filtered = filtered.filter(trail => (trail.properties.elevationGain || 0) <= query.maxElevationGain!)
    }

    // Apply facilities filter
    if (query.facilities && query.facilities.length > 0) {
      filtered = filtered.filter(trail => {
        const trailFacilities = trail.properties.facilities || []
        return query.facilities!.every(facility => trailFacilities.includes(facility))
      })
    }

    // Apply season filter
    if (query.season) {
      filtered = filtered.filter(trail => {
        const seasons = trail.properties.season || []
        return seasons.includes(query.season!)
      })
    }

    return filtered
  }


  private static findSimpleRoute(startTrails: Trail[], endTrails: Trail[], start: { lat: number; lng: number }, end: { lat: number; lng: number }, _preferences?: RoutePreferences): PlannedRoute | null {
    // Simple route planning - find the closest trail to both points
    // In a full implementation, this would use proper graph algorithms

    if (startTrails.length === 0 || endTrails.length === 0) {
      return null
    }

    // Find closest trail to start point
    const startTrail = startTrails[0] // Simplified selection

    // Calculate basic route properties
    const totalDistance = startTrail.properties.distance
    const totalElevationGain = startTrail.properties.elevationGain || 0

    return {
      id: `route_${Date.now()}`,
      trails: [startTrail],
      waypoints: [
        { lat: start.lat, lng: start.lng, type: 'start' },
        { lat: end.lat, lng: end.lng, type: 'end' }
      ],
      properties: {
        totalDistance,
        totalElevationGain,
        totalElevationLoss: startTrail.properties.elevationLoss || 0,
        estimatedTime: Math.round(totalDistance / 1000 * 20), // 20 min/km rough estimate
        difficulty: startTrail.properties.difficulty,
        surface: [startTrail.properties.surface || 'dirt']
      },
      elevationProfile: [], // Would be populated from elevation API
      warnings: [],
      created: new Date().toISOString()
    }
  }

  private static getStandardHeaders(): HeadersInit {
    return {
      'User-Agent': 'Tråkke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)',
      'Accept': 'application/json, application/xml, text/xml',
      'Cache-Control': 'no-cache'
    }
  }

  /**
   * Generate demo trails for testing when WFS is unavailable
   */
  private static getDemoTrails(bounds: BoundingBox): Trail[] {
    console.log('🎯 Generating demo trails for bounds:', bounds)

    // Only show demo trails if the bounding box is in Norway (roughly)
    if (bounds.north < 55 || bounds.south > 75 || bounds.west < 0 || bounds.east > 35) {
      return []
    }

    const centerLat = (bounds.north + bounds.south) / 2
    const centerLng = (bounds.west + bounds.east) / 2

    const demoTrails: Trail[] = [
      {
        id: 'demo-hike-1',
        geometry: {
          type: 'LineString',
          coordinates: [
            [centerLng - 0.005, centerLat - 0.005],
            [centerLng - 0.003, centerLat - 0.002],
            [centerLng, centerLat],
            [centerLng + 0.003, centerLat + 0.002],
            [centerLng + 0.005, centerLat + 0.005]
          ]
        },
        properties: {
          name: 'Demo Fottur',
          type: 'hiking',
          difficulty: 'medium',
          distance: 1200,
          municipality: 'Demo Kommune',
          county: 'Demo Fylke',
          description: 'En demo fottur for testing av trail overlay systemet.',
          surface: 'dirt',
          maintainer: 'Demo Turlag'
        },
        metadata: {
          source: 'local',
          sourceId: 'demo-1',
          lastUpdated: new Date().toISOString(),
          dataQuality: 0.8,
          verified: false
        }
      },
      {
        id: 'demo-ski-1',
        geometry: {
          type: 'LineString',
          coordinates: [
            [centerLng - 0.008, centerLat],
            [centerLng - 0.006, centerLat + 0.001],
            [centerLng - 0.004, centerLat + 0.003],
            [centerLng - 0.002, centerLat + 0.004],
            [centerLng, centerLat + 0.005],
            [centerLng + 0.002, centerLat + 0.006]
          ]
        },
        properties: {
          name: 'Demo Skiløype',
          type: 'skiing',
          difficulty: 'easy',
          distance: 1800,
          municipality: 'Demo Kommune',
          county: 'Demo Fylke',
          description: 'En demo skiløype for testing av trail overlay systemet.',
          surface: 'snow',
          maintainer: 'Demo Skiforening'
        },
        metadata: {
          source: 'local',
          sourceId: 'demo-2',
          lastUpdated: new Date().toISOString(),
          dataQuality: 0.9,
          verified: false
        }
      },
      {
        id: 'demo-cycle-1',
        geometry: {
          type: 'LineString',
          coordinates: [
            [centerLng - 0.002, centerLat - 0.008],
            [centerLng - 0.001, centerLat - 0.006],
            [centerLng + 0.001, centerLat - 0.004],
            [centerLng + 0.003, centerLat - 0.002],
            [centerLng + 0.004, centerLat],
            [centerLng + 0.005, centerLat + 0.002]
          ]
        },
        properties: {
          name: 'Demo Sykkelrute',
          type: 'cycling',
          difficulty: 'hard',
          distance: 2500,
          municipality: 'Demo Kommune',
          county: 'Demo Fylke',
          description: 'En demo sykkelrute for testing av trail overlay systemet.',
          surface: 'gravel',
          maintainer: 'Demo Sykkelklubb'
        },
        metadata: {
          source: 'local',
          sourceId: 'demo-3',
          lastUpdated: new Date().toISOString(),
          dataQuality: 0.7,
          verified: false
        }
      }
    ]

    console.log(`🎯 Generated ${demoTrails.length} demo trails`)
    return demoTrails
  }

  /**
   * Clear cached trail data
   */
  static clearCache(): void {
    this.trailCache.clear()
    this.cacheTimestamp.clear()
    console.log('🗑️ Trail cache cleared')
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      totalEntries: this.trailCache.size,
      cacheHits: 0, // Would track this in production
      cacheMisses: 0 // Would track this in production
    }
  }
}
// Kartverket Elevation Service
// Integrates with official Geonorge elevation API for height data

import type { ElevationPoint } from '../data/trails'

interface ElevationApiResponse {
  punkter: Array<{
    nord: number
    ost: number
    hoydeType: string
    hoyde: number
    noyaktighetsklasse: number
    terrengtype: string
    datafeil?: string
  }>
}

interface ElevationQueryPoint {
  lat: number
  lng: number
  distance?: number
}

export class ElevationService {

  private static readonly API_BASE_URL = 'https://ws.geonorge.no/hoydedata/v1'
  private static readonly COORDINATE_SYSTEM = 'EPSG:4326' // WGS84
  private static readonly MAX_POINTS_PER_REQUEST = 50

  /**
   * Get elevation for a single point
   */
  static async getElevation(lat: number, lng: number): Promise<number | null> {
    try {
      const params = new URLSearchParams({
        koordsys: this.COORDINATE_SYSTEM,
        nord: lat.toString(),
        ost: lng.toString(),
        geojson: 'false'
      })

      const response = await fetch(`${this.API_BASE_URL}/punkt?${params.toString()}`, {
        headers: {
          'User-Agent': 'Tråkke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn(`⚠️ Elevation API request failed: ${response.status}`)
        return null
      }

      const data: ElevationApiResponse = await response.json()

      if (data.punkter && data.punkter.length > 0) {
        const point = data.punkter[0]
        if (point.datafeil) {
          console.warn(`⚠️ Elevation data error: ${point.datafeil}`)
          return null
        }
        return point.hoyde
      }

      return null
    } catch (error) {
      console.error('❌ Failed to get elevation:', error)
      return null
    }
  }

  /**
   * Get elevation for multiple points (batch request)
   */
  static async getElevations(points: Array<{ lat: number; lng: number }>): Promise<Array<number | null>> {
    if (points.length === 0) return []

    try {
      // Split into batches if necessary
      const batches = this.chunkArray(points, this.MAX_POINTS_PER_REQUEST)
      const results: Array<number | null> = []

      for (const batch of batches) {
        const batchResults = await this.fetchElevationBatch(batch)
        results.push(...batchResults)
      }

      return results
    } catch (error) {
      console.error('❌ Failed to get batch elevations:', error)
      return points.map(() => null)
    }
  }

  /**
   * Generate elevation profile for a trail
   */
  static async generateElevationProfile(
    coordinates: number[][],
    resolution: number = 50
  ): Promise<ElevationPoint[]> {
    console.log(`📈 Generating elevation profile for ${coordinates.length} coordinates, resolution: ${resolution}`)

    if (!coordinates || coordinates.length < 2) {
      console.warn('⚠️ Invalid coordinates for elevation profile')
      return []
    }

    try {
      // Sample points along the trail based on resolution
      const samplePoints = this.sampleTrailPoints(coordinates, resolution)
      console.log(`📊 Sampled ${samplePoints.length} points from ${coordinates.length} coordinates`)

      // Get elevations for sampled points
      const elevationRequests = samplePoints.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      }))

      const elevations = await this.getElevations(elevationRequests)

      // Calculate distances and build elevation profile
      const elevationProfile: ElevationPoint[] = []
      let totalDistance = 0

      for (let i = 0; i < samplePoints.length; i++) {
        const [lng, lat] = samplePoints[i]
        const elevation = elevations[i]

        // Calculate distance from start
        if (i > 0) {
          const [prevLng, prevLat] = samplePoints[i - 1]
          totalDistance += this.haversineDistance(prevLat, prevLng, lat, lng)
        }

        // Only add point if we have valid elevation data
        if (elevation !== null) {
          elevationProfile.push({
            distance: totalDistance,
            elevation,
            lat,
            lng
          })
        }
      }

      console.log(`✅ Generated elevation profile with ${elevationProfile.length} valid points`)
      return elevationProfile

    } catch (error) {
      console.error('❌ Failed to generate elevation profile:', error)
      return []
    }
  }

  /**
   * Get available data sources from Kartverket
   */
  static async getDataSources(): Promise<any[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/datakilder`, {
        headers: {
          'User-Agent': 'Tråkke Norwegian Outdoor App',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get data sources: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Failed to get elevation data sources:', error)
      return []
    }
  }

  // Private helper methods

  private static async fetchElevationBatch(points: Array<{ lat: number; lng: number }>): Promise<Array<number | null>> {
    const punkter = points.map(p => `${p.nord || p.lat},${p.ost || p.lng}`).join(' ')

    const params = new URLSearchParams({
      koordsys: this.COORDINATE_SYSTEM,
      punkter,
      geojson: 'false'
    })

    const response = await fetch(`${this.API_BASE_URL}/punkt?${params.toString()}`, {
      headers: {
        'User-Agent': 'Tråkke Norwegian Outdoor App',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.warn(`⚠️ Batch elevation API request failed: ${response.status}`)
      return points.map(() => null)
    }

    const data: ElevationApiResponse = await response.json()

    if (!data.punkter) {
      return points.map(() => null)
    }

    // Map response back to input order
    return data.punkter.map(point => {
      if (point.datafeil) {
        console.warn(`⚠️ Elevation data error for point: ${point.datafeil}`)
        return null
      }
      return point.hoyde
    })
  }

  private static sampleTrailPoints(coordinates: number[][], resolution: number): number[][] {
    if (coordinates.length <= resolution) {
      return coordinates
    }

    const step = Math.max(1, Math.floor(coordinates.length / resolution))
    const sampled: number[][] = []

    // Always include the first point
    sampled.push(coordinates[0])

    // Sample points at regular intervals
    for (let i = step; i < coordinates.length; i += step) {
      sampled.push(coordinates[i])
    }

    // Always include the last point if it's not already included
    const lastCoord = coordinates[coordinates.length - 1]
    const lastSampled = sampled[sampled.length - 1]
    if (lastCoord[0] !== lastSampled[0] || lastCoord[1] !== lastSampled[1]) {
      sampled.push(lastCoord)
    }

    return sampled
  }

  private static haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}
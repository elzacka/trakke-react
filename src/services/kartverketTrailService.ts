// Kartverket Trail Service - Official Norwegian hiking trails from "Rett i kartet"
// This service integrates with Kartverket's official outdoor recreation routes dataset

export interface KartverketTrail {
  id: string
  name: string
  description: string
  coordinates: [number, number][] // GeoJSON LineString coordinates [lng, lat]
  trailType: 'hiking' | 'skiing' | 'cycling' | 'other'
  difficulty?: 'easy' | 'medium' | 'hard'
  distance?: number // meters
  municipality: string
  county: string
  source: 'kartverket'
}

export interface TrailBounds {
  north: number
  south: number
  east: number
  west: number
}

// Kartverket WMS base URL and trail layer configurations
const KARTVERKET_WMS_BASE = 'https://wms.geonorge.no/wms'
const KARTVERKET_TRAIL_LAYERS = {
  hiking: 'kv_tur_og_friluftsruter_fotrute',     // Fotrute - hiking trails
  skiing: 'kv_tur_og_friluftsruter_skiloype',   // Skiløype - ski trails  
  cycling: 'kv_tur_og_friluftsruter_sykkelrute', // Sykkelrute - bicycle routes
  all: 'kv_tur_og_friluftsruter'                // All trail types combined
} as const

// Norwegian territory bounds for trail searches
const norwayBounds = {
  south: 57.5,
  west: 4.0,
  north: 72.0,
  east: 32.0
} as const

export class KartverketTrailService {
  
  /**
   * Get available trail data sources information
   * This provides metadata about the Kartverket trail dataset
   */
  static getDataSourceInfo(): { 
    name: string
    description: string
    coverage: string
    dataFormats: string[]
    updateFrequency: string
    wmsUrl: string
  } {
    return {
      name: 'Rett i kartet - Tur- og friluftsruter',
      description: 'Official Norwegian hiking and outdoor recreation routes from Kartverket',
      coverage: 'All of Norway - crowdsourced data from organizations and volunteers',
      dataFormats: ['FGDB', 'GML', 'GPX', 'PostGIS', 'SOSI'],
      updateFrequency: 'Updated based on voluntary reporting through Rett i kartet',
      wmsUrl: KARTVERKET_WMS_BASE
    }
  }

  /**
   * Check if Kartverket trail services are available
   * This will verify connectivity to the WMS service
   */
  static async checkServiceAvailability(): Promise<boolean> {
    try {
      // Test WMS service availability
      const testUrl = `${KARTVERKET_TRAIL_WMS_URL}&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities`
      const response = await fetch(testUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Trakke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Future method: Fetch trails within bounds
   * Currently returns empty array - to be implemented when WFS/API access is available
   */
  static async fetchTrailsInBounds(bounds: TrailBounds): Promise<KartverketTrail[]> {
    console.log('🥾 Kartverket trail service called for bounds:', bounds)
    console.log('📋 Note: Official trail data integration pending - using WMS layer for visualization')
    
    // Validate bounds are within Norway
    if (!this.isValidNorwegianBounds(bounds)) {
      console.warn('⚠️ Trail search bounds outside Norway - no data available')
      return []
    }

    // TODO: Implement when Kartverket provides real-time trail API access
    // For now, return empty array - trails will be shown via WMS layer on map
    return []
  }

  /**
   * Future method: Search trails by name or criteria
   */
  static async searchTrails(query: string): Promise<KartverketTrail[]> {
    console.log('🔍 Trail search requested:', query)
    console.log('📋 Note: Trail search pending official API access')
    
    // TODO: Implement when trail search API is available
    return []
  }

  /**
   * Get WMS layer URL for specific trail type
   * This allows showing different categories of Kartverket trails
   */
  static getWMSLayerUrl(trailType: keyof typeof KARTVERKET_TRAIL_LAYERS = 'all'): string {
    const layerName = KARTVERKET_TRAIL_LAYERS[trailType]
    return `${KARTVERKET_WMS_BASE}?service=WMS&request=GetMap&version=1.3.0&layers=${layerName}&styles=&format=image/png&transparent=true&crs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
  }

  /**
   * Get available trail categories
   */
  static getTrailCategories() {
    return {
      hiking: { name: 'Fotrute', description: 'Vandreruter og turstier' },
      skiing: { name: 'Skiløype', description: 'Langrennsløyper og skiturer' },  
      cycling: { name: 'Sykkelrute', description: 'Sykkelstier og sykkelruter' },
      all: { name: 'Alle turløyper', description: 'Alle kategorier av turløyper' }
    }
  }

  /**
   * Validate that bounds are within Norwegian territory
   */
  private static isValidNorwegianBounds(bounds: TrailBounds): boolean {
    return (
      bounds.south >= norwayBounds.south &&
      bounds.north <= norwayBounds.north &&
      bounds.west >= norwayBounds.west &&
      bounds.east <= norwayBounds.east
    )
  }

  /**
   * Future method: Convert trail data to GeoJSON format for MapLibre
   */
  static convertTrailsToGeoJSON(trails: KartverketTrail[]) {
    return {
      type: 'FeatureCollection',
      features: trails.map(trail => ({
        type: 'Feature',
        id: trail.id,
        properties: {
          name: trail.name,
          description: trail.description,
          trailType: trail.trailType,
          difficulty: trail.difficulty,
          distance: trail.distance,
          municipality: trail.municipality,
          county: trail.county,
          source: trail.source
        },
        geometry: {
          type: 'LineString',
          coordinates: trail.coordinates
        }
      }))
    }
  }
}
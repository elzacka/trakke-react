// Riksantikvaren API Service for Norwegian Cultural Heritage POIs
// Base URL: https://husmann.ra.no/arcgis/rest/services/Husmann/Husmann/MapServer/

export interface RiksantikvarenPOI {
  id: string
  source: 'riksantikvaren'
  category: 'archaeological' | 'military' | 'building' | 'underwater' | 'memorial'
  name: string
  description: string
  coordinates: [number, number] // [lng, lat]
  period?: string
  protection_status?: string
  images?: string[]
  source_url?: string
  created_at: Date
  updated_at: Date
}

export interface RiksantikvarenApiResponse {
  features: Array<{
    attributes: {
      OBJECTID: number
      KULTURMINNE_ID?: string
      NAVN?: string
      BESKRIVELSE?: string
      KULTURTPE?: string
      DATERING?: string
      VERNESTATUS?: string
      KOMMUNE?: string
      FYLKE?: string
      SHAPE?: Record<string, unknown>
    }
    geometry: {
      x: number
      y: number
    }
  }>
}

export class RiksantikvarenService {
  private baseUrl = 'https://husmann.ra.no/arcgis/rest/services/Husmann/Husmann/MapServer'
  private cache = new Map<string, { data: RiksantikvarenPOI[], timestamp: number }>()
  private cacheTimeout = 24 * 60 * 60 * 1000 // 24 hours

  // Test API endpoints and understand structure
  async testApiEndpoints(): Promise<void> {
    console.log('🔍 Testing Riksantikvaren API endpoints...')
    
    const endpoints = [
      { id: 4, name: 'Lokaliteter (Heritage sites/locations)' },
      { id: 5, name: 'Enkeltminner (Individual monuments)' },
      { id: 6, name: 'Sikringssoner (Protection zones)' }
    ]

    for (const endpoint of endpoints) {
      try {
        const url = `${this.baseUrl}/${endpoint.id}?f=json`
        console.log(`Testing endpoint: ${url}`)
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ ${endpoint.name}:`, {
            name: data.name,
            description: data.description,
            geometryType: data.geometryType,
            fields: data.fields?.map((f: { name: string; type: string }) => ({ name: f.name, type: f.type }))
          })
        } else {
          console.log(`❌ ${endpoint.name}: HTTP ${response.status}`)
        }
      } catch (error) {
        console.error(`❌ Error testing ${endpoint.name}:`, error)
      }
    }
  }

  // Get heritage POIs within bounding box for Setesdal region
  async getHeritagePoIsInBbox(
    bbox: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
  ): Promise<RiksantikvarenPOI[]> {
    const cacheKey = `heritage_${bbox.join(',')}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 Using cached Riksantikvaren data')
      return cached.data
    }

    try {
      console.log('🏛️ Fetching heritage POIs from Riksantikvaren...')
      
      // Try query lokaliteter (heritage sites) endpoint with fallback
      let pois: RiksantikvarenPOI[] = []
      
      try {
        pois = await this.queryEndpoint(4, bbox)
      } catch (endpointError) {
        console.warn('⚠️ Lokaliteter endpoint failed, trying fallback:', endpointError)
        
        // If main endpoint fails, try a smaller query or return empty
        if (endpointError instanceof Error && endpointError.message.includes('timeout')) {
          throw new Error('Riksantikvaren API is not responding')
        } else if (endpointError instanceof Error && endpointError.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to Riksantikvaren (CORS or network error)')
        } else {
          throw endpointError
        }
      }
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: pois,
        timestamp: Date.now()
      })

      console.log(`✅ Loaded ${pois.length} heritage POIs from Riksantikvaren`)
      return pois

    } catch (error) {
      console.error('❌ Error fetching heritage POIs:', error)
      // Don't throw - let caller handle gracefully
      return []
    }
  }

  private async queryEndpoint(
    layerId: number,
    bbox: [number, number, number, number]
  ): Promise<RiksantikvarenPOI[]> {
    // Convert bbox to geometry string for ArcGIS
    const geometry = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`
    
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      geometry: geometry,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'true',
      maxRecordCount: '500' // Reduced to avoid timeout
    })

    const url = `${this.baseUrl}/${layerId}/query?${params.toString()}`
    console.log(`📡 Querying Riksantikvaren endpoint: ${url}`)
    
    // Add timeout to fetch
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Riksantikvaren API timeout')), 10000)
    )
    
    const fetchPromise = fetch(url).then(async response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    })
    
    const apiResponse: RiksantikvarenApiResponse = await Promise.race([fetchPromise, timeoutPromise])
    
    const pois = apiResponse.features?.map(feature => this.parseFeatureToPOI(feature))
      .filter(poi => poi !== null) as RiksantikvarenPOI[] || []
    
    console.log(`✅ Parsed ${pois.length} heritage POIs from layer ${layerId}`)
    return pois
  }

  private parseFeatureToPOI(feature: RiksantikvarenApiResponse['features'][0]): RiksantikvarenPOI | null {
    try {
      const attrs = feature.attributes
      const geom = feature.geometry

      if (!geom || !attrs.NAVN) {
        return null
      }

      return {
        id: `ra_${attrs.OBJECTID || attrs.KULTURMINNE_ID || Math.random()}`,
        source: 'riksantikvaren',
        category: this.categorizeHeritageType(attrs.KULTURTPE),
        name: attrs.NAVN || 'Ukjent kulturminne',
        description: attrs.BESKRIVELSE || 'Ingen beskrivelse tilgjengelig',
        coordinates: [geom.x, geom.y],
        period: attrs.DATERING || undefined,
        protection_status: attrs.VERNESTATUS || undefined,
        source_url: `https://kulturminnesok.no/minne/?objektId=${attrs.KULTURMINNE_ID}`,
        created_at: new Date(),
        updated_at: new Date()
      }
    } catch (error) {
      console.warn('Error parsing feature:', error)
      return null
    }
  }

  private categorizeHeritageType(kulturtpe?: string): RiksantikvarenPOI['category'] {
    if (!kulturtpe) return 'memorial'
    
    const type = kulturtpe.toLowerCase()
    
    if (type.includes('gravfelt') || type.includes('gravhaug') || type.includes('steinalder')) {
      return 'archaeological'
    }
    if (type.includes('krig') || type.includes('militær') || type.includes('festning')) {
      return 'military'
    }
    if (type.includes('kirke') || type.includes('bygning') || type.includes('hus')) {
      return 'building'
    }
    if (type.includes('vrak') || type.includes('undervanns')) {
      return 'underwater'
    }
    
    return 'memorial'
  }
}

// Export singleton instance
export const riksantikvarenService = new RiksantikvarenService()
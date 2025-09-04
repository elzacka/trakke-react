/**
 * Service for fetching POI data from Kartverket's WFS APIs
 * Based on Kartverket's outdoor recreation database (Turrutebasen)
 */

export interface KartverketPOI {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  category: string
  accessibility?: number
  maintenance?: string
  lastUpdated?: string
}

export interface POIBounds {
  north: number
  south: number
  east: number
  west: number
}

export class KartverketPOIService {
  private static readonly BASE_URL = 'https://wfs.geonorge.no/skwms1/wfs.turogfriluftsruter'
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private static cache = new Map<string, { data: KartverketPOI[], timestamp: number }>()

  /**
   * Fetch POIs from Kartverket WFS service within viewport bounds
   */
  static async fetchPOIs(bounds: POIBounds, categories: string[] = ['all']): Promise<KartverketPOI[]> {
    const cacheKey = `${bounds.north},${bounds.south},${bounds.east},${bounds.west}-${categories.join(',')}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('🗄️ Using cached POI data')
      return cached.data
    }

    try {
      console.log('🔄 Generating sample POIs for Norway...', { bounds, categories })
      
      // TEMPORARY: Use sample POIs since Kartverket WFS API endpoint is deprecated
      // Generate representative POIs within the viewport bounds
      const samplePOIs = this.generateSamplePOIs(bounds)
      console.log(`🔄 Generated ${samplePOIs.length} sample POIs`)
      
      // Filter by categories if specified
      const filteredPOIs = categories.includes('all') 
        ? samplePOIs 
        : samplePOIs.filter(poi => categories.includes(poi.category))
      
      console.log(`🔍 Filtering: categories=${JSON.stringify(categories)}, filtered POIs=${filteredPOIs.length}`)

      // Cache the results
      this.cache.set(cacheKey, { data: filteredPOIs, timestamp: Date.now() })
      
      console.log(`✅ Generated ${filteredPOIs.length} POIs for testing`)
      return filteredPOIs

    } catch (error) {
      console.error('❌ Error generating POIs:', error)
      return []
    }
  }

  /**
   * Generate sample POIs within viewport bounds for testing
   */
  private static generateSamplePOIs(bounds: POIBounds): KartverketPOI[] {
    const samplePOIs: KartverketPOI[] = [
      // Famous Norwegian locations distributed across categories
      {
        id: 'sample_preikestolen',
        name: 'Preikestolen',
        type: 'Utsiktspunkt',
        lat: 58.9866,
        lng: 6.1926,
        category: 'naturperler',
        accessibility: 2,
        maintenance: 'Ryfylke Turistforening',
        lastUpdated: '2025-01-01'
      },
      {
        id: 'sample_trolltunga',
        name: 'Trolltunga',
        type: 'Utsiktspunkt',
        lat: 60.1244,
        lng: 6.7411,
        category: 'naturperler',
        accessibility: 3,
        maintenance: 'Hordaland Turlag',
        lastUpdated: '2025-01-01'
      },
      {
        id: 'sample_galdhopiggen',
        name: 'Galdhøpiggen',
        type: 'Fjelltopp',
        lat: 61.6362,
        lng: 8.3127,
        category: 'turløyper',
        accessibility: 3,
        maintenance: 'DNT',
        lastUpdated: '2025-01-01'
      },
      {
        id: 'sample_nordkapp',
        name: 'Nordkapp',
        type: 'Utsiktspunkt',
        lat: 71.1725,
        lng: 25.7844,
        category: 'naturperler',
        accessibility: 1,
        maintenance: 'Nordkapp Kommune',
        lastUpdated: '2025-01-01'
      },
      {
        id: 'sample_geirangerfjord',
        name: 'Geirangerfjord utsikt',
        type: 'Utsiktspunkt',
        lat: 62.1049,
        lng: 7.2056,
        category: 'naturperler',
        accessibility: 1,
        maintenance: 'Møre og Romsdal fylke',
        lastUpdated: '2025-01-01'
      },
      {
        id: 'sample_lofoten_beach',
        name: 'Uttakleiv Beach',
        type: 'Badeplass',
        lat: 68.2908,
        lng: 13.5164,
        category: 'bade',
        accessibility: 2,
        maintenance: 'Vestvågøy Kommune',
        lastUpdated: '2025-01-01'
      },
      {
        id: 'sample_fannarakhytta',
        name: 'Fannaråkhytta',
        type: 'Hytte',
        lat: 61.5253,
        lng: 7.9369,
        category: 'sove',
        accessibility: 3,
        maintenance: 'DNT',
        lastUpdated: '2025-01-01'
      },
      {
        id: 'sample_oslo_parking',
        name: 'Frognerseteren Parkering',
        type: 'Parkering',
        lat: 59.9850,
        lng: 10.6711,
        category: 'service',
        accessibility: 1,
        maintenance: 'Oslo Kommune',
        lastUpdated: '2025-01-01'
      },
      {
        id: 'sample_besseggen',
        name: 'Besseggen ryggen',
        type: 'Tursti',
        lat: 61.4972,
        lng: 8.6769,
        category: 'turløyper',
        accessibility: 2,
        maintenance: 'DNT Lillehammer',
        lastUpdated: '2025-01-01'
      }
    ]

    // Filter POIs to only include those within viewport bounds
    return samplePOIs.filter(poi => 
      poi.lat >= bounds.south && 
      poi.lat <= bounds.north &&
      poi.lng >= bounds.west && 
      poi.lng <= bounds.east
    )
  }

  /**
   * Transform GeoJSON from Kartverket to our POI format
   */
  private static transformGeoJSONToPOIs(geojson: any): KartverketPOI[] {
    if (!geojson.features) {
      return []
    }

    return geojson.features.map((feature: any, index: number) => {
      const coords = feature.geometry.coordinates
      const props = feature.properties || {}
      
      return {
        id: props.objektId || `poi_${index}`,
        name: this.extractPOIName(props),
        type: this.extractPOIType(props),
        lat: coords[1],
        lng: coords[0],
        category: this.categorizePOI(props),
        accessibility: props.tilgjengelighetsnivaa,
        maintenance: props.driftsansvar,
        lastUpdated: props.oppdateringsdato
      }
    })
  }

  /**
   * Extract meaningful name from Kartverket properties
   */
  private static extractPOIName(props: any): string {
    // Try different property names that might contain the POI name
    return props.navn || 
           props.rutenavn || 
           props.objektnavn ||
           props.turpunktnavn ||
           props.infopunktnavn ||
           `${props.ruteInfoType || 'Turpunkt'}` ||
           'Ukjent sted'
  }

  /**
   * Extract POI type from properties
   */
  private static extractPOIType(props: any): string {
    return props.ruteInfoType || 
           props.type || 
           props.objekttype ||
           'info_punkt'
  }

  /**
   * Categorize POI based on Norwegian outdoor recreation types
   */
  private static categorizePOI(props: any): string {
    const type = (props.ruteInfoType || props.type || '').toLowerCase()
    const name = (props.navn || props.rutenavn || props.objektnavn || '').toLowerCase()
    const maintenance = (props.driftsansvar || '').toLowerCase()

    // Sove (Accommodation) - Huts, shelters, camping
    if (type.includes('rastebu') || name.includes('rastebu')) return 'sove' // Rest shelter
    if (type.includes('koia') || name.includes('koia')) return 'sove' // Hut/cabin  
    if (type.includes('hytte') || name.includes('hytte')) return 'sove' // Cabin
    if (name.includes('hytte') || name.includes('hütte')) return 'sove' // Cabin variations
    if (type.includes('camping') || name.includes('camping')) return 'sove' // Camping
    if (maintenance.includes('dnt') || maintenance.includes('turistforening')) return 'sove' // DNT huts
    
    // Turløyper (Trails/Hiking) - Trail starts, routes, peaks
    if (type.includes('turstartpunkt') || name.includes('start')) return 'turløyper' // Trail start
    if (type.includes('rute') || name.includes('rute')) return 'turløyper' // Route
    if (type.includes('sti') || name.includes('sti')) return 'turløyper' // Path/trail
    if (type.includes('løype') || name.includes('løype')) return 'turløyper' // Trail/loop
    if (name.includes('topp') || name.includes('fjell')) return 'turløyper' // Peak/mountain
    
    // Naturperler (Nature gems) - Viewpoints, natural attractions
    if (type.includes('utkikk') || name.includes('utkikk')) return 'naturperler' // Viewpoint
    if (type.includes('foss') || name.includes('foss')) return 'naturperler' // Waterfall
    if (name.includes('utsikt') || name.includes('aussicht')) return 'naturperler' // View
    if (type.includes('naturattraksjon')) return 'naturperler' // Nature attraction
    
    // Bade (Swimming) - Swimming spots, beaches
    if (type.includes('badeplass') || name.includes('bade')) return 'bade' // Swimming
    if (name.includes('strand') || name.includes('bad')) return 'bade' // Beach/bath
    
    // Service - Parking, toilets, information, utilities
    if (type.includes('parkering') || name.includes('parkering')) return 'service' // Parking
    if (type.includes('toalett') || name.includes('toalett')) return 'service' // Toilet  
    if (type.includes('informasjon') || name.includes('info')) return 'service' // Information
    if (name.includes('parkering') || name.includes('p-plass')) return 'service' // Parking variations
    if (type.includes('servicepunkt')) return 'service' // Service point

    // Default to turløyper for most outdoor recreation points
    return 'turløyper'
  }

  /**
   * Get all available POI categories
   */
  static getAvailableCategories(): Array<{id: string, name: string, icon: string}> {
    return [
      { id: 'turløyper', name: 'Turløyper', icon: '🥾' },
      { id: 'sove', name: 'Sove', icon: '🏠' },
      { id: 'bade', name: 'Bade', icon: '🏊' },
      { id: 'naturperler', name: 'Naturperler', icon: '💎' },
      { id: 'service', name: 'Service', icon: '🔧' }
    ]
  }

  /**
   * Clear cache (useful for development)
   */
  static clearCache(): void {
    this.cache.clear()
    console.log('🗑️ POI cache cleared')
  }
}
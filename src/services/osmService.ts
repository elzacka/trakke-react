// src/services/osmService.ts - Norwegian boundary-constrained OSM API service
import { POI, POIType } from '../data/pois'

type _CampingMetadata = any

export interface OSMElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  tags: Record<string, string>
  center?: { lat: number, lon: number }
}

export interface OSMResponse {
  elements: OSMElement[]
}

// Norway's administrative boundary relation ID for proper geographic containment
const NORWAY_RELATION_ID = 1059668 // OSM relation for Kingdom of Norway
const NORWAY_AREA_ID = 3600000000 + NORWAY_RELATION_ID // Overpass area ID format

export interface ViewportBounds {
  north: number
  south: number
  east: number
  west: number
}

export class OSMService {
  private readonly baseUrl = 'https://overpass-api.de/api/interpreter'
  private readonly userAgent = 'Trakke-Norway-Outdoor-App/1.0 (https://github.com/elzacka/trakke-react)'
  
  // Enhanced rate limiting based on OSM best practices
  private lastRequestTime = 0
  private readonly minRequestDelay = 3000 // 3 seconds between requests to avoid 429 errors
  private requestCount = 0
  private readonly maxRequestsPerMinute = 8 // Conservative limit

  /**
   * Rate-limited fetch method following OSM API best practices
   * Uses Norwegian administrative boundaries to constrain all queries
   */
  private async rateLimitedFetch(query: string): Promise<OSMElement[]> {
    // Enhanced rate limiting
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    // Reset request count every minute
    if (timeSinceLastRequest > 60000) {
      this.requestCount = 0
    }
    
    // Check if we've exceeded requests per minute
    if (this.requestCount >= this.maxRequestsPerMinute) {
      console.warn('⏱️ Rate limit reached, waiting 60 seconds...')
      await new Promise(resolve => setTimeout(resolve, 60000))
      this.requestCount = 0
    }
    
    // Enforce minimum delay between requests
    if (timeSinceLastRequest < this.minRequestDelay) {
      const waitTime = this.minRequestDelay - timeSinceLastRequest
      console.log(`⏱️ Waiting ${waitTime}ms before next OSM request...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
    this.requestCount++
    
    try {
      console.log('🔄 Making Norwegian boundary-constrained OSM API request...')
      console.log('Query:', query)
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent
        },
        body: `data=${encodeURIComponent(query)}`
      })
      
      console.log(`📡 OSM API response status: ${response.status}`)
      
      if (response.status === 429) {
        console.warn('⚠️ OSM API rate limited (429), waiting 60 seconds before retry...')
        await new Promise(resolve => setTimeout(resolve, 60000))
        this.requestCount = 0 // Reset on rate limit
        return this.rateLimitedFetch(query) // Single retry
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ OSM API Error Response:', errorText)
        throw new Error(`OSM API error: ${response.status} - ${errorText}`)
      }
      
      const data: OSMResponse = await response.json()
      console.log(`✅ OSM API: Retrieved ${data.elements.length} elements (Norway-constrained)`)
      
      // Log warning if we're getting too many results (potential performance issue)
      if (data.elements.length > 2000) {
        console.warn(`⚠️ Large result set: ${data.elements.length} elements. Consider narrowing query.`)
      }
      
      return data.elements
      
    } catch (error) {
      console.error('💥 Error fetching OSM data:', error)
      return []
    }
  }

  /**
   * Creates efficient Norway-constrained Overpass query
   * All queries are limited to Norwegian administrative boundaries
   */
  private buildNorwayConstrainedQuery(
    bounds: ViewportBounds,
    osmSelectors: string[],
    timeout = 25
  ): string {
    return `
      [out:json][timeout:${timeout}];
      area(${NORWAY_AREA_ID})->.norway;
      (
        ${osmSelectors.map(selector => 
          `${selector}(area.norway)(${bounds.south},${bounds.west},${bounds.north},${bounds.east});`
        ).join('\n        ')}
      );
      out center meta;
    `.trim()
  }

  /**
   * Henter camping-relaterte POI-er begrenset til Norge
   */
  async getCampingPOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["tourism"="camp_site"]',
      'nwr["tourism"="caravan_site"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  /**
   * Henter krigsminne og kulturarv POI-er begrenset til Norge
   */
  async getCulturalHeritagePOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["historic"="memorial"]',
      'nwr["historic"="monument"]', 
      'nwr["historic"="archaeological_site"]',
      'nwr["amenity"="place_of_worship"]',
      'nwr["building"="church"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  /**
   * Henter friluftsliv POI-er begrenset til Norge
   */
  async getOutdoorRecreationPOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["natural"="peak"]',
      'nwr["tourism"="viewpoint"]',
      'nwr["natural"="rock"]',
      'nwr["natural"="waterfall"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  /**
   * Henter hytter begrenset til Norge
   */
  async getHutPOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["tourism"="alpine_hut"]',
      'nwr["tourism"="wilderness_hut"]',
      'nwr["building"="hut"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  /**
   * Henter vannaktiviteter begrenset til Norge
   */
  async getWaterActivitiesPOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["leisure"="swimming_pool"]',
      'nwr["natural"="beach"]',
      'nwr["natural"="water"]["sport"~"swimming|diving"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  /**
   * Henter service POI-er begrenset til Norge 
   */
  async getServicePOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["amenity"="parking"]',
      'nwr["amenity"="toilets"]', 
      'nwr["amenity"="drinking_water"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  /**
   * Henter transport POI-er begrenset til Norge
   */
  async getTransportPOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["public_transport"="station"]',
      'nwr["railway"="station"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  /**
   * Henter taubaner begrenset til Norge
   */
  async getCableCarsPOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["aerialway"="cable_car"]',
      'nwr["aerialway"="gondola"]',
      'nwr["aerialway"="chair_lift"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  /**
   * Additional POI category methods for completeness
   */
  async getSkiTrailsPOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["piste:type"]',
      'nwr["route"="ski"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  async getWaterSportsPOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["sport"="fishing"]',
      'nwr["sport"="canoe"]',
      'nwr["sport"="kayak"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  async getRecreationServicesPOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["tourism"="information"]',
      'nwr["leisure"="firepit"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  async getSpecializedServicesPOIsInBounds(bounds: ViewportBounds): Promise<OSMElement[]> {
    const selectors = [
      'nwr["emergency"="mountain_rescue"]',
      'nwr["wheelchair"="yes"]'
    ]
    const query = this.buildNorwayConstrainedQuery(bounds, selectors)
    return this.rateLimitedFetch(query)
  }

  /**
   * Convert OSM element to POI
   */
  convertElementToPOI(element: OSMElement, poiType: POIType): POI | null {
    // Get coordinates - prefer center for ways/relations, lat/lon for nodes
    const lat = element.lat || element.center?.lat
    const lng = element.lon || element.center?.lon
    
    if (!lat || !lng) {
      console.log(`🚫 No coordinates for element ${element.id}: lat=${lat}, lng=${lng}, center=${JSON.stringify(element.center)}`)
      return null
    }
    
    // Generate Norwegian description
    const name = element.tags['name'] || element.tags['name:no'] || element.tags['name:nb'] || 'Uten navn'
    const description = this.generateNorwegianDescription(element, poiType)
    
    const poi = {
      id: `osm-${element.type}-${element.id}`,
      name,
      description,
      lat,
      lng,
      type: poiType,
      source: 'osm',
      tags: element.tags
    }
    
    console.log(`✅ Converted element ${element.id} to POI: ${name} at (${lat}, ${lng})`)
    return poi
  }

  /**
   * Generate Norwegian description for POI
   */
  private generateNorwegianDescription(element: OSMElement, poiType: POIType): string {
    const tags = element.tags
    const name = tags['name'] || tags['name:no'] || tags['name:nb'] || 'Uten navn'
    
    // Base description by type
    const typeDescriptions: Record<POIType, string> = {
      // Accommodation
      camping_site: 'Campingplass',
      tent_area: 'Teltområde', 
      wild_camping: 'Villcamping',
      staffed_huts: 'Betjent hytte',
      self_service_huts: 'Selvbetjeningshytte',
      wilderness_shelter: 'Gapahuker/ly',
      
      // Outdoor Activities
      hiking: 'Turområde',
      mountain_peaks: 'Fjelltopp',
      viewpoints: 'Utsiktspunkt',
      nature_gems: 'Naturperle',
      swimming: 'Badeplass',
      beach: 'Strand',
      lakes_rivers: 'Innsjø/elv',
      ski_trails: 'Skiløype',
      fishing_spots: 'Fiskeplass',
      canoeing: 'Padling',
      ice_fishing: 'Isfiske',
      
      // Cultural Heritage
      war_memorials: 'Krigsminne',
      peace_monuments: 'Fredsmonument',
      archaeological: 'Arkeologisk sted',
      churches: 'Kirke',
      protected_buildings: 'Verneverdig byggverk',
      industrial_heritage: 'Industriarv',
      cultural_landscapes: 'Kulturlandskap',
      underwater_heritage: 'Undervannskulturarv',
      intangible_heritage: 'Immaterielle kulturverdier',
      
      // Services & Infrastructure  
      parking: 'Parkering',
      toilets: 'Toalett',
      drinking_water: 'Drikkevann',
      rest_areas: 'Rasteplass',
      public_transport: 'Kollektivtransport',
      train_stations: 'Jernbanestasjon',
      cable_cars: 'Taubane',
      information_boards: 'Informasjonstavle',
      fire_places: 'Bålplass',
      
      // Specialized
      mountain_service: 'Fjelltjeneste',
      accessible_sites: 'Tilgjengelig sted',
      hammock_spots: 'Hengekøyeplass'
    }
    
    let description = typeDescriptions[poiType] || 'Interessant sted'
    
    // Add elevation for peaks
    if (tags.ele && (poiType === 'mountain_peaks' || poiType === 'viewpoints')) {
      description += ` (${tags.ele} moh)`
    }
    
    // Add additional info
    if (tags.description) {
      description += ` - ${tags.description}`
    }
    
    return `${name}: ${description}`
  }
}
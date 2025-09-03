// src/services/comprehensiveOSMService.ts - Complete OSM integration for all Tråkke POI categories
import { POI, POIType } from '../data/pois'

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

// Full Norway bounding box
const NORWAY_BBOX = {
  south: 57.5,   // Lindesnes (southernmost point)
  west: 4.0,     // Western coast including Shetland time zone areas
  north: 71.5,   // Nordkapp and beyond  
  east: 31.5     // Eastern border with Russia (Finnmark)
}

// Comprehensive OSM tag mappings for all Tråkke POI categories
export const OSM_CATEGORY_MAPPINGS = {
  // Friluftsliv Categories
  hiking: [
    'highway=path',
    'highway=footway',
    'highway=pedestrian',
    'route=hiking',
    'route=foot'
  ],
  
  mountain_peaks: [
    'natural=peak',
    'natural=volcano'
  ],
  
  ski_trails: [
    'piste:type=nordic',
    'piste:type=downhill',
    'piste:type=skitour',
    'route=ski'
  ],
  
  // Water Activities
  swimming: [
    'leisure=swimming_pool',
    'sport=swimming',
    'natural=beach'
  ],
  
  beach: [
    'natural=beach',
    'leisure=beach_resort'
  ],
  
  lakes_rivers: [
    'natural=water',
    'waterway=river',
    'waterway=stream',
    'natural=lake',
    'natural=bay'
  ],
  
  ice_fishing: [
    'sport=fishing',
    'leisure=fishing'
  ],
  
  // Accommodation
  staffed_huts: [
    'tourism=alpine_hut'
  ],
  
  self_service_huts: [
    'tourism=wilderness_hut'
  ],
  
  wilderness_shelter: [
    'amenity=shelter'
  ],
  
  camping_site: [
    'tourism=camp_site',
    'tourism=caravan_site',
    'leisure=camping'
  ],
  
  tent_area: [
    'tourism=camp_site'
  ],
  
  wild_camping: [
    'leisure=camping'
  ],
  
  // Nature Experiences
  nature_gems: [
    'waterway=waterfall',
    'natural=cave_entrance',
    'natural=geyser',
    'natural=glacier',
    'natural=hot_spring',
    'natural=arch'
  ],
  
  viewpoints: [
    'tourism=viewpoint',
    'man_made=tower'
  ],
  
  // Cultural Heritage
  archaeological: [
    'historic=archaeological_site',
    'historic=ruins',
    'historic=stone_circle',
    'historic=petroglyphs',
    'historic=burial_mound',
    'historic=shieling'
  ],
  
  protected_buildings: [
    'historic=building',
    'heritage=*',
    'historic=manor',
    'historic=castle'
  ],
  
  churches: [
    'amenity=place_of_worship',
    'building=church',
    'historic=church',
    'building=chapel'
  ],
  
  war_memorials: [
    'historic=memorial',
    'historic=monument',
    'military=bunker',
    'military=trench',
    'historic=battlefield',
    'memorial=war_memorial',
    'memorial=statue'
  ],
  
  // Services & Infrastructure
  parking: [
    'amenity=parking',
    'highway=rest_area'
  ],
  
  rest_areas: [
    'highway=rest_area',
    'amenity=bench',
    'leisure=picnic_table',
    'tourism=picnic_site'
  ],
  
  toilets: [
    'amenity=toilets'
  ],
  
  drinking_water: [
    'amenity=drinking_water',
    'natural=spring'
  ],
  
  fire_places: [
    'leisure=firepit',
    'amenity=bbq'
  ],
  
  information_boards: [
    'tourism=information'
  ],
  
  // Transport
  cable_cars: [
    'aerialway=cable_car',
    'aerialway=gondola',
    'aerialway=chair_lift',
    'aerialway=drag_lift'
  ],
  
  public_transport: [
    'highway=bus_stop',
    'public_transport=stop_position',
    'railway=tram_stop',
    'amenity=ferry_terminal'
  ],
  
  train_stations: [
    'railway=station',
    'railway=halt'
  ],
  
  // Extended Categories
  fishing_spots: [
    'leisure=fishing',
    'sport=fishing',
    'natural=water'
  ],
  
  canoeing: [
    'sport=canoe',
    'sport=kayak',
    'leisure=slipway',
    'waterway=river'
  ],
  
  mountain_service: [
    'amenity=restaurant',
    'tourism=guest_house'
  ],
  
  accessible_sites: [
    'wheelchair=yes',
    'disabled=yes'
  ],
  
  hammock_spots: [
    'leisure=camping',
    'amenity=shelter'
  ],
  
  // Additional categories from POI types
  cultural_landscapes: [
    'place=farm',
    'landuse=meadow',
    'historic=farm'
  ],
  
  industrial_heritage: [
    'man_made=mine',
    'man_made=quarry',
    'historic=industrial'
  ],
  
  peace_monuments: [
    'historic=memorial',
    'memorial=peace_monument'
  ],
  
  underwater_heritage: [
    'historic=wreck',
    'waterway=wreck'
  ],
  
  intangible_heritage: [
    'historic=heritage_site',
    'cultural=traditional_site'
  ]
}

export class ComprehensiveOSMService {
  private readonly baseUrl = 'https://overpass-api.de/api/interpreter'
  private readonly userAgent = 'Trakke-Norway-Outdoor-App/1.0 (https://github.com/elzacka/trakke-react)'

  /**
   * Generic method to fetch POIs for any category
   */
  async getPOIsForCategory(category: POIType): Promise<OSMElement[]> {
    const tags = OSM_CATEGORY_MAPPINGS[category]
    if (!tags || tags.length === 0) {
      console.warn(`No OSM mapping found for category: ${category}`)
      return []
    }

    const query = this.buildCategoryQuery(tags)
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent
        },
        body: `data=${encodeURIComponent(query)}`
      })
      
      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status} for category ${category}`)
      }
      
      const data: OSMResponse = await response.json()
      console.log(`✅ Fetched ${data.elements.length} elements for ${category}`)
      return data.elements
      
    } catch (error) {
      console.error(`Error fetching OSM data for ${category}:`, error)
      return []
    }
  }

  /**
   * Build Overpass QL query for given tags
   */
  private buildCategoryQuery(tags: string[]): string {
    const nodeQueries = tags.map(tag => 
      `node[${tag}](${NORWAY_BBOX.south},${NORWAY_BBOX.west},${NORWAY_BBOX.north},${NORWAY_BBOX.east});`
    ).join('\n  ')
    
    const wayQueries = tags.map(tag =>
      `way[${tag}](${NORWAY_BBOX.south},${NORWAY_BBOX.west},${NORWAY_BBOX.north},${NORWAY_BBOX.east});`
    ).join('\n  ')
    
    const relationQueries = tags.map(tag =>
      `rel[${tag}](${NORWAY_BBOX.south},${NORWAY_BBOX.west},${NORWAY_BBOX.north},${NORWAY_BBOX.east});`
    ).join('\n  ')
    
    return `
      [out:json][timeout:30];
      (
        ${nodeQueries}
        ${wayQueries}
        ${relationQueries}
      );
      out center meta;
    `
  }

  /**
   * Convert OSM element to Tråkke POI
   */
  convertToPOI(element: OSMElement, category: POIType): POI {
    // Extract coordinates
    let lat: number, lng: number
    if (element.lat && element.lon) {
      lat = element.lat
      lng = element.lon
    } else if (element.center) {
      lat = element.center.lat
      lng = element.center.lon
    } else {
      throw new Error('No coordinates available for element')
    }

    // Extract name with Norwegian priority
    const name = element.tags['name:no'] || 
                 element.tags['name:nb'] || 
                 element.tags.name ||
                 this.generateNameForCategory(element.tags, category) ||
                 `${category}_${element.id}`

    // Generate Norwegian description
    const description = element.tags['description:no'] ||
                       element.tags['description:nb'] ||
                       element.tags.description ||
                       this.generateDescriptionForCategory(element.tags, category)

    return {
      id: `osm_${category}_${element.id}`,
      name,
      lat,
      lng,
      description,
      type: category,
      metadata: {
        osm_id: element.id.toString(),
        osm_type: element.type,
        ...element.tags
      },
      api_source: 'osm',
      last_updated: new Date().toISOString()
    }
  }

  /**
   * Generate Norwegian names based on category and OSM tags
   */
  private generateNameForCategory(tags: Record<string, string>, category: POIType): string {
    switch (category) {
      case 'hiking':
        if (tags.route === 'hiking') return 'Tursti'
        if (tags.highway === 'path') return 'Sti'
        return 'Fotturrute'
      
      case 'mountain_peaks':
        if (tags.ele) return `Fjelltopp (${tags.ele}m)`
        return 'Fjelltopp'
      
      case 'viewpoints':
        return 'Utsiktspunkt'
      
      case 'camping_site':
        return 'Campingplass'
      
      case 'staffed_huts':
        return 'Betjent hytte'
      
      case 'self_service_huts':
        return 'Selvbetjent hytte'
      
      case 'war_memorials':
        if (tags.military === 'bunker') return 'Bunker'
        if (tags.historic === 'memorial') return 'Minnested'
        return 'Krigsminne'
      
      // Add more category-specific names as needed
      default:
        return category.replace(/_/g, ' ')
    }
  }

  /**
   * Generate Norwegian descriptions based on category and OSM tags
   */
  private generateDescriptionForCategory(tags: Record<string, string>, category: POIType): string {
    const parts: string[] = []

    switch (category) {
      case 'hiking':
        parts.push('Tursti for fotturer')
        if (tags.surface) parts.push(`Underlag: ${tags.surface}`)
        if (tags.sac_scale) parts.push(`Vanskelighetsgrad: ${tags.sac_scale}`)
        break

      case 'viewpoints':
        parts.push('Utsiktspunkt med panoramautsikt')
        if (tags.ele) parts.push(`Høyde: ${tags.ele} meter`)
        break

      case 'camping_site':
        parts.push('Campingplass for overnatting')
        if (tags.fee === 'yes') parts.push('Avgift kreves')
        if (tags.tents === 'yes') parts.push('Telt tillatt')
        break

      case 'war_memorials':
        if (tags.military === 'bunker') {
          parts.push('Militært forsvarsverk fra andre verdenskrig')
        } else {
          parts.push('Minnesmerke fra krigsperioden')
        }
        break

      default:
        parts.push(`${category.replace(/_/g, ' ')} registrert i OpenStreetMap`)
    }

    if (tags.wheelchair === 'yes') {
      parts.push('Tilgjengelig for rullestol')
    }

    return parts.join('. ') + '.'
  }

  /**
   * Get all available categories that have OSM mappings
   */
  getAvailableCategories(): POIType[] {
    return Object.keys(OSM_CATEGORY_MAPPINGS) as POIType[]
  }
}
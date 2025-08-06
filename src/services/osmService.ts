// src/services/osmService.ts - Fikset parsing error
import { POI, POIType, CampingMetadata } from '../data/pois'

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

// Bounding box for all of Norway (mainland + Svalbard)
const NORWAY_BBOX = {
  south: 57.5,   // Lindesnes (southernmost point)
  west: 4.0,     // Western coast including Shetland time zone areas
  north: 71.5,   // Nordkapp and beyond  
  east: 31.5     // Eastern border with Russia (Finnmark)
}

export class OSMService {
  private readonly baseUrl = 'https://overpass-api.de/api/interpreter'
  
  /**
   * Henter camping-relaterte POI-er fra OpenStreetMap
   */
  async getCampingPOIs(): Promise<OSMElement[]> {
    const query = this.buildCampingQuery()
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Trakke/1.0 hei@tazk.no'
        },
        body: `data=${encodeURIComponent(query)}`
      })
      
      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status}`)
      }
      
      const data: OSMResponse = await response.json()
      return data.elements
    } catch (error) {
      console.error('Error fetching OSM camping data:', error)
      return []
    }
  }

  /**
   * Henter krigsminne og kulturarv POI-er fra OpenStreetMap med norsk språkstøtte
   */
  async getWarMemorialPOIs(): Promise<OSMElement[]> {
    const query = this.buildWarMemorialQuery()
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Trakke/1.0 hei@tazk.no'
        },
        body: `data=${encodeURIComponent(query)}`
      })
      
      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status}`)
      }
      
      const data: OSMResponse = await response.json()
      return data.elements
    } catch (error) {
      console.error('Error fetching OSM war memorial data:', error)
      return []
    }
  }

  /**
   * Henter friluftsliv POI-er (tursti, topper, badeplasser etc.) med norsk språkstøtte
   */
  async getOutdoorRecreationPOIs(): Promise<OSMElement[]> {
    const query = this.buildOutdoorRecreationQuery()
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Trakke/1.0 hei@tazk.no'
        },
        body: `data=${encodeURIComponent(query)}`
      })
      
      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status}`)
      }
      
      const data: OSMResponse = await response.json()
      return data.elements
    } catch (error) {
      console.error('Error fetching OSM outdoor recreation data:', error)
      return []
    }
  }

  /**
   * Henter hytter og serveringssteder (DNT hytter, turisthytter etc.) med norsk språkstøtte
   */
  async getHutAndServicePOIs(): Promise<OSMElement[]> {
    const query = this.buildHutAndServiceQuery()
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Trakke/1.0 hei@tazk.no'
        },
        body: `data=${encodeURIComponent(query)}`
      })
      
      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status}`)
      }
      
      const data: OSMResponse = await response.json()
      return data.elements
    } catch (error) {
      console.error('Error fetching OSM hut and service data:', error)
      return []
    }
  }

  /**
   * Henter service og infrastruktur POI-er (parkering, toaletter, transport etc.) med norsk språkstøtte
   */
  async getServiceInfrastructurePOIs(): Promise<OSMElement[]> {
    const query = this.buildServiceInfrastructureQuery()
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Trakke/1.0 hei@tazk.no'
        },
        body: `data=${encodeURIComponent(query)}`
      })
      
      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status}`)
      }
      
      const data: OSMResponse = await response.json()
      return data.elements
    } catch (error) {
      console.error('Error fetching OSM service infrastructure data:', error)
      return []
    }
  }

  /**
   * Bygger Overpass QL query for camping-relaterte POI-er
   */
  private buildCampingQuery(): string {
    const { south, west, north, east } = NORWAY_BBOX
    
    return `
      [out:json][timeout:25];
      (
        // Basic camping and shelter features
        node["tourism"="camp_site"](${south},${west},${north},${east});
        way["tourism"="camp_site"](${south},${west},${north},${east});
        node["amenity"="shelter"](${south},${west},${north},${east});
        way["amenity"="shelter"](${south},${west},${north},${east});
        node["tourism"="wilderness_hut"](${south},${west},${north},${east});
        way["tourism"="wilderness_hut"](${south},${west},${north},${east});
      );
      out center meta;
    `
  }

  /**
   * Bygger Overpass QL query for krigsminne og kulturarv POI-er med norsk språkstøtte
   */
  private buildWarMemorialQuery(): string {
    const { south, west, north, east } = NORWAY_BBOX
    
    return `
      [out:json][timeout:25];
      (
        // Basic historical and cultural features
        node["historic"="memorial"](${south},${west},${north},${east});
        way["historic"="memorial"](${south},${west},${north},${east});
        node["historic"="monument"](${south},${west},${north},${east});
        way["historic"="monument"](${south},${west},${north},${east});
        node["amenity"="place_of_worship"](${south},${west},${north},${east});
        way["amenity"="place_of_worship"](${south},${west},${north},${east});
        node["historic"="archaeological_site"](${south},${west},${north},${east});
        way["historic"="archaeological_site"](${south},${west},${north},${east});
      );
      out center meta;
    `
  }

  /**
   * Bygger Overpass QL query for friluftsliv POI-er (turer, topper, badeplasser etc.)
   */
  private buildOutdoorRecreationQuery(): string {
    const { south, west, north, east } = NORWAY_BBOX
    
    return `
      [out:json][timeout:25];
      (
        // Basic outdoor recreation features
        node["natural"="peak"](${south},${west},${north},${east});
        node["tourism"="viewpoint"](${south},${west},${north},${east});
        way["tourism"="viewpoint"](${south},${west},${north},${east});
        node["waterway"="waterfall"](${south},${west},${north},${east});
        node["leisure"="swimming_area"](${south},${west},${north},${east});
        way["leisure"="swimming_area"](${south},${west},${north},${east});
        node["natural"="beach"](${south},${west},${north},${east});
        way["natural"="beach"](${south},${west},${north},${east});
      );
      out center meta;
    `
  }

  /**
   * Bygger Overpass QL query for hytter og serveringssteder
   */
  private buildHutAndServiceQuery(): string {
    const { south, west, north, east } = NORWAY_BBOX
    
    return `
      [out:json][timeout:25];
      (
        // Basic hut and service features
        node["tourism"="alpine_hut"](${south},${west},${north},${east});
        way["tourism"="alpine_hut"](${south},${west},${north},${east});
        node["amenity"="restaurant"](${south},${west},${north},${east});
        way["amenity"="restaurant"](${south},${west},${north},${east});
        node["amenity"="cafe"](${south},${west},${north},${east});
        way["amenity"="cafe"](${south},${west},${north},${east});
      );
      out center meta;
    `
  }

  /**
   * Bygger Overpass QL query for service og infrastruktur POI-er
   */
  private buildServiceInfrastructureQuery(): string {
    const { south, west, north, east } = NORWAY_BBOX
    
    return `
      [out:json][timeout:25];
      (
        // Basic service and infrastructure features
        node["amenity"="parking"](${south},${west},${north},${east});
        way["amenity"="parking"](${south},${west},${north},${east});
        node["amenity"="toilets"](${south},${west},${north},${east});
        way["amenity"="toilets"](${south},${west},${north},${east});
        node["amenity"="drinking_water"](${south},${west},${north},${east});
        node["tourism"="information"](${south},${west},${north},${east});
        way["tourism"="information"](${south},${west},${north},${east});
      );
      out center meta;
    `
  }

  /**
   * Analyserer OSM element og bestemmer egnethet for camping
   */
  analyzeCampingSuitability(element: OSMElement): {
    tentSuitable: boolean
    hammockSuitable: boolean
    underStarsSuitable: boolean
    confidence: number
  } {
    const tags = element.tags
    
    // Analyser basert på OSM tags
    const hasTrees = tags.natural === 'forest' || 
                    tags.natural === 'wood' ||
                    tags.leaf_type === 'mixed' ||
                    tags.leaf_type === 'broadleaved'
    
    const isFlat = tags.tourism === 'camp_site' ||
                  tags.leisure === 'picnic_site' ||
                  tags.natural === 'beach' ||
                  tags.natural === 'clearing' ||
                  tags.natural === 'grassland'
    
    const isOpen = tags.natural === 'grassland' ||
                  tags.natural === 'heath' ||
                  tags.natural === 'beach' ||
                  tags.natural === 'clearing'
    
    // Beregn egnethet
    const tentSuitable = isFlat && !tags.access?.includes('private')
    const hammockSuitable = hasTrees && !tags.access?.includes('private')
    const underStarsSuitable = isOpen && isFlat && !tags.access?.includes('private')
    
    // Confidence basert på hvor spesifikke tags vi har
    let confidence = 0.5
    if (tags.tourism === 'camp_site') confidence = 0.9
    if (tags.amenity === 'shelter') confidence = 0.8
    if (tags.leisure === 'picnic_site') confidence = 0.7
    if (tags.natural && (isFlat || hasTrees)) confidence = 0.6
    
    return {
      tentSuitable,
      hammockSuitable, 
      underStarsSuitable,
      confidence
    }
  }

  /**
   * Konverterer krigsminne/kulturarv OSM element til vårt POI format
   */
  convertWarMemorialToPOI(element: OSMElement): POI {
    const lat = element.lat || element.center?.lat || 0
    const lon = element.lon || element.center?.lon || 0
    const tags = element.tags
    
    // Determine type based on OSM tags
    let type: POIType = 'war_memorials'
    
    if (tags.historic === 'memorial' && (tags.memorial === 'war' || tags['memorial:type'] === 'war')) {
      type = 'war_memorials'
    } else if (tags.memorial === 'peace' || tags.name?.toLowerCase().includes('fred')) {
      type = 'peace_monuments'
    } else if (tags.historic === 'archaeological_site' || tags.historic === 'tomb') {
      type = 'archaeological'
    } else if (tags.amenity === 'place_of_worship' || tags.building === 'church') {
      type = 'churches'
    } else if (tags.historic === 'bunker' || tags.military) {
      type = 'war_memorials'
    } else if (tags.historic === 'ruins') {
      type = 'protected_buildings'
    } else if (tags.historic === 'monument') {
      type = 'war_memorials'
    }
    
    // Generate Norwegian name and description
    const name = this.getPreferredNorwegianName(tags) || this.generateWarMemorialName(tags, type)
    const description = this.getPreferredNorwegianDescription(tags) || this.generateWarMemorialDescription(tags)
    
    return {
      id: `osm_${element.type}_${element.id}`,
      name,
      lat,
      lng: lon,
      description,
      type,
      metadata: {
        historic_type: tags.historic || 'unknown',
        memorial_type: tags.memorial || tags['memorial:type'] || 'unknown',
        period: tags['start_date'] || tags.year || 'ukjent',
        ...(tags.architect ? { architect: tags.architect } : {}),
        ...(tags.inscription ? { inscription: tags.inscription } : {}),
        ...((tags['wikipedia:no'] || tags.wikipedia) ? { wikipedia_no: tags['wikipedia:no'] || tags.wikipedia } : {}),
        ...(tags.wikidata ? { wikidata: tags.wikidata } : {})
      },
      api_source: 'osm',
      last_updated: new Date().toISOString()
    }
  }

  /**
   * Konverterer friluftsliv OSM element til vårt POI format
   */
  convertOutdoorRecreationToPOI(element: OSMElement): POI {
    const lat = element.lat || element.center?.lat || 0
    const lon = element.lon || element.center?.lon || 0
    const tags = element.tags
    
    // Determine type based on OSM tags
    let type: POIType = 'hiking'
    
    if (tags.natural === 'peak' || tags.mountain_pass) {
      type = 'mountain_peaks'
    } else if (tags['piste:type'] || tags.route === 'ski') {
      type = 'ski_trails'
    } else if (tags.leisure === 'swimming_area' || tags.amenity === 'swimming_pool') {
      type = 'swimming'
    } else if (tags.natural === 'beach') {
      type = 'beach'
    } else if (tags.natural === 'water' || tags.waterway) {
      type = 'lakes_rivers'
    } else if (tags.sport === 'fishing' && tags.seasonal === 'winter') {
      type = 'ice_fishing'
    } else if (tags.waterway === 'waterfall' || tags.natural === 'cave_entrance') {
      type = 'nature_gems'
    } else if (tags.tourism === 'viewpoint') {
      type = 'viewpoints'
    } else if (tags.place === 'farm' || tags.landuse === 'farmland') {
      type = 'cultural_landscapes'
    } else if (tags.highway === 'path' || tags.highway === 'track' || tags.route === 'hiking' || tags.route === 'foot') {
      type = 'hiking'
    }
    
    const name = this.getPreferredNorwegianName(tags) || this.generateOutdoorRecreationName(tags, type)
    const description = this.getPreferredNorwegianDescription(tags) || this.generateOutdoorRecreationDescription(tags)
    
    return {
      id: `osm_${element.type}_${element.id}`,
      name,
      lat,
      lng: lon,
      description,
      type,
      metadata: {
        outdoor_type: tags.highway || tags.natural || tags.leisure || tags.tourism || 'unknown',
        ...(tags.sac_scale || tags.difficulty ? { difficulty: tags.sac_scale || tags.difficulty } : {}),
        ...(tags.surface ? { surface: tags.surface } : {}),
        ...(tags.ele ? { elevation: tags.ele } : {}),
        ...(tags.operator ? { operator: tags.operator } : {}),
        ...(tags.opening_hours ? { opening_hours: tags.opening_hours } : {}),
        ...(tags.wikipedia && { wikipedia_no: tags['wikipedia:no'] || tags.wikipedia }),
        ...(tags.wikidata && { wikidata: tags.wikidata })
      },
      api_source: 'osm',
      last_updated: new Date().toISOString()
    }
  }

  /**
   * Konverterer hytter/service OSM element til vårt POI format
   */
  convertHutAndServiceToPOI(element: OSMElement): POI {
    const lat = element.lat || element.center?.lat || 0
    const lon = element.lon || element.center?.lon || 0
    const tags = element.tags
    
    // Determine type based on OSM tags
    let type: POIType = 'wilderness_shelter'
    
    if (tags.tourism === 'alpine_hut' && (tags.operator?.includes('DNT') || tags.fee === 'yes')) {
      type = 'staffed_huts'
    } else if (tags.tourism === 'alpine_hut' && tags.fee === 'no') {
      type = 'self_service_huts'
    } else if (tags.tourism === 'wilderness_hut') {
      type = 'self_service_huts'
    } else if (tags.amenity === 'shelter') {
      type = 'wilderness_shelter'
    } else if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.tourism === 'guest_house') {
      type = 'mountain_service'
    } else if (tags.wheelchair === 'yes') {
      type = 'accessible_sites'
    }
    
    const name = this.getPreferredNorwegianName(tags) || this.generateHutAndServiceName(tags, type)
    const description = this.getPreferredNorwegianDescription(tags) || this.generateHutAndServiceDescription(tags)
    
    return {
      id: `osm_${element.type}_${element.id}`,
      name,
      lat,
      lng: lon,
      description,
      type,
      metadata: {
        hut_type: tags.tourism || tags.amenity || 'unknown',
        ...(tags.operator ? { operator: tags.operator } : {}),
        ...(tags.fee ? { fee: tags.fee } : {}),
        ...(tags.capacity ? { capacity: tags.capacity } : {}),
        ...(tags.reservation ? { reservation: tags.reservation } : {}),
        ...(tags.wheelchair ? { wheelchair: tags.wheelchair } : {}),
        ...(tags.opening_hours ? { opening_hours: tags.opening_hours } : {}),
        ...(tags.website && { website: tags.website }),
        ...(tags.phone && { phone: tags.phone })
      },
      api_source: 'osm',
      last_updated: new Date().toISOString()
    }
  }

  /**
   * Konverterer service/infrastruktur OSM element til vårt POI format
   */
  convertServiceInfrastructureToPOI(element: OSMElement): POI {
    const lat = element.lat || element.center?.lat || 0
    const lon = element.lon || element.center?.lon || 0
    const tags = element.tags
    
    // Determine type based on OSM tags
    let type: POIType = 'rest_areas'
    
    if (tags.amenity === 'parking') {
      type = 'parking'
    } else if (tags.highway === 'rest_area' || tags.amenity === 'bench') {
      type = 'rest_areas'
    } else if (tags.amenity === 'toilets') {
      type = 'toilets'
    } else if (tags.amenity === 'drinking_water' || tags.man_made === 'water_well' || tags.natural === 'spring') {
      type = 'drinking_water'
    } else if (tags.leisure === 'fireplace' || tags.amenity === 'bbq') {
      type = 'fire_places'
    } else if (tags.tourism === 'information') {
      type = 'information_boards'
    } else if (tags.aerialway) {
      type = 'cable_cars'
    } else if (tags.public_transport === 'stop_position' || tags.highway === 'bus_stop') {
      type = 'public_transport'
    } else if (tags.railway === 'station') {
      type = 'train_stations'
    } else if (tags.sport === 'fishing' || tags.leisure === 'fishing') {
      type = 'fishing_spots'
    } else if (tags.sport === 'canoe' || tags.sport === 'kayak' || tags.route === 'canoe') {
      type = 'canoeing'
    } else if (tags.leisure === 'hammock') {
      type = 'hammock_spots'
    }
    
    const name = this.getPreferredNorwegianName(tags) || this.generateServiceInfrastructureName(tags, type)
    const description = this.getPreferredNorwegianDescription(tags) || this.generateServiceInfrastructureDescription(tags)
    
    return {
      id: `osm_${element.type}_${element.id}`,
      name,
      lat,
      lng: lon,
      description,
      type,
      metadata: {
        service_type: tags.amenity || tags.highway || tags.tourism || tags.aerialway || tags.railway || tags.sport || tags.leisure || 'unknown',
        ...(tags.access ? { access: tags.access } : {}),
        ...(tags.fee ? { fee: tags.fee } : {}),
        ...(tags.capacity ? { capacity: tags.capacity } : {}),
        ...(tags.opening_hours ? { opening_hours: tags.opening_hours } : {}),
        ...(tags.operator ? { operator: tags.operator } : {}),
        ...(tags.website && { website: tags.website }),
        ...(tags.phone && { phone: tags.phone })
      },
      api_source: 'osm',
      last_updated: new Date().toISOString()
    }
  }

  /**
   * Konverterer OSM element til vårt POI format
   */
  convertToPOI(element: OSMElement, suitability: ReturnType<typeof this.analyzeCampingSuitability>): POI {
    const lat = element.lat || element.center?.lat || 0
    const lon = element.lon || element.center?.lon || 0
    const tags = element.tags
    
    // Determine main type based on suitability and tags using new naming
    let type: POIType = 'camping_site'
    
    // Check specific amenity/tourism tags first
    if (tags.amenity === 'shelter' || tags.tourism === 'wilderness_hut') {
      type = 'wilderness_shelter'
    } else if (tags.tourism === 'camp_site') {
      type = 'camping_site'
    } else if (suitability.hammockSuitable && suitability.confidence > 0.6) {
      type = 'wild_camping'  // Previously hammock_spot
    } else if (suitability.tentSuitable) {
      type = 'tent_area'     // Previously tent_spot
    }
    
    // Lag CampingMetadata med riktige typer
    const campingMetadata: CampingMetadata = {
      terrain: this.getTerrainType(tags),
      trees: suitability.hammockSuitable,
      water_nearby: this.hasWaterNearby(tags),
      wind_protection: this.getWindProtection(tags),
      legal_status: this.getLegalStatus(tags),
      facilities: this.getFacilities(tags),
      season_best: this.getBestSeasons(tags),
      difficulty_access: this.getAccessDifficulty(tags),
      confidence: suitability.confidence
    }

    // Legg til tree_types hvis vi har trær
    if (suitability.hammockSuitable) {
      campingMetadata.tree_types = this.getTreeTypes(tags)
    }
    
    return {
      id: `osm_${element.type}_${element.id}`,
      name: tags.name || this.generateName(tags, type),
      lat,
      lng: lon,
      description: this.generateDescription(tags, suitability),
      type,
      metadata: campingMetadata,
      api_source: 'osm',
      last_updated: new Date().toISOString()
    }
  }

  private generateName(tags: Record<string, string>, type: POIType): string {
    if (tags.name) return tags.name
    
    const typeNames: Record<POIType, string> = {
      // Friluftsliv
      hiking: 'Tursti',
      mountain_peaks: 'Fjelltopp',
      ski_trails: 'Skiløype',
      swimming: 'Badeplass',
      beach: 'Strand',
      lakes_rivers: 'Vannkilde',
      ice_fishing: 'Isfiskeplass',
      // Overnatting
      staffed_huts: 'Betjent DNT-hytte',
      self_service_huts: 'Ubetjent hytte',
      wilderness_shelter: 'Gapahuk',
      camping_site: 'Campingplass',
      tent_area: 'Teltområde',
      wild_camping: 'Hengekøyeplass',
      // Naturopplevelser
      nature_gems: 'Naturperle',
      viewpoints: 'Utsiktspunkt',
      cultural_landscapes: 'Kulturlandskap',
      // Kulturarv
      archaeological: 'Fornminne',
      protected_buildings: 'Vernebygg',
      industrial_heritage: 'Teknisk kulturminne',
      churches: 'Kirke',
      war_memorials: 'Krigsminne',
      peace_monuments: 'Fredsmonument',
      underwater_heritage: 'Undervannsarv',
      intangible_heritage: 'Kulturverdi',
      // Service
      mountain_service: 'Serveringssted',
      accessible_sites: 'Tilgjengelig sted',
      // Bergen-inspirerte kategorier
      fishing_spots: 'Fiskeplass',
      canoeing: 'Kanopadling',
      parking: 'Parkering',
      rest_areas: 'Rasteplass',
      cable_cars: 'Taubane',
      public_transport: 'Holdeplass',
      train_stations: 'Togstasjon',
      information_boards: 'Informasjonstavle',
      toilets: 'Toalett',
      drinking_water: 'Drikkevann',
      fire_places: 'Bålplass',
      hammock_spots: 'Hengekøyeplass'
    }
    
    return typeNames[type] || 'Ukjent plass'
  }

  private generateDescription(tags: Record<string, string>, suitability: ReturnType<typeof this.analyzeCampingSuitability>): string {
    const descriptions = []
    
    if (suitability.tentSuitable) descriptions.push('Egnet for telt')
    if (suitability.hammockSuitable) descriptions.push('Egnet for hengekøye')
    if (suitability.underStarsSuitable) descriptions.push('Egnet for å sove under åpen himmel')
    
    // Use Norwegian description if available, otherwise generate based on features
    const norwegianDescription = this.getPreferredNorwegianDescription(tags)
    if (norwegianDescription) {
      descriptions.push(norwegianDescription)
    } else if (tags.amenity || tags.tourism || tags.natural) {
      // Generate contextual description based on OSM tags
      descriptions.push(this.generateContextualDescription(tags))
    }
    
    return descriptions.join('. ') || 'Potensielt overnattingssted i naturen.'
  }

  private generateContextualDescription(tags: Record<string, string>): string {
    // Generate Norwegian descriptions based on OSM tags
    if (tags.tourism === 'camp_site') return 'Etablert campingplass'
    if (tags.amenity === 'shelter') return 'Skjul eller gapahuk'
    if (tags.tourism === 'wilderness_hut') return 'Hytte i naturen'
    if (tags.natural === 'beach') return 'Strand eller badeplass'
    if (tags.natural === 'clearing') return 'Åpen plass i skogen'
    if (tags.natural === 'grassland') return 'Åpent grasområde'
    if (tags.leisure === 'picnic_site') return 'Rasteplass med bord og benker'
    if (tags.leisure === 'fireplace') return 'Plass med bålmuligheter'
    return 'Naturområde'
  }

  private getTerrainType(tags: Record<string, string>): 'flat' | 'sloped' | 'rocky' | 'soft' {
    if (tags.natural === 'beach') return 'soft'
    if (tags.natural === 'rock') return 'rocky'
    if (tags.natural === 'grassland') return 'flat'
    if (tags.surface === 'grass') return 'flat'
    return 'flat' // default
  }

  private hasWaterNearby(tags: Record<string, string>): boolean {
    return tags.natural === 'beach' || 
           tags.water === 'yes' ||
           !!tags.drinking_water ||
           tags.amenity === 'drinking_water'
  }

  private getWindProtection(tags: Record<string, string>): 'good' | 'moderate' | 'poor' {
    if (tags.natural === 'forest' || tags.natural === 'wood') return 'good'
    if (tags.amenity === 'shelter') return 'good'
    if (tags.natural === 'grassland') return 'poor'
    if (tags.natural === 'clearing') return 'moderate'
    return 'moderate'
  }

  private getLegalStatus(tags: Record<string, string>): 'allowed' | 'restricted' | 'private' | 'unknown' {
    if (tags.access === 'private') return 'private'
    if (tags.access === 'no') return 'restricted'
    if (tags.tourism === 'camp_site') return 'allowed'
    if (tags.amenity === 'shelter') return 'allowed'
    return 'unknown'
  }

  private getFacilities(tags: Record<string, string>): string[] {
    const facilities = []
    if (tags.fireplace === 'yes' || tags.leisure === 'fireplace') facilities.push('bålplass')
    if (tags.toilets === 'yes') facilities.push('toalett')
    if (tags.amenity === 'shelter') facilities.push('skjul')
    if (tags.drinking_water === 'yes' || tags.amenity === 'drinking_water') facilities.push('drikkevann')
    if (tags.amenity === 'toilets') facilities.push('toalett')
    return facilities
  }

  private getBestSeasons(tags: Record<string, string>): string[] {
    // Enkel analyse - kan forbedres med mer data
    if (tags.seasonal === 'summer') return ['sommer']
    if (tags.winter === 'yes') return ['sommer', 'vinter']
    if (tags.amenity === 'shelter') return ['hele året']
    return ['sommer'] // default for Norge
  }

  private getAccessDifficulty(tags: Record<string, string>): 'easy' | 'moderate' | 'difficult' {
    if (tags.highway || tags.access === 'yes') return 'easy'
    if (tags.motor_vehicle === 'no') return 'moderate'
    if (tags.sac_scale) {
      if (['hiking', 'mountain_hiking'].includes(tags.sac_scale)) return 'moderate'
      if (['demanding_mountain_hiking', 'alpine_hiking'].includes(tags.sac_scale)) return 'difficult'
    }
    if (tags.tourism === 'camp_site') return 'easy'
    return 'moderate' // default
  }

  private getTreeTypes(tags: Record<string, string>): string[] {
    const treeTypes = []
    if (tags.leaf_type === 'broadleaved') treeTypes.push('bjørk')
    if (tags.leaf_type === 'needleleaved') treeTypes.push('furu', 'gran')
    if (tags.leaf_type === 'mixed') treeTypes.push('bjørk', 'furu', 'gran')
    if (tags.species && tags.species.includes('pine')) treeTypes.push('furu')
    if (tags.species && tags.species.includes('spruce')) treeTypes.push('gran')
    if (tags.species && tags.species.includes('birch')) treeTypes.push('bjørk')
    
    // Default hvis ingen spesifikk info
    if (treeTypes.length === 0 && (tags.natural === 'forest' || tags.natural === 'wood')) {
      treeTypes.push('blandingsskog')
    }
    
    return treeTypes
  }

  /**
   * Henter foretrukket norsk navn fra OSM tags
   */
  private getPreferredNorwegianName(tags: Record<string, string>): string | null {
    // Prioriter norske navn
    if (tags['name:no']) return tags['name:no']
    if (tags['name:nb']) return tags['name:nb']  // Bokmål
    if (tags['name:nn']) return tags['name:nn']  // Nynorsk
    if (tags.name) return tags.name
    if (tags['alt_name:no']) return tags['alt_name:no']
    if (tags.alt_name) return tags.alt_name
    return null
  }

  /**
   * Henter foretrukket norsk beskrivelse fra OSM tags
   */
  private getPreferredNorwegianDescription(tags: Record<string, string>): string | null {
    // Prioriter norske beskrivelser
    if (tags['description:no']) return tags['description:no']
    if (tags['description:nb']) return tags['description:nb']
    if (tags['description:nn']) return tags['description:nn']
    if (tags.description) return tags.description
    if (tags.inscription) return `Inskripsjon: ${tags.inscription}`
    return null
  }

  /**
   * Genererer norsk navn for krigsminne/kulturarv POI
   */
  private generateWarMemorialName(tags: Record<string, string>, type: POIType): string {
    const typeNames: Record<string, string> = {
      'war_memorials': 'Krigsminne',
      'peace_monuments': 'Fredsmonument', 
      'archaeological': 'Fornminne',
      'churches': 'Kirke',
      'protected_buildings': 'Historisk bygning'
    }
    
    const baseName = typeNames[type] || 'Kulturminne'
    
    // Legg til stedsnavn hvis tilgjengelig
    if (tags.addr_place || tags['addr:place']) {
      return `${baseName} i ${tags.addr_place || tags['addr:place']}`
    }
    if (tags.addr_city || tags['addr:city']) {
      return `${baseName} i ${tags.addr_city || tags['addr:city']}`
    }
    
    return baseName
  }

  /**
   * Genererer norsk beskrivelse for krigsminne/kulturarv POI
   */
  private generateWarMemorialDescription(tags: Record<string, string>): string {
    const descriptions = []
    
    if (tags.historic) {
      const historicTypes: Record<string, string> = {
        'memorial': 'Minnesmerke',
        'monument': 'Monument',
        'bunker': 'Bunkers fra krigen',
        'archaeological_site': 'Arkeologisk lokalitet',
        'tomb': 'Gravsted',
        'ruins': 'Ruiner'
      }
      descriptions.push(historicTypes[tags.historic] || `Historisk ${tags.historic}`)
    }
    
    if (tags.memorial) {
      const memorialTypes: Record<string, string> = {
        'war': 'til minne om krigen',
        'peace': 'fredsmonument',
        'war_grave': 'krigsgrav'
      }
      descriptions.push(memorialTypes[tags.memorial] || `minnesmerke for ${tags.memorial}`)
    }
    
    if (tags['start_date'] || tags.year) {
      descriptions.push(`fra ${tags['start_date'] || tags.year}`)
    }
    
    if (tags.inscription) {
      descriptions.push(`Inskripsjon: "${tags.inscription}"`)
    }
    
    return descriptions.length > 0 
      ? descriptions.join('. ').charAt(0).toUpperCase() + descriptions.join('. ').slice(1) + '.'
      : 'Historisk kulturminne i Norge.'
  }

  /**
   * Genererer norsk navn for friluftsliv POI
   */
  private generateOutdoorRecreationName(tags: Record<string, string>, type: POIType): string {
    const typeNames: Record<string, string> = {
      'hiking': 'Tursti',
      'mountain_peaks': 'Fjelltopp',
      'ski_trails': 'Skiløype',
      'swimming': 'Badeplass',
      'beach': 'Strand',
      'lakes_rivers': 'Vannkilde',
      'ice_fishing': 'Isfiskeplass',
      'nature_gems': 'Naturperle',
      'viewpoints': 'Utsiktspunkt',
      'cultural_landscapes': 'Kulturlandskap'
    }
    
    const baseName = typeNames[type] || 'Utendørsområde'
    
    // Add elevation for peaks
    if (type === 'mountain_peaks' && tags.ele) {
      return `${baseName} (${tags.ele}m)`
    }
    
    // Add place name if available
    if (tags.addr_place || tags['addr:place']) {
      return `${baseName} i ${tags.addr_place || tags['addr:place']}`
    }
    if (tags.addr_city || tags['addr:city']) {
      return `${baseName} i ${tags.addr_city || tags['addr:city']}`
    }
    
    return tags.ref ? `${baseName} ${tags.ref}` : baseName
  }

  /**
   * Genererer norsk beskrivelse for friluftsliv POI
   */
  private generateOutdoorRecreationDescription(tags: Record<string, string>): string {
    const descriptions = []
    
    if (tags.natural === 'peak' && tags.ele) {
      descriptions.push(`Fjelltopp ${tags.ele} meter over havet`)
    }
    
    if (tags.surface) {
      const surfaceTypes: Record<string, string> = {
        'paved': 'asfaltert',
        'unpaved': 'grus',
        'gravel': 'grus',
        'dirt': 'jord',
        'grass': 'gress',
        'sand': 'sand'
      }
      descriptions.push(`Underlag: ${surfaceTypes[tags.surface] || tags.surface}`)
    }
    
    if (tags.sac_scale) {
      const difficultyMap: Record<string, string> = {
        'hiking': 'lett tur',
        'mountain_hiking': 'fjelltur',
        'demanding_mountain_hiking': 'krevende fjelltur',
        'alpine_hiking': 'alpin tur'
      }
      descriptions.push(`Vanskelighetsgrad: ${difficultyMap[tags.sac_scale] || tags.sac_scale}`)
    }
    
    if (tags.operator) {
      descriptions.push(`Driftes av ${tags.operator}`)
    }
    
    return descriptions.length > 0 
      ? descriptions.join('. ') + '.'
      : 'Friluftsliv og naturopplevelser i Norge.'
  }

  /**
   * Genererer norsk navn for hytter/service POI
   */
  private generateHutAndServiceName(tags: Record<string, string>, type: POIType): string {
    const typeNames: Record<string, string> = {
      'staffed_huts': 'Betjent DNT-hytte',
      'self_service_huts': 'Ubetjent hytte',
      'wilderness_shelter': 'Gapahuk',
      'mountain_service': 'Serveringssted',
      'accessible_sites': 'Tilgjengelig sted'
    }
    
    const baseName = typeNames[type] || 'Hytte'
    
    // Add operator name if DNT
    if (tags.operator?.includes('DNT')) {
      return `DNT ${baseName}`
    }
    
    // Add place name if available
    if (tags.addr_place || tags['addr:place']) {
      return `${baseName} i ${tags.addr_place || tags['addr:place']}`
    }
    
    return baseName
  }

  /**
   * Genererer norsk beskrivelse for hytter/service POI
   */
  private generateHutAndServiceDescription(tags: Record<string, string>): string {
    const descriptions = []
    
    if (tags.capacity) {
      descriptions.push(`Kapasitet: ${tags.capacity} personer`)
    }
    
    if (tags.fee === 'yes') {
      descriptions.push('Servering og betaling påkrevd')
    } else if (tags.fee === 'no') {
      descriptions.push('Selvbetjent og gratis')
    }
    
    if (tags.reservation === 'required') {
      descriptions.push('Forhåndsbestilling påkrevd')
    } else if (tags.reservation === 'recommended') {
      descriptions.push('Forhåndsbestilling anbefales')
    }
    
    if (tags.wheelchair === 'yes') {
      descriptions.push('Tilrettelagt for rullestol')
    }
    
    if (tags.opening_hours) {
      descriptions.push(`Åpningstider: ${tags.opening_hours}`)
    }
    
    return descriptions.length > 0 
      ? descriptions.join('. ') + '.'
      : 'Overnatting og service i norsk natur.'
  }

  /**
   * Genererer norsk navn for service/infrastruktur POI
   */
  private generateServiceInfrastructureName(tags: Record<string, string>, type: POIType): string {
    const typeNames: Record<string, string> = {
      'parking': 'Parkering',
      'rest_areas': 'Rasteplass',
      'toilets': 'Toalett',
      'drinking_water': 'Drikkevann',
      'fire_places': 'Bålplass',
      'information_boards': 'Informasjonstavle',
      'cable_cars': 'Taubane',
      'public_transport': 'Holdeplass',
      'train_stations': 'Togstasjon',
      'fishing_spots': 'Fiskeplass',
      'canoeing': 'Kanopadling',
      'hammock_spots': 'Hengekøyeplass'
    }
    
    const baseName = typeNames[type] || 'Service'
    
    // Add operator or location if available
    if (tags.operator) {
      return `${tags.operator} ${baseName}`
    }
    
    if (tags.addr_place || tags['addr:place']) {
      return `${baseName} i ${tags.addr_place || tags['addr:place']}`
    }
    
    return baseName
  }

  /**
   * Genererer norsk beskrivelse for service/infrastruktur POI
   */
  private generateServiceInfrastructureDescription(tags: Record<string, string>): string {
    const descriptions = []
    
    if (tags.capacity) {
      descriptions.push(`Kapasitet: ${tags.capacity}`)
    }
    
    if (tags.access === 'private') {
      descriptions.push('Privat tilgang')
    } else if (tags.access === 'public') {
      descriptions.push('Offentlig tilgjengelig')
    }
    
    if (tags.fee === 'yes') {
      descriptions.push('Avgift påkrevd')
    } else if (tags.fee === 'no') {
      descriptions.push('Gratis')
    }
    
    if (tags.opening_hours) {
      descriptions.push(`Åpningstider: ${tags.opening_hours}`)
    }
    
    if (tags.operator) {
      descriptions.push(`Driftes av ${tags.operator}`)
    }
    
    return descriptions.length > 0 
      ? descriptions.join('. ') + '.'
      : 'Service og infrastruktur for friluftsaktiviteter.'
  }
}
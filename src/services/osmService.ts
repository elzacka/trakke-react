// src/services/osmService.ts
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

// Bounding box for Bykle og Valle kommuner
const BYKLE_VALLE_BBOX = {
  south: 59.0,   // Sør-grense
  west: 6.8,     // Vest-grense  
  north: 59.8,   // Nord-grense
  east: 8.2      // Øst-grense
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
   * Bygger Overpass QL query for camping-relaterte POI-er
   */
  private buildCampingQuery(): string {
    const { south, west, north, east } = BYKLE_VALLE_BBOX
    
    return `
      [out:json][timeout:25];
      (
        // Eksisterende campingplasser
        node["tourism"="camp_site"](${south},${west},${north},${east});
        way["tourism"="camp_site"](${south},${west},${north},${east});
        
        // Vindskjul og gapahuk
        node["amenity"="shelter"](${south},${west},${north},${east});
        way["amenity"="shelter"](${south},${west},${north},${east});
        
        // DNT-hytter og andre hytter
        node["tourism"="wilderness_hut"](${south},${west},${north},${east});
        way["tourism"="wilderness_hut"](${south},${west},${north},${east});
        
        // Picnic-områder (ofte flate og egnede for telt)
        node["leisure"="picnic_site"](${south},${west},${north},${east});
        way["leisure"="picnic_site"](${south},${west},${north},${east});
        
        // Bålplasser
        node["leisure"="fireplace"](${south},${west},${north},${east});
        way["leisure"="fireplace"](${south},${west},${north},${east});
        
        // Naturlige badeplasser (ofte flate områder)
        node["natural"="beach"](${south},${west},${north},${east});
        way["natural"="beach"](${south},${west},${north},${east});
        
        // Clearings i skog (potensielle camping-spotter)
        node["natural"="clearing"](${south},${west},${north},${east});
        way["natural"="clearing"](${south},${west},${north},${east});
        
        // Åpne områder
        node["natural"="grassland"](${south},${west},${north},${east});
        way["natural"="grassland"](${south},${west},${north},${east});
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
   * Konverterer OSM element til vårt POI format
   */
  convertToPOI(element: OSMElement, suitability: ReturnType<typeof this.analyzeCampingSuitability>): any {
    const lat = element.lat || element.center?.lat || 0
    const lon = element.lon || element.center?.lon || 0
    const tags = element.tags
    
    // Bestem hovedtype basert på egnethet
    let type = 'camping_site'
    if (suitability.hammockSuitable && suitability.confidence > 0.6) {
      type = 'hammock_spot'
    } else if (suitability.underStarsSuitable && suitability.confidence > 0.6) {
      type = 'under_stars'
    } else if (suitability.tentSuitable) {
      type = 'tent_spot'
    }
    
    if (tags.amenity === 'shelter') type = 'wilderness_shelter'
    if (tags.tourism === 'wilderness_hut') type = 'wilderness_shelter'
    
    return {
      id: `osm_${element.type}_${element.id}`,
      name: tags.name || this.generateName(tags, type),
      lat,
      lng: lon,
      description: this.generateDescription(tags, suitability),
      type,
      metadata: {
        terrain: this.getTerrainType(tags),
        trees: suitability.hammockSuitable,
        water_nearby: this.hasWaterNearby(tags),
        wind_protection: this.getWindProtection(tags),
        legal_status: this.getLegalStatus(tags),
        facilities: this.getFacilities(tags),
        season_best: this.getBestSeasons(tags),
        difficulty_access: this.getAccessDifficulty(tags),
        confidence: suitability.confidence
      },
      api_source: 'osm',
      last_updated: new Date().toISOString()
    }
  }

  private generateName(tags: Record<string, string>, type: string): string {
    if (tags.name) return tags.name
    
    const typeNames = {
      camping_site: 'Campingplass',
      tent_spot: 'Teltplass',
      hammock_spot: 'Hengekøyeplass',
      under_stars: 'Stjernehimmel-spot',
      wilderness_shelter: 'Vindskjul'
    }
    
    return typeNames[type as keyof typeof typeNames] || 'Ukjent plass'
  }

  private generateDescription(tags: Record<string, string>, suitability: any): string {
    const descriptions = []
    
    if (suitability.tentSuitable) descriptions.push('Egnet for telt')
    if (suitability.hammockSuitable) descriptions.push('Egnet for hengekøye')
    if (suitability.underStarsSuitable) descriptions.push('Egnet for å sove under åpen himmel')
    
    if (tags.description) descriptions.push(tags.description)
    if (tags.shelter_type) descriptions.push(`Type: ${tags.shelter_type}`)
    
    return descriptions.join('. ') || 'Potensielt overnattingssted i naturen.'
  }

  private getTerrainType(tags: Record<string, string>): string {
    if (tags.natural === 'beach') return 'soft'
    if (tags.natural === 'rock') return 'rocky'
    if (tags.natural === 'grassland') return 'flat'
    return 'flat' // default
  }

  private hasWaterNearby(tags: Record<string, string>): boolean {
    return tags.natural === 'beach' || 
           tags.water === 'yes' ||
           !!tags.drinking_water
  }

  private getWindProtection(tags: Record<string, string>): string {
    if (tags.natural === 'forest' || tags.natural === 'wood') return 'good'
    if (tags.amenity === 'shelter') return 'good'
    if (tags.natural === 'grassland') return 'poor'
    return 'moderate'
  }

  private getLegalStatus(tags: Record<string, string>): string {
    if (tags.access === 'private') return 'private'
    if (tags.access === 'no') return 'restricted'
    if (tags.tourism === 'camp_site') return 'allowed'
    return 'unknown'
  }

  private getFacilities(tags: Record<string, string>): string[] {
    const facilities = []
    if (tags.fireplace === 'yes' || tags.leisure === 'fireplace') facilities.push('fireplace')
    if (tags.toilets === 'yes') facilities.push('toilet')
    if (tags.amenity === 'shelter') facilities.push('shelter')
    if (tags.drinking_water === 'yes') facilities.push('water')
    return facilities
  }

  private getBestSeasons(tags: Record<string, string>): string[] {
    // Enkel analyse - kan forbedres med mer data
    if (tags.seasonal === 'summer') return ['summer']
    if (tags.winter === 'yes') return ['summer', 'winter']
    return ['summer'] // default for Norge
  }

  private getAccessDifficulty(tags: Record<string, string>): string {
    if (tags.highway || tags.access === 'yes') return 'easy'
    if (tags.sac_scale) {
      if (['hiking', 'mountain_hiking'].includes(tags.sac_scale)) return 'moderate'
      if (['demanding_mountain_hiking', 'alpine_hiking'].includes(tags.sac_scale)) return 'difficult'
    }
    return 'moderate' // default
  }
}
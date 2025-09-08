/**
 * Service for fetching POI data from OpenStreetMap using Overpass API
 * Specializes in Norwegian historic and military sites
 */

export interface OverpassPOI {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  category: string
  tags: Record<string, string>
  lastUpdated?: string
}

export interface POIBounds {
  north: number
  south: number
  east: number
  west: number
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  tags: Record<string, string>
  center?: { lat: number; lon: number }
}

interface OverpassResponse {
  version: number
  generator: string
  elements: OverpassElement[]
}

export class OverpassService {
  private static readonly BASE_URL = 'https://overpass-api.de/api/interpreter'
  private static readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
  private static cache = new Map<string, { data: OverpassPOI[], timestamp: number }>()

  /**
   * Fetch Krigsminne (war memorial) POIs from OpenStreetMap
   * Queries for historic=fort, historic=castle, and military tags
   */
  static async fetchKrigsminnePOIs(bounds: POIBounds): Promise<OverpassPOI[]> {
    const cacheKey = `krigsminner_norway_${bounds.north},${bounds.south},${bounds.east},${bounds.west}`
    
    // Check cache first (temporarily disabled for testing)
    // const cached = this.cache.get(cacheKey)
    // if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
    //   console.log('🗄️ Using cached Krigsminne data')
    //   return cached.data
    // }

    try {
      console.log('🔄 Fetching Krigsminne from OpenStreetMap...', bounds)
      
      // Constrain bounds to Norway's geographic limits
      const norwayBounds = {
        north: Math.min(bounds.north, 72.0),  // Norway's northernmost point
        south: Math.max(bounds.south, 57.5),  // Norway's southernmost point  
        east: Math.min(bounds.east, 32.0),    // Norway's easternmost point
        west: Math.max(bounds.west, 4.0)      // Norway's westernmost point
      }

      // Debug the Overpass query by logging the bounds and query
      console.log('🗺️ Query bounds:', norwayBounds)
      
      // Specific query for war memorials/Krigsminne only
      const overpassQuery = `
        [out:json][timeout:25];
        (
          // War memorials specifically
          node["historic"="memorial"]["memorial"="war_memorial"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["historic"="memorial"]["memorial"="war_memorial"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          
          // Historic forts (defensive structures)
          node["historic"="fort"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["historic"="fort"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          
          // WWII bunkers (actual war sites)
          node["military"="bunker"]["bunker_type"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          
          // Historic battlefields
          node["historic"="battlefield"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
        );
        out center body 100;
      `.trim()
      
      console.log('🔍 Overpass query:', overpassQuery)

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
          'User-Agent': 'Tråkke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
        },
        body: overpassQuery
      })

      if (!response.ok) {
        throw new Error(`Overpass API request failed: ${response.status}`)
      }

      // Ensure proper UTF-8 decoding
      const responseText = await response.text()
      const data = JSON.parse(responseText)
      console.log('📊 Raw Overpass response:', data)
      
      // Debug: Check for Norwegian characters in response
      const sampleElements = data.elements?.slice(0, 3) || []
      sampleElements.forEach((element: { tags?: { name?: string } }, index: number) => {
        if (element.tags?.name) {
          console.log(`🔍 Sample name ${index + 1}:`, element.tags.name)
        }
      })
      
      const pois = this.transformOverpassDataToPOIs(data)
      console.log(`🔄 Transformed ${pois.length} Krigsminne POIs from Overpass API`)

      // Cache the results
      this.cache.set(cacheKey, { data: pois, timestamp: Date.now() })
      
      console.log(`✅ Fetched ${pois.length} Krigsminne POIs from OpenStreetMap`)
      return pois

    } catch (error) {
      console.error('❌ Error fetching Krigsminne from Overpass API:', error)
      return []
    }
  }

  /**
   * Fetch cave entrance POIs from OpenStreetMap
   * Queries for natural=cave_entrance tags
   */
  static async fetchCaveEntrancePOIs(bounds: POIBounds): Promise<OverpassPOI[]> {
    const cacheKey = `caves_norway_${bounds.north},${bounds.south},${bounds.east},${bounds.west}`
    
    try {
      console.log('🕳️ Fetching cave entrances from OpenStreetMap...', bounds)
      
      // Constrain bounds to Norway's geographic limits
      const norwayBounds = {
        north: Math.min(bounds.north, 72.0),  // Norway's northernmost point
        south: Math.max(bounds.south, 57.5),  // Norway's southernmost point  
        east: Math.min(bounds.east, 32.0),    // Norway's easternmost point
        west: Math.max(bounds.west, 4.0)      // Norway's westernmost point
      }

      console.log('🗺️ Query bounds:', norwayBounds)
      
      // Specific query for cave entrances only
      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Natural cave entrances
          node["natural"="cave_entrance"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["natural"="cave_entrance"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
        );
        out center body 100;
      `.trim()
      
      console.log('🔍 Cave entrance Overpass query:', overpassQuery)

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
          'User-Agent': 'Tråkke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
        },
        body: overpassQuery
      })

      if (!response.ok) {
        throw new Error(`Overpass API request failed: ${response.status}`)
      }

      const responseText = await response.text()
      const data = JSON.parse(responseText)
      console.log('📊 Raw cave entrance Overpass response:', data)
      
      const pois = this.transformCaveEntranceDataToPOIs(data)
      console.log(`🕳️ Transformed ${pois.length} cave entrance POIs from Overpass API`)

      // Cache the results
      this.cache.set(cacheKey, { data: pois, timestamp: Date.now() })
      
      console.log(`✅ Fetched ${pois.length} cave entrance POIs from OpenStreetMap`)
      return pois

    } catch (error) {
      console.error('❌ Error fetching cave entrances from Overpass API:', error)
      return []
    }
  }

  /**
   * Fetch observation towers and watchtowers from OpenStreetMap
   * Queries for man_made=tower with tower:type=observation or tower:type=watchtower
   */
  static async fetchObservationTowerPOIs(bounds: POIBounds): Promise<OverpassPOI[]> {
    const cacheKey = `towers_norway_${bounds.north},${bounds.south},${bounds.east},${bounds.west}`
    
    try {
      console.log('🗼 Fetching observation towers from OpenStreetMap...', bounds)
      
      // Constrain bounds to Norway's geographic limits
      const norwayBounds = {
        north: Math.min(bounds.north, 72.0),  // Norway's northernmost point
        south: Math.max(bounds.south, 57.5),  // Norway's southernmost point  
        east: Math.min(bounds.east, 32.0),    // Norway's easternmost point
        west: Math.max(bounds.west, 4.0)      // Norway's westernmost point
      }

      console.log('🗺️ Query bounds:', norwayBounds)
      
      // Specific query for observation towers and watchtowers
      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Observation towers
          node["man_made"="tower"]["tower:type"="observation"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["man_made"="tower"]["tower:type"="observation"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          
          // Watchtowers (for fire observation, military observation, etc.)
          node["man_made"="tower"]["tower:type"="watchtower"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["man_made"="tower"]["tower:type"="watchtower"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          
          // General observation towers (some may not have tower:type tag)
          node["man_made"="tower"]["tourism"="viewpoint"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
        );
        out center body 100;
      `.trim()
      
      console.log('🔍 Observation tower Overpass query:', overpassQuery)

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
          'User-Agent': 'Tråkke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
        },
        body: overpassQuery
      })

      if (!response.ok) {
        throw new Error(`Overpass API request failed: ${response.status}`)
      }

      const responseText = await response.text()
      const data = JSON.parse(responseText)
      console.log('📊 Raw observation tower Overpass response:', data)
      
      const pois = this.transformObservationTowerDataToPOIs(data)
      console.log(`🗼 Transformed ${pois.length} observation tower POIs from Overpass API`)

      // Cache the results
      this.cache.set(cacheKey, { data: pois, timestamp: Date.now() })
      
      console.log(`✅ Fetched ${pois.length} observation tower POIs from OpenStreetMap`)
      return pois

    } catch (error) {
      console.error('❌ Error fetching observation towers from Overpass API:', error)
      return []
    }
  }

  /**
   * Transform Overpass API response to our POI format
   */
  private static transformOverpassDataToPOIs(overpassData: OverpassResponse): OverpassPOI[] {
    if (!overpassData.elements) {
      return []
    }

    const pois: OverpassPOI[] = []
    
    overpassData.elements.forEach((element: OverpassElement) => {
      try {
        let lat: number, lng: number

        // Handle different OSM element types
        if (element.type === 'node') {
          if (element.lat === undefined || element.lon === undefined) {
            return
          }
          lat = element.lat
          lng = element.lon
        } else if (element.type === 'way' || element.type === 'relation') {
          // For ways and relations, we need to use center coordinates
          if (element.center) {
            lat = element.center.lat
            lng = element.center.lon
          } else {
            // Skip if no coordinates available
            return
          }
        } else {
          return
        }

        // Validate coordinates and ensure they're within Norway's boundaries
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return
        }
        
        // Additional Norway boundary check to exclude neighboring countries
        if (lat < 57.5 || lat > 72.0 || lng < 4.0 || lng > 32.0) {
          return
        }

        const tags = element.tags || {}
        
        // Generate Norwegian name
        const name = this.extractName(tags)
        
        // Generate description
        const _description = this.generateDescription(tags)
        
        // Determine type
        const type = this.determineType(tags)

        const poi: OverpassPOI = {
          id: `osm_${element.type}_${element.id}`,
          name,
          type,
          lat,
          lng,
          category: 'war_memorials', // All are categorized as war memorials
          tags,
          lastUpdated: new Date().toISOString()
        }

        pois.push(poi)
      } catch (error) {
        console.error(`❌ Failed to process Overpass element:`, error)
      }
    })

    console.log(`✅ Converted ${pois.length} Krigsminne POIs from Overpass data`)
    return pois
  }

  /**
   * Transform cave entrance Overpass API response to our POI format
   */
  private static transformCaveEntranceDataToPOIs(overpassData: OverpassResponse): OverpassPOI[] {
    if (!overpassData.elements) {
      return []
    }

    const pois: OverpassPOI[] = []
    
    overpassData.elements.forEach((element: OverpassElement) => {
      try {
        let lat: number, lng: number

        // Handle different OSM element types
        if (element.type === 'node') {
          if (element.lat === undefined || element.lon === undefined) {
            return
          }
          lat = element.lat
          lng = element.lon
        } else if (element.type === 'way' || element.type === 'relation') {
          // For ways and relations, we need to use center coordinates
          if (element.center) {
            lat = element.center.lat
            lng = element.center.lon
          } else {
            // Skip if no coordinates available
            return
          }
        } else {
          return
        }

        // Validate coordinates and ensure they're within Norway's boundaries
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return
        }
        
        // Additional Norway boundary check to exclude neighboring countries
        if (lat < 57.5 || lat > 72.0 || lng < 4.0 || lng > 32.0) {
          return
        }

        const tags = element.tags || {}
        
        // Generate Norwegian name for cave
        const name = this.extractCaveName(tags)
        
        // Generate cave description
        const _description = this.generateCaveDescription(tags)
        
        // Determine cave type
        const type = this.determineCaveType(tags)

        const poi: OverpassPOI = {
          id: `osm_${element.type}_${element.id}`,
          name,
          type,
          lat,
          lng,
          category: 'caves', // All are categorized as caves
          tags,
          lastUpdated: new Date().toISOString()
        }

        pois.push(poi)
      } catch (error) {
        console.error(`❌ Failed to process cave entrance element:`, error)
      }
    })

    console.log(`✅ Converted ${pois.length} cave entrance POIs from Overpass data`)
    return pois
  }

  /**
   * Transform observation tower Overpass API response to our POI format
   */
  private static transformObservationTowerDataToPOIs(overpassData: OverpassResponse): OverpassPOI[] {
    if (!overpassData.elements) {
      return []
    }

    const pois: OverpassPOI[] = []
    
    overpassData.elements.forEach((element: OverpassElement) => {
      try {
        let lat: number, lng: number

        // Handle different OSM element types
        if (element.type === 'node') {
          if (element.lat === undefined || element.lon === undefined) {
            return
          }
          lat = element.lat
          lng = element.lon
        } else if (element.type === 'way' || element.type === 'relation') {
          // For ways and relations, we need to use center coordinates
          if (element.center) {
            lat = element.center.lat
            lng = element.center.lon
          } else {
            // Skip if no coordinates available
            return
          }
        } else {
          return
        }

        // Validate coordinates and ensure they're within Norway's boundaries
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return
        }
        
        // Additional Norway boundary check to exclude neighboring countries
        if (lat < 57.5 || lat > 72.0 || lng < 4.0 || lng > 32.0) {
          return
        }

        const tags = element.tags || {}
        
        // Generate Norwegian name for tower
        const name = this.extractTowerName(tags)
        
        // Generate tower description
        const _description = this.generateTowerDescription(tags)
        
        // Determine tower type
        const type = this.determineTowerType(tags)

        const poi: OverpassPOI = {
          id: `osm_${element.type}_${element.id}`,
          name,
          type,
          lat,
          lng,
          category: 'towers', // All are categorized as towers
          tags,
          lastUpdated: new Date().toISOString()
        }

        pois.push(poi)
      } catch (error) {
        console.error(`❌ Failed to process observation tower element:`, error)
      }
    })

    console.log(`✅ Converted ${pois.length} observation tower POIs from Overpass data`)
    return pois
  }

  /**
   * Ensure proper UTF-8 encoding for Norwegian characters
   */
  private static ensureUTF8(text: string): string {
    // If text contains encoded characters like "?" instead of æøå, try to fix
    if (typeof text !== 'string') return text
    
    // Ensure the text is properly decoded
    try {
      // Double-check UTF-8 encoding
      const encoded = encodeURIComponent(text)
      const decoded = decodeURIComponent(encoded)
      return decoded
    } catch {
      console.warn('UTF-8 encoding issue with text:', text)
      return text
    }
  }

  /**
   * Extract meaningful name from OSM tags with Norwegian fallbacks
   */
  private static extractName(tags: Record<string, string>): string {
    // Try Norwegian names first
    const norwegianName = tags['name:no'] || tags['name:nb'] || tags['name:nn']
    if (norwegianName) return this.ensureUTF8(norwegianName)

    // Try general name
    if (tags.name) return this.ensureUTF8(tags.name)

    // Try English name as fallback
    if (tags['name:en']) return this.ensureUTF8(tags['name:en'])

    // Generate Norwegian name based on type
    if (tags.historic === 'fort') return 'Fort'
    if (tags.historic === 'castle') return 'Slott'
    if (tags.historic === 'battlefield') return 'Slagmark'
    if (tags.historic === 'memorial') return 'Minnesmerke'
    if (tags.memorial === 'war_memorial') return 'Krigsminne'
    if (tags.memorial === 'stolperstein') return 'Snublestein'
    if (tags.military === 'bunker') return 'Bunker'
    if (tags.military === 'naval_mine') return 'Sjømine'
    if (tags.military === 'trench') return 'Skyttergraver'
    if (tags.military) return `Militært anlegg`

    return 'Historisk sted'
  }

  /**
   * Generate Norwegian description based on OSM tags
   */
  private static generateDescription(tags: Record<string, string>): string {
    const parts: string[] = []

    // Add historic type with enhanced details
    if (tags.historic === 'fort') {
      let fortDesc = 'Historisk fort'
      if (tags.ruins === 'yes') {
        fortDesc += ' (ruiner)'
      }
      parts.push(fortDesc)
    } else if (tags.historic === 'castle') {
      let castleDesc = 'Slott eller borg'
      if (tags.ruins === 'yes') {
        castleDesc += ' (ruiner)'
      }
      parts.push(castleDesc)
    } else if (tags.historic === 'battlefield') {
      parts.push('Historisk slagmark')
    } else if (tags.historic === 'memorial') {
      parts.push('Minnesmerke')
    }

    // Add construction date
    if (tags.start_date) {
      const year = tags.start_date.substring(0, 4) // Extract year from date
      if (year && !isNaN(Number(year))) {
        parts.push(`Bygget ${year}`)
      }
    }

    // Add architect information
    if (tags.architect) {
      parts.push(`Arkitekt: ${this.ensureUTF8(tags.architect)}`)
    }

    // Add heritage status
    if (tags.heritage) {
      if (tags.heritage.includes('unesco')) {
        parts.push('UNESCO-verdensarvsted')
      } else if (tags.heritage.includes('national')) {
        parts.push('Nasjonalt kulturminne')
      } else {
        parts.push('Verneverdig kulturminne')
      }
    }

    // Add military type
    if (tags.military) {
      const militaryTypes: Record<string, string> = {
        'bunker': 'militær bunker',
        'airfield': 'militært flyplassområde',
        'barracks': 'militær kaserne',
        'naval_base': 'marineanlegg',
        'range': 'skyte- og øvingsområde',
        'training_area': 'militært treningsområde',
        'danger_area': 'militært fareområde',
        'naval_mine': 'sjømine',
        'checkpoint': 'kontrollpost',
        'trench': 'skyttergraver',
        'office': 'militærkontor',
        'depot': 'militærdepot'
      }
      parts.push(militaryTypes[tags.military] || `militært anlegg (${tags.military})`)
    }

    // Add memorial details
    if (tags.memorial) {
      const memorialTypes: Record<string, string> = {
        'war_memorial': 'krigsminne',
        'stolperstein': 'snublestein',
        'statue': 'minnesmerke-statue',
        'plaque': 'minneplakett',
        'stone': 'minnestein',
        'cross': 'minnekors',
        'obelisk': 'minnesmerke-obelisk',
        'monument': 'monument'
      }
      parts.push(memorialTypes[tags.memorial] || `minnesmerke (${tags.memorial})`)
    }

    // Add time period if available
    if (tags.start_date) {
      parts.push(`fra ${tags.start_date}`)
    }

    // Add heritage status
    if (tags.heritage) {
      parts.push('kulturminneobjekt')
    }

    // Add accessibility information  
    if (tags.wheelchair === 'yes') {
      parts.push('♿ Tilgjengelig for rullestol')
    } else if (tags.wheelchair === 'limited') {
      parts.push('♿ Delvis tilgjengelig for rullestol')
    }

    // Add access information
    if (tags.access === 'private') {
      parts.push('⚠️ Privat eiendom')
    } else if (tags.access === 'no') {
      parts.push('❌ Stengt for allmennheten')
    } else if (tags.access === 'customers') {
      parts.push('🎫 Kun for kunder/besøkende')
    }

    // Add opening hours if available
    if (tags.opening_hours) {
      parts.push(`🕒 Åpningstider: ${tags.opening_hours}`)
    }

    // Add fee information
    if (tags.fee === 'yes') {
      parts.push('💰 Inngang/avgift påkrevd')
    } else if (tags.fee === 'no') {
      parts.push('🆓 Gratis inngang')
    }

    // Add Wikipedia link for more information
    if (tags.wikipedia) {
      const wikiUrl = tags.wikipedia.includes('http') 
        ? tags.wikipedia 
        : `https://no.wikipedia.org/wiki/${encodeURIComponent(tags.wikipedia.replace('no:', ''))}`
      parts.push(`📖 Les mer: ${wikiUrl}`)
    } else if (tags.wikidata) {
      parts.push(`📖 Wikidata: https://www.wikidata.org/wiki/${tags.wikidata}`)
    }

    // Add description from OSM if available
    if (tags.description) {
      parts.push(this.ensureUTF8(tags.description))
    }

    return parts.length > 0 
      ? parts.join('. ').charAt(0).toUpperCase() + parts.join('. ').slice(1) + '.'
      : 'Historisk eller militært anlegg i Norge.'
  }

  /**
   * Determine POI type based on OSM tags (Norwegian terms)
   */
  private static determineType(tags: Record<string, string>): string {
    if (tags.historic === 'fort') return 'Fort'
    if (tags.historic === 'castle') return 'Slott'
    if (tags.historic === 'battlefield') return 'Slagmark'
    if (tags.historic === 'memorial') return 'Minnesmerke'
    if (tags.memorial === 'war_memorial') return 'Krigsminne'
    if (tags.memorial === 'stolperstein') return 'Snublestein'
    if (tags.military === 'bunker') return 'Bunker'
    if (tags.military === 'naval_mine') return 'Sjømine'
    if (tags.military === 'trench') return 'Skyttergraver'
    if (tags.military === 'naval_base') return 'Marineanlegg'
    if (tags.military) return 'Militæranlegg'
    
    return 'Historisk sted'
  }

  /**
   * Extract meaningful name from OSM tags for caves with Norwegian fallbacks
   */
  private static extractCaveName(tags: Record<string, string>): string {
    // Try Norwegian names first
    const norwegianName = tags['name:no'] || tags['name:nb'] || tags['name:nn']
    if (norwegianName) return this.ensureUTF8(norwegianName)

    // Try general name
    if (tags.name) return this.ensureUTF8(tags.name)

    // Try English name as fallback
    if (tags['name:en']) return this.ensureUTF8(tags['name:en'])

    // Generate Norwegian name based on location or features
    if (tags.cave_entrance === 'yes') return 'Huleinngang'
    if (tags.natural === 'cave_entrance') return 'Hule'
    
    return 'Hule'
  }

  /**
   * Generate Norwegian description for caves based on OSM tags
   */
  private static generateCaveDescription(tags: Record<string, string>): string {
    const parts: string[] = []

    // Add cave type
    if (tags.natural === 'cave_entrance') {
      parts.push('Naturlig huleinngang')
    }

    // Add cave system information
    if (tags.cave) {
      if (tags.cave === 'system') {
        parts.push('del av hulesystem')
      } else if (tags.cave === 'single') {
        parts.push('enkeltstående hule')
      }
    }

    // Add geological information
    if (tags.geological === 'limestone') {
      parts.push('kalksteinhule')
    } else if (tags.geological === 'sandstone') {
      parts.push('sandsteinhule')
    } else if (tags.geological === 'granite') {
      parts.push('granitthule')
    }

    // Add length information
    if (tags.length) {
      const length = parseFloat(tags.length)
      if (!isNaN(length)) {
        if (length >= 1000) {
          parts.push(`lengde: ${(length / 1000).toFixed(1)} km`)
        } else {
          parts.push(`lengde: ${length} meter`)
        }
      }
    }

    // Add depth information
    if (tags.depth) {
      const depth = parseFloat(tags.depth)
      if (!isNaN(depth)) {
        parts.push(`dybde: ${depth} meter`)
      }
    }

    // Add difficulty/access information
    if (tags.difficulty) {
      const difficulties: Record<string, string> = {
        'easy': 'lett tilgjengelig',
        'moderate': 'moderat vanskelighetsgrad',
        'difficult': 'vanskelig tilgang',
        'expert': 'kun for erfarne huleutforskere'
      }
      parts.push(difficulties[tags.difficulty] || `vanskelighetsgrad: ${tags.difficulty}`)
    }

    // Add equipment requirements
    if (tags.equipment) {
      const equipmentTypes: Record<string, string> = {
        'helmet': 'hjelm påkrevd',
        'light': 'lommelykt påkrevd',
        'rope': 'tau påkrevd',
        'wetsuit': 'våtdrakt påkrevd'
      }
      parts.push(equipmentTypes[tags.equipment] || `utstyr: ${tags.equipment}`)
    }

    // Add safety warnings
    if (tags.hazard) {
      parts.push(`⚠️ Fare: ${tags.hazard}`)
    }

    if (tags.access === 'private') {
      parts.push('⚠️ Privat eiendom')
    } else if (tags.access === 'no') {
      parts.push('❌ Stengt for allmennheten')
    } else if (tags.access === 'permit') {
      parts.push('🎫 Tilgang krever tillatelse')
    }

    // Add opening hours if available
    if (tags.opening_hours) {
      parts.push(`🕒 Åpningstider: ${tags.opening_hours}`)
    }

    // Add fee information
    if (tags.fee === 'yes') {
      parts.push('💰 Avgift påkrevd')
    } else if (tags.fee === 'no') {
      parts.push('🆓 Gratis tilgang')
    }

    // Add Wikipedia link for more information
    if (tags.wikipedia) {
      const wikiUrl = tags.wikipedia.includes('http') 
        ? tags.wikipedia 
        : `https://no.wikipedia.org/wiki/${encodeURIComponent(tags.wikipedia.replace('no:', ''))}`
      parts.push(`📖 Les mer: ${wikiUrl}`)
    } else if (tags.wikidata) {
      parts.push(`📖 Wikidata: https://www.wikidata.org/wiki/${tags.wikidata}`)
    }

    // Add description from OSM if available
    if (tags.description) {
      parts.push(this.ensureUTF8(tags.description))
    }

    return parts.length > 0 
      ? parts.join('. ').charAt(0).toUpperCase() + parts.join('. ').slice(1) + '.'
      : 'Naturlig hule i Norge.'
  }

  /**
   * Determine cave POI type based on OSM tags (Norwegian terms)
   */
  private static determineCaveType(tags: Record<string, string>): string {
    if (tags.cave === 'system') return 'Hulesystem'
    if (tags.cave === 'single') return 'Enkelthule'
    if (tags.natural === 'cave_entrance') return 'Huleinngang'
    
    return 'Hule'
  }

  /**
   * Extract meaningful name from OSM tags for towers with Norwegian fallbacks
   */
  private static extractTowerName(tags: Record<string, string>): string {
    // Try Norwegian names first
    const norwegianName = tags['name:no'] || tags['name:nb'] || tags['name:nn']
    if (norwegianName) return this.ensureUTF8(norwegianName)

    // Try general name
    if (tags.name) return this.ensureUTF8(tags.name)

    // Try English name as fallback
    if (tags['name:en']) return this.ensureUTF8(tags['name:en'])

    // Generate Norwegian name based on tower type
    if (tags['tower:type'] === 'observation') return 'Observasjonstårn'
    if (tags['tower:type'] === 'watchtower') return 'Vakttårn'
    if (tags['tower:type'] === 'fire_observation') return 'Brannvakttårn'
    if (tags.tourism === 'viewpoint') return 'Utsiktstårn'
    if (tags.man_made === 'tower') return 'Tårn'
    
    return 'Observasjonstårn'
  }

  /**
   * Generate Norwegian description for towers based on OSM tags
   */
  private static generateTowerDescription(tags: Record<string, string>): string {
    const parts: string[] = []

    // Add tower type
    if (tags['tower:type']) {
      const towerTypes: Record<string, string> = {
        'observation': 'observasjonstårn for utsikt',
        'watchtower': 'vakttårn for overvåking',
        'fire_observation': 'brannvakttårn',
        'communication': 'kommunikasjonstårn',
        'water': 'vanntårn',
        'bell_tower': 'klokketårn'
      }
      parts.push(towerTypes[tags['tower:type']] || `tårn av type ${tags['tower:type']}`)
    } else if (tags.man_made === 'tower') {
      parts.push('byggetårn')
    }

    // Add height information
    if (tags.height) {
      const height = parseFloat(tags.height)
      if (!isNaN(height)) {
        parts.push(`høyde: ${height} meter`)
      }
    } else if (tags.ele) {
      const elevation = parseFloat(tags.ele)
      if (!isNaN(elevation)) {
        parts.push(`høyde over havet: ${elevation} meter`)
      }
    }

    // Add construction information
    if (tags.start_date) {
      const year = tags.start_date.substring(0, 4)
      if (year && !isNaN(Number(year))) {
        parts.push(`bygget ${year}`)
      }
    }

    // Add material information
    if (tags.material) {
      const materials: Record<string, string> = {
        'wood': 'bygget av tre',
        'concrete': 'bygget av betong',
        'steel': 'bygget av stål',
        'stone': 'bygget av stein',
        'brick': 'bygget av murstein'
      }
      parts.push(materials[tags.material] || `bygget av ${tags.material}`)
    }

    // Add viewpoint information
    if (tags.tourism === 'viewpoint') {
      parts.push('utsiktspunkt for besøkende')
    }

    // Add operator information
    if (tags.operator) {
      parts.push(`drift: ${this.ensureUTF8(tags.operator)}`)
    }

    // Add access information
    if (tags.access === 'private') {
      parts.push('⚠️ Privat eiendom')
    } else if (tags.access === 'no') {
      parts.push('❌ Stengt for allmennheten')
    } else if (tags.access === 'customers') {
      parts.push('🎫 Kun for besøkende/kunder')
    } else if (tags.access === 'yes') {
      parts.push('🆓 Offentlig tilgjengelig')
    }

    // Add opening hours if available
    if (tags.opening_hours) {
      parts.push(`🕒 Åpningstider: ${tags.opening_hours}`)
    }

    // Add fee information
    if (tags.fee === 'yes') {
      parts.push('💰 Inngang/avgift påkrevd')
    } else if (tags.fee === 'no') {
      parts.push('🆓 Gratis adgang')
    }

    // Add climbing information
    if (tags.climbing === 'yes') {
      parts.push('🧗 Klatring tillatt')
    } else if (tags.climbing === 'no') {
      parts.push('⛔ Klatring forbudt')
    }

    // Add safety warnings
    if (tags.hazard) {
      parts.push(`⚠️ Fare: ${tags.hazard}`)
    }

    // Add Wikipedia link for more information
    if (tags.wikipedia) {
      const wikiUrl = tags.wikipedia.includes('http') 
        ? tags.wikipedia 
        : `https://no.wikipedia.org/wiki/${encodeURIComponent(tags.wikipedia.replace('no:', ''))}`
      parts.push(`📖 Les mer: ${wikiUrl}`)
    } else if (tags.wikidata) {
      parts.push(`📖 Wikidata: https://www.wikidata.org/wiki/${tags.wikidata}`)
    }

    // Add description from OSM if available
    if (tags.description) {
      parts.push(this.ensureUTF8(tags.description))
    }

    return parts.length > 0 
      ? parts.join('. ').charAt(0).toUpperCase() + parts.join('. ').slice(1) + '.'
      : 'Observasjonstårn eller vakttårn i Norge.'
  }

  /**
   * Determine tower POI type based on OSM tags (Norwegian terms)
   */
  private static determineTowerType(tags: Record<string, string>): string {
    if (tags['tower:type'] === 'observation') return 'Observasjonstårn'
    if (tags['tower:type'] === 'watchtower') return 'Vakttårn'
    if (tags['tower:type'] === 'fire_observation') return 'Brannvakttårn'
    if (tags.tourism === 'viewpoint') return 'Utsiktstårn'
    if (tags['tower:type'] === 'communication') return 'Kommunikasjonstårn'
    if (tags.man_made === 'tower') return 'Tårn'
    
    return 'Observasjonstårn'
  }

  /**
   * Clear cache (useful for development)
   */
  static clearCache(): void {
    this.cache.clear()
    console.log('🗑️ Overpass cache cleared')
  }

  /**
   * Fetch hunting stands (observasjonstårn) from OpenStreetMap
   */
  static async fetchHuntingStandPOIs(bounds: POIBounds): Promise<OverpassPOI[]> {
    const cacheKey = `hunting_stands_norway_${bounds.north},${bounds.south},${bounds.east},${bounds.west}`
    
    try {
      console.log('🦌 Fetching hunting stands from OpenStreetMap...', bounds)
      
      // Constrain bounds to Norway's geographic limits
      const norwayBounds = {
        north: Math.min(bounds.north, 72.0),
        south: Math.max(bounds.south, 57.5),
        east: Math.min(bounds.east, 32.0),
        west: Math.max(bounds.west, 4.0)
      }

      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Hunting stands - amenity=hunting_stand
          node["amenity"="hunting_stand"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
        );
        out center body 100;
      `.trim()
      
      console.log('🔍 Hunting stand Overpass query:', overpassQuery)

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
          'User-Agent': 'Tråkke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
        },
        body: overpassQuery
      })

      if (!response.ok) {
        throw new Error(`Overpass API request failed: ${response.status}`)
      }

      const responseText = await response.text()
      const data = JSON.parse(responseText)
      console.log('📊 Raw hunting stand Overpass response:', data)
      
      // Return raw POI data without generic transformation - let the app handle specific transformation
      const rawPois = data.elements?.map((element: any) => ({
        id: element.id || `${element.type}-${element.lat}-${element.lon}`,
        type: element.type || 'node',
        lat: element.lat || element.center?.lat,
        lng: element.lon || element.center?.lon,
        name: element.tags?.name || element.tags?.['name:no'] || element.tags?.['name:nb'] || 'Jakttårn',
        tags: element.tags || {}
      })) || []
      
      console.log(`🦌 Extracted ${rawPois.length} raw hunting stand POIs from Overpass API`)

      // Cache the results
      this.cache.set(cacheKey, { data: rawPois, timestamp: Date.now() })
      
      console.log(`✅ Fetched ${rawPois.length} hunting stand POIs from OpenStreetMap`)
      return rawPois
    } catch (error) {
      console.error('❌ Error fetching hunting stands:', error)
      return []
    }
  }

  /**
   * Fetch fire pits (bålplass) from OpenStreetMap
   */
  static async fetchFirepitPOIs(bounds: POIBounds): Promise<OverpassPOI[]> {
    const cacheKey = `firepits_norway_${bounds.north},${bounds.south},${bounds.east},${bounds.west}`
    
    try {
      console.log('🔥 Fetching fire pits from OpenStreetMap...', bounds)
      
      // Constrain bounds to Norway's geographic limits
      const norwayBounds = {
        north: Math.min(bounds.north, 72.0),
        south: Math.max(bounds.south, 57.5),
        east: Math.min(bounds.east, 32.0),
        west: Math.max(bounds.west, 4.0)
      }

      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Fire pits - leisure=firepit
          node["leisure"="firepit"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["leisure"="firepit"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
        );
        out center body 100;
      `.trim()
      
      console.log('🔍 Fire pit Overpass query:', overpassQuery)

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
          'User-Agent': 'Tråkke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
        },
        body: overpassQuery
      })

      if (!response.ok) {
        throw new Error(`Overpass API request failed: ${response.status}`)
      }

      const responseText = await response.text()
      const data = JSON.parse(responseText)
      console.log('📊 Raw fire pit Overpass response:', data)
      
      // Return raw POI data without generic transformation - let the app handle specific transformation
      const rawPois = data.elements?.map((element: any) => ({
        id: element.id || `${element.type}-${element.lat}-${element.lon}`,
        type: element.type || 'node',
        lat: element.lat || element.center?.lat,
        lng: element.lon || element.center?.lon,
        name: element.tags?.name || element.tags?.['name:no'] || element.tags?.['name:nb'] || 'Bål-/grillplass',
        tags: element.tags || {}
      })) || []
      
      console.log(`🔥 Extracted ${rawPois.length} raw fire pit POIs from Overpass API`)

      // Cache the results
      this.cache.set(cacheKey, { data: rawPois, timestamp: Date.now() })
      
      console.log(`✅ Fetched ${rawPois.length} fire pit POIs from OpenStreetMap`)
      return rawPois
    } catch (error) {
      console.error('❌ Error fetching fire pits:', error)
      return []
    }
  }

  /**
   * Fetch shelters (gapahuk/vindskjul) from OpenStreetMap
   */
  static async fetchShelterPOIs(bounds: POIBounds): Promise<OverpassPOI[]> {
    const cacheKey = `shelters_norway_${bounds.north},${bounds.south},${bounds.east},${bounds.west}`
    
    try {
      console.log('🏠 Fetching shelters from OpenStreetMap...', bounds)
      
      // Constrain bounds to Norway's geographic limits
      const norwayBounds = {
        north: Math.min(bounds.north, 72.0),
        south: Math.max(bounds.south, 57.5),
        east: Math.min(bounds.east, 32.0),
        west: Math.max(bounds.west, 4.0)
      }

      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Basic huts - amenity=shelter with shelter_type=basic_hut
          node["amenity"="shelter"]["shelter_type"="basic_hut"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["amenity"="shelter"]["shelter_type"="basic_hut"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          
          // Weather shelters - amenity=shelter with shelter_type=weather_shelter
          node["amenity"="shelter"]["shelter_type"="weather_shelter"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["amenity"="shelter"]["shelter_type"="weather_shelter"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          
          // Rock shelters - amenity=shelter with shelter_type=rock_shelter
          node["amenity"="shelter"]["shelter_type"="rock_shelter"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["amenity"="shelter"]["shelter_type"="rock_shelter"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          
          // Lavvu shelters - amenity=shelter with shelter_type=lavvu
          node["amenity"="shelter"]["shelter_type"="lavvu"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["amenity"="shelter"]["shelter_type"="lavvu"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          
          // Generic shelters without specific shelter_type - amenity=shelter
          node["amenity"="shelter"][!"shelter_type"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
          way["amenity"="shelter"][!"shelter_type"](${norwayBounds.south},${norwayBounds.west},${norwayBounds.north},${norwayBounds.east});
        );
        out center body 100;
      `.trim()
      
      console.log('🔍 Shelter Overpass query:', overpassQuery)

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
          'User-Agent': 'Tråkke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
        },
        body: overpassQuery
      })

      if (!response.ok) {
        throw new Error(`Overpass API request failed: ${response.status}`)
      }

      const responseText = await response.text()
      const data = JSON.parse(responseText)
      console.log('📊 Raw shelter Overpass response:', data)
      
      // Return raw POI data without generic transformation - let the app handle specific transformation
      const rawPois = data.elements?.map((element: any) => ({
        id: element.id || `${element.type}-${element.lat}-${element.lon}`,
        type: element.type || 'node',
        lat: element.lat || element.center?.lat,
        lng: element.lon || element.center?.lon,
        name: element.tags?.name || element.tags?.['name:no'] || element.tags?.['name:nb'] || 'Gapahuk/Vindskjul',
        tags: element.tags || {}
      })) || []
      
      console.log(`🏠 Extracted ${rawPois.length} raw shelter POIs from Overpass API`)

      // Cache the results
      this.cache.set(cacheKey, { data: rawPois, timestamp: Date.now() })
      
      console.log(`✅ Fetched ${rawPois.length} shelter POIs from OpenStreetMap`)
      return rawPois
    } catch (error) {
      console.error('❌ Error fetching shelters:', error)
      return []
    }
  }
}
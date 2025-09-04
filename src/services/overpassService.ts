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

export class OverpassService {
  private static readonly BASE_URL = 'https://overpass-api.de/api/interpreter'
  private static readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
  private static cache = new Map<string, { data: OverpassPOI[], timestamp: number }>()

  /**
   * Fetch Krigsminner (war memorial) POIs from OpenStreetMap
   * Queries for historic=fort, historic=castle, and military tags
   */
  static async fetchKrigsminnerPOIs(bounds: POIBounds): Promise<OverpassPOI[]> {
    const cacheKey = `krigsminner_${bounds.north},${bounds.south},${bounds.east},${bounds.west}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('🗄️ Using cached Krigsminner data')
      return cached.data
    }

    try {
      console.log('🔄 Fetching Krigsminner from OpenStreetMap...', bounds)
      
      // Build Overpass QL query for historic forts, castles, and military sites
      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Historic forts
          node["historic"="fort"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          way["historic"="fort"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          relation["historic"="fort"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          
          // Historic castles
          node["historic"="castle"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          way["historic"="castle"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          relation["historic"="castle"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          
          // Military sites
          node["military"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          way["military"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          relation["military"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          
          // Historic battlefields
          node["historic"="battlefield"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          way["historic"="battlefield"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          
          // War memorials
          node["historic"="memorial"]["memorial"~"war"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["tourism"="attraction"]["memorial"="war_memorial"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        );
        out body;
        >;
        out skel qt;
      `.trim()

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: overpassQuery
      })

      if (!response.ok) {
        throw new Error(`Overpass API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 Raw Overpass response:', data)
      
      const pois = this.transformOverpassDataToPOIs(data)
      console.log(`🔄 Transformed ${pois.length} Kriegsminner POIs from Overpass API`)

      // Cache the results
      this.cache.set(cacheKey, { data: pois, timestamp: Date.now() })
      
      console.log(`✅ Fetched ${pois.length} Kriegsminner POIs from OpenStreetMap`)
      return pois

    } catch (error) {
      console.error('❌ Error fetching Kriegsminner from Overpass API:', error)
      return []
    }
  }

  /**
   * Transform Overpass API response to our POI format
   */
  private static transformOverpassDataToPOIs(overpassData: any): OverpassPOI[] {
    if (!overpassData.elements) {
      return []
    }

    const pois: OverpassPOI[] = []
    
    overpassData.elements.forEach((element: any) => {
      try {
        let lat: number, lng: number

        // Handle different OSM element types
        if (element.type === 'node') {
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

        // Validate coordinates
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return
        }

        const tags = element.tags || {}
        
        // Generate Norwegian name
        const name = this.extractName(tags)
        
        // Generate description
        const description = this.generateDescription(tags)
        
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

    console.log(`✅ Converted ${pois.length} Kriegsminner POIs from Overpass data`)
    return pois
  }

  /**
   * Extract meaningful name from OSM tags with Norwegian fallbacks
   */
  private static extractName(tags: Record<string, string>): string {
    // Try Norwegian names first
    const norwegianName = tags['name:no'] || tags['name:nb'] || tags['name:nn']
    if (norwegianName) return norwegianName

    // Try general name
    if (tags.name) return tags.name

    // Try English name as fallback
    if (tags['name:en']) return tags['name:en']

    // Generate name based on type
    if (tags.historic === 'fort') return 'Fort'
    if (tags.historic === 'castle') return 'Slott'
    if (tags.historic === 'battlefield') return 'Slagmark'
    if (tags.military) return `Militært anlegg (${tags.military})`
    if (tags.memorial === 'war_memorial') return 'Krigsminne'

    return 'Historisk sted'
  }

  /**
   * Generate Norwegian description based on OSM tags
   */
  private static generateDescription(tags: Record<string, string>): string {
    const parts: string[] = []

    // Add historic type
    if (tags.historic === 'fort') {
      parts.push('Historisk fort')
    } else if (tags.historic === 'castle') {
      parts.push('Slott eller borg')
    } else if (tags.historic === 'battlefield') {
      parts.push('Historisk slagmark')
    } else if (tags.historic === 'memorial') {
      parts.push('Minnesmerke')
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
        'danger_area': 'militært fareområde'
      }
      parts.push(militaryTypes[tags.military] || `militært anlegg (${tags.military})`)
    }

    // Add memorial details
    if (tags.memorial) {
      if (tags.memorial === 'war_memorial') {
        parts.push('krigsminne')
      } else {
        parts.push(`minnesmerke (${tags.memorial})`)
      }
    }

    // Add time period if available
    if (tags.start_date) {
      parts.push(`fra ${tags.start_date}`)
    }

    // Add heritage status
    if (tags.heritage) {
      parts.push('kulturminneobjekt')
    }

    // Add description from OSM if available
    if (tags.description) {
      parts.push(tags.description)
    }

    return parts.length > 0 
      ? parts.join(', ').charAt(0).toUpperCase() + parts.join(', ').slice(1) + '.'
      : 'Historisk eller militært anlegg i Norge.'
  }

  /**
   * Determine POI type based on OSM tags
   */
  private static determineType(tags: Record<string, string>): string {
    if (tags.historic === 'fort') return 'Fort'
    if (tags.historic === 'castle') return 'Slott'
    if (tags.historic === 'battlefield') return 'Slagmark'
    if (tags.historic === 'memorial') return 'Minnesmerke'
    if (tags.military === 'bunker') return 'Bunker'
    if (tags.military) return 'Militæranlegg'
    if (tags.memorial === 'war_memorial') return 'Krigsminne'
    
    return 'Historisk sted'
  }

  /**
   * Clear cache (useful for development)
   */
  static clearCache(): void {
    this.cache.clear()
    console.log('🗑️ Overpass cache cleared')
  }
}
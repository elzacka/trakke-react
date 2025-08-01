// src/services/searchService.ts - Fikset bbox typing issue

export interface SearchResult {
  id: string
  name: string
  displayName: string
  lat: number
  lng: number
  type: 'poi' | 'place' | 'address' | 'coordinates'
  source: 'internal' | 'nominatim' | 'koordinater' | 'kartverket'
  description?: string
  bbox?: [number, number, number, number] // [west, south, east, north]
}

export interface CoordinateParseResult {
  lat: number
  lng: number
  format: 'decimal' | 'dms' | 'utm'
}

// Typedefinisjon for POI objekter
interface POILike {
  id: string
  name: string
  description: string
  lat: number
  lng: number
  type: string
}

// Nominatim API response types
interface NominatimAddress {
  municipality?: string
  county?: string
  house_number?: string
}

interface NominatimItem {
  place_id: number
  name?: string
  display_name: string
  lat: string
  lon: string
  type?: string
  address?: NominatimAddress
  boundingbox?: string[]
}

// Rate limiting for Nominatim API
class RateLimiter {
  private lastRequest = 0
  private readonly minInterval = 1000 // 1 sekund mellom requests

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequest
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest
      await new Promise<void>(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequest = Date.now()
  }
}

export class SearchService {
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search'
  private readonly rateLimiter = new RateLimiter()
  private readonly norwegianBounds = {
    south: 57.5,
    west: 4.0, 
    north: 71.5,
    east: 31.5
  }

  // Cache for recent searches
  private searchCache = new Map<string, { results: SearchResult[], timestamp: number }>()
  private readonly cacheTimeout = 5 * 60 * 1000 // 5 minutter

  // FIKSET: Eksplisitt tom konstruktør
  constructor() {
    // Konstruktør trenger ingen parametere
  }

  /**
   * Hovedsøkefunksjon - prøver alle søketyper
   */
  async search(query: string, localPOIs: POILike[] = []): Promise<SearchResult[]> {
    const cleanQuery = query.trim().toLowerCase()
    if (!cleanQuery) return []

    // Sjekk cache først
    const cached = this.searchCache.get(cleanQuery)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results
    }

    const results: SearchResult[] = []

    try {
      // 1. Prøv koordinater først (raskest)
      const coordResult = this.parseCoordinates(query)
      if (coordResult) {
        results.push({
          id: `coord_${coordResult.lat}_${coordResult.lng}`,
          name: 'Koordinater',
          displayName: `${coordResult.lat.toFixed(5)}, ${coordResult.lng.toFixed(5)}`,
          lat: coordResult.lat,
          lng: coordResult.lng,
          type: 'coordinates',
          source: 'koordinater',
          description: `Koordinater (${coordResult.format})`
        })
      }

      // 2. Søk i lokale POI-er
      const localResults = this.searchLocalPOIs(cleanQuery, localPOIs)
      results.push(...localResults)

      // 3. Søk i Nominatim (OpenStreetMap) med rate limiting
      if (results.length < 5) { // Kun hvis vi trenger flere resultater
        const nominatimResults = await this.searchNominatim(cleanQuery)
        results.push(...nominatimResults)
      }

    } catch (error) {
      console.error('Søkefeil:', error)
      // Ikke kast error - returner det vi har
    }

    // Deduplication og sortering
    const finalResults = this.deduplicateAndSort(results, cleanQuery)
    
    // Cache resultatet
    this.searchCache.set(cleanQuery, {
      results: finalResults,
      timestamp: Date.now()
    })

    return finalResults
  }

  /**
   * Parser forskjellige koordinatformater
   */
  parseCoordinates(input: string): CoordinateParseResult | null {
    // Fjern ekstra whitespace og vanlige separator-tegn
    const cleaned = input.replace(/[°'"′″\s]/g, ' ').trim()

    // Format 1: Decimal grader "59.4892,7.1845" eller "59.4892 7.1845"
    const decimalMatch = cleaned.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
    if (decimalMatch) {
      const lat = parseFloat(decimalMatch[1])
      const lng = parseFloat(decimalMatch[2])
      
      if (this.isValidNorwegianCoordinate(lat, lng)) {
        return { lat, lng, format: 'decimal' }
      }
    }

    // Format 2: Grader, minutter, sekunder "59°29'21"N 7°11'04"E"
    const dmsPattern = /(\d+)\s*(\d+)\s*(\d+\.?\d*)\s*([NS])\s+(\d+)\s*(\d+)\s*(\d+\.?\d*)\s*([EW])/i
    const dmsMatch = cleaned.match(dmsPattern)
    if (dmsMatch) {
      const latDeg = parseInt(dmsMatch[1])
      const latMin = parseInt(dmsMatch[2]) 
      const latSec = parseFloat(dmsMatch[3])
      const latDir = dmsMatch[4].toUpperCase()
      
      const lngDeg = parseInt(dmsMatch[5])
      const lngMin = parseInt(dmsMatch[6])
      const lngSec = parseFloat(dmsMatch[7])
      const lngDir = dmsMatch[8].toUpperCase()

      let lat = latDeg + latMin/60 + latSec/3600
      let lng = lngDeg + lngMin/60 + lngSec/3600

      if (latDir === 'S') lat = -lat
      if (lngDir === 'W') lng = -lng

      if (this.isValidNorwegianCoordinate(lat, lng)) {
        return { lat, lng, format: 'dms' }
      }
    }

    return null
  }

  /**
   * Sjekker om koordinater er innenfor Norge
   */
  private isValidNorwegianCoordinate(lat: number, lng: number): boolean {
    return lat >= this.norwegianBounds.south && 
           lat <= this.norwegianBounds.north &&
           lng >= this.norwegianBounds.west && 
           lng <= this.norwegianBounds.east
  }

  /**
   * Søker i lokale POI-er
   */
  private searchLocalPOIs(query: string, pois: POILike[]): SearchResult[] {
    return pois
      .filter(poi => 
        poi.name.toLowerCase().includes(query) ||
        poi.description.toLowerCase().includes(query)
      )
      .map(poi => ({
        id: `poi_${poi.id}`,
        name: poi.name,
        displayName: poi.name,
        lat: poi.lat,
        lng: poi.lng,
        type: 'poi' as const,
        source: 'internal' as const,
        description: poi.description
      }))
      .slice(0, 5) // Begrenss til 5 lokale resultater
  }

  /**
   * Søker via Nominatim (OpenStreetMap) med rate limiting
   */
  private async searchNominatim(query: string): Promise<SearchResult[]> {
    try {
      // Vent på rate limiting
      await this.rateLimiter.waitIfNeeded()

      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '6',
        countrycodes: 'no', // Kun Norge
        bounded: '1',
        viewbox: `${this.norwegianBounds.west},${this.norwegianBounds.north},${this.norwegianBounds.east},${this.norwegianBounds.south}`
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 sekunder timeout

      const response = await fetch(`${this.nominatimUrl}?${params}`, {
        headers: {
          'User-Agent': 'Trakke-App/1.0 (https://github.com/elzacka/trakke-react)'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Nominatim feil: ${response.status}`)
      }

      const data = await response.json() as NominatimItem[]
      
      return data.map((item: NominatimItem): SearchResult => {
        // FIKSET: Sikker bbox konvertering med type checking
        let bbox: [number, number, number, number] | undefined = undefined
        if (item.boundingbox && item.boundingbox.length === 4) {
          bbox = [
            parseFloat(item.boundingbox[2]), // west
            parseFloat(item.boundingbox[0]), // south  
            parseFloat(item.boundingbox[3]), // east
            parseFloat(item.boundingbox[1])  // north
          ]
        }

        return {
          id: `nominatim_${item.place_id}`,
          name: item.name || item.display_name.split(',')[0],
          displayName: this.formatDisplayName(item),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: this.getNominatimType(item),
          source: 'nominatim',
          description: item.type ? `${item.type} i ${item.address?.municipality || item.address?.county || 'Norge'}` : undefined,
          bbox
        }
      }).filter(result => 
        // Filtrer ut resultater utenfor Norge (dobbel-sjekk)
        this.isValidNorwegianCoordinate(result.lat, result.lng)
      )
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Nominatim søk timed out')
      } else {
        console.error('Nominatim søkefeil:', error)
      }
      return []
    }
  }

  /**
   * Formaterer visningsnavn for Nominatim-resultater
   */
  private formatDisplayName(item: NominatimItem): string {
    const parts = []
    
    if (item.name) parts.push(item.name)
    if (item.address?.municipality && item.address.municipality !== item.name) {
      parts.push(item.address.municipality)
    }
    if (item.address?.county && !parts.includes(item.address.county)) {
      parts.push(item.address.county)
    }
    
    return parts.join(', ') || item.display_name.split(',').slice(0, 2).join(', ')
  }

  /**
   * Bestemmer type basert på Nominatim data
   */
  private getNominatimType(item: NominatimItem): 'place' | 'address' {
    if (item.address?.house_number) return 'address'
    return 'place'
  }

  /**
   * Fjerner duplikater og sorterer resultater
   */
  private deduplicateAndSort(results: SearchResult[], query: string): SearchResult[] {
    // Fjern duplikater basert på avstand
    const filtered = results.filter((result, index) => {
      return !results.slice(0, index).some(prev => 
        this.getDistance(result.lat, result.lng, prev.lat, prev.lng) < 0.1 // 100m radius
      )
    })

    // Sorter etter relevans
    return filtered.sort((a, b) => {
      // Koordinater først
      if (a.type === 'coordinates') return -1
      if (b.type === 'coordinates') return 1
      
      // Så eksakte navn-matcher
      const aExact = a.name.toLowerCase() === query
      const bExact = b.name.toLowerCase() === query
      if (aExact && !bExact) return -1
      if (bExact && !aExact) return 1
      
      // Så POI-er
      if (a.type === 'poi' && b.type !== 'poi') return -1
      if (b.type === 'poi' && a.type !== 'poi') return 1
      
      // Til slutt alfabetisk
      return a.displayName.localeCompare(b.displayName, 'no')
    }).slice(0, 8) // Maks 8 resultater
  }

  /**
   * Beregner avstand mellom to punkter (Haversine)
   */
  private getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Jordens radius i km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Tømmer søke-cache (for testing eller memory management)
   */
  clearCache(): void {
    this.searchCache.clear()
  }
}
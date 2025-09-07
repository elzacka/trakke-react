// Norwegian search service using Kartverket's official place name API
// Replaces Nominatim for better Norwegian coverage and accuracy

export interface SearchResult {
  id: string
  name: string
  displayName: string
  lat: number
  lng: number
  type: 'poi' | 'place' | 'address' | 'coordinates'
  source: 'internal' | 'kartverket' | 'koordinater'
  description?: string
  municipality?: string
  county?: string
  bbox?: [number, number, number, number]
}

export interface CoordinateParseResult {
  lat: number
  lng: number
  format: 'decimal' | 'dms' | 'utm'
}

interface POILike {
  id: string
  name: string
  description: string
  lat: number
  lng: number
  type: string
}

interface KartverketPlace {
  stedsnummer: number
  skrivemåte: string
  navneobjekttype: string
  navnestatus: string
  skrivemåtestatus: string
  språk: string
  stedstatus: string
  kommuner?: Array<{
    kommunenavn: string
    kommunenummer: string
  }>
  fylker?: Array<{
    fylkesnavn: string
    fylkesnummer: string
  }>
  representasjonspunkt?: {
    øst: number
    nord: number
  }
}

interface KartverketResponse {
  metadata: {
    totaltAntallTreff: number
    treffPerSide: number
    side: number
    viserFra: number
    viserTil: number
    sokeStreng: string
  }
  navn: KartverketPlace[]
}

interface KartverketAddress {
  adressenavn: string
  nummer: string
  adressetekst: string
  kommunenavn: string
  postnummer: string
  gardsnummer?: string
  bruksnummer?: string
  bruksenhetsnummer?: string[]
  representasjonspunkt: {
    epsg: number
    lat: number
    lon: number
  }
}

interface KartverketAddressResponse {
  metadata: {
    totaltAntallTreff: number
    treffPerSide: number
    side: number
    viserFra: number
    viserTil: number
    sokeStreng: string
  }
  adresser: KartverketAddress[]
}

// Cache
const searchCache = new Map<string, { results: SearchResult[], timestamp: number }>()
const cacheTimeout = 5 * 60 * 1000 // 5 minutes

// Norwegian territory bounds
const norwegianBounds = {
  south: 57.5,
  west: 4.0,
  north: 72.0,
  east: 32.0
} as const

// Validation functions
function isValidNorwegianCoordinate(lat: number, lng: number): boolean {
  return lat >= norwegianBounds.south && 
         lat <= norwegianBounds.north &&
         lng >= norwegianBounds.west && 
         lng <= norwegianBounds.east
}

function isValidNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

// Coordinate parsing (kept from original implementation)
function parseCoordinates(input: string): CoordinateParseResult | null {
  const cleaned = input.replace(/[°'"′″\s]/g, ' ').trim()

  // Decimal format: "59.123, 7.456" or "59.123 7.456"
  const decimalMatch = cleaned.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1])
    const lng = parseFloat(decimalMatch[2])
    
    if (isValidNumber(lat) && isValidNumber(lng) && isValidNorwegianCoordinate(lat, lng)) {
      return { lat, lng, format: 'decimal' }
    }
  }

  // DMS format: "59 12 34.5 N 7 25 42.1 E"
  const dmsPattern = /(\d+)\s*(\d+)\s*(\d+\.?\d*)\s*([NS])\s+(\d+)\s*(\d+)\s*(\d+\.?\d*)\s*([EW])/i
  const dmsMatch = cleaned.match(dmsPattern)
  if (dmsMatch) {
    const latDeg = parseInt(dmsMatch[1], 10)
    const latMin = parseInt(dmsMatch[2], 10) 
    const latSec = parseFloat(dmsMatch[3])
    const latDir = dmsMatch[4].toUpperCase()
    
    const lngDeg = parseInt(dmsMatch[5], 10)
    const lngMin = parseInt(dmsMatch[6], 10)
    const lngSec = parseFloat(dmsMatch[7])
    const lngDir = dmsMatch[8].toUpperCase()

    let lat = latDeg + latMin/60 + latSec/3600
    let lng = lngDeg + lngMin/60 + lngSec/3600

    if (latDir === 'S') lat = -lat
    if (lngDir === 'W') lng = -lng

    if (isValidNumber(lat) && isValidNumber(lng) && isValidNorwegianCoordinate(lat, lng)) {
      return { lat, lng, format: 'dms' }
    }
  }

  return null
}

// Local POI search (kept from original implementation)
function searchLocalPOIs(query: string, pois: POILike[]): SearchResult[] {
  const normalizedQuery = query.toLowerCase()
  
  return pois
    .filter(poi => {
      const nameMatch = poi.name.toLowerCase().includes(normalizedQuery)
      const descMatch = poi.description.toLowerCase().includes(normalizedQuery)
      return nameMatch || descMatch
    })
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
    .slice(0, 5)
}


// Norwegian place type translations
const norwegianPlaceTypes: Record<string, string> = {
  'By': 'by',
  'Tettsted': 'tettsted',
  'Grend': 'grend',
  'Gård': 'gård',
  'Kommune': 'kommune',
  'Fylke': 'fylke',
  'Fjell': 'fjell',
  'Ås': 'ås',
  'Dal': 'dal',
  'Innsjø': 'innsjø',
  'Elv': 'elv',
  'Øy': 'øy',
  'Fjord': 'fjord',
  'Bukt': 'bukt',
  'Strand': 'strand',
  'Skog': 'skog',
  'Myr': 'myr',
  'Bre': 'bre',
  'Foss': 'foss',
  'Kilde': 'kilde',
  'Hule': 'hule',
  'Hytte': 'hytte',
  'Kirke': 'kirke',
  'Skole': 'skole',
  'Sykehus': 'sykehus',
  'Stasjon': 'stasjon',
  'Havn': 'havn',
  'Flyplass': 'flyplass',
  'Bru': 'bru',
  'Tårn': 'tårn',
  'Fort': 'fort',
  'Minnesmærke': 'minnesmerke'
}

// Kartverket address search implementation
async function searchKartverketAddresses(query: string): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query.trim())
    const url = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodedQuery}&treffPerSide=5&side=1`
    
    console.log('🏠 Kartverket adresse søk:', url)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Trakke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Kartverket Address API feil: ${response.status}`)
    }
    
    const data: KartverketAddressResponse = await response.json()
    
    console.log(`🏠 Kartverket adresse resultater: ${data.metadata.totaltAntallTreff} treff, returnerer ${data.adresser?.length || 0}`)
    
    if (!data.adresser || !Array.isArray(data.adresser)) {
      return []
    }
    
    return data.adresser
      .map((address: KartverketAddress): SearchResult | null => {
        if (!address.representasjonspunkt) {
          return null
        }
        
        const lat = address.representasjonspunkt.lat
        const lng = address.representasjonspunkt.lon
        
        if (!isValidNumber(lat) || !isValidNumber(lng) || !isValidNorwegianCoordinate(lat, lng)) {
          console.warn(`❌ Invalid coordinates for address ${address.adressetekst}: lat=${lat}, lng=${lng}`)
          return null
        }
        
        return {
          id: `kartverket_addr_${address.adressenavn}_${address.nummer}_${address.postnummer}`,
          name: address.adressetekst,
          displayName: `${address.adressetekst}, ${address.kommunenavn}`,
          lat,
          lng,
          type: 'address' as const,
          source: 'kartverket' as const,
          municipality: address.kommunenavn,
          description: `Adresse i ${address.kommunenavn} kommune (${address.postnummer})`
        }
      })
      .filter((result): result is SearchResult => result !== null)
      .slice(0, 5)
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Kartverket adresse søk timed out')
      } else {
        console.error('Kartverket adresse søkefeil:', error.message)
      }
    } else {
      console.error('Ukjent Kartverket adresse feil:', error)
    }
    return []
  }
}

// Kartverket place name search implementation
async function searchKartverket(query: string): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query.trim())
    const url = `https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodedQuery}*&treffPerSide=8&side=1`
    
    console.log('🗺️ Kartverket søk:', url)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // Longer timeout for government API
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Trakke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Kartverket API feil: ${response.status}`)
    }
    
    const data: KartverketResponse = await response.json()
    
    console.log(`📍 Kartverket resultater: ${data.metadata.totaltAntallTreff} treff, returnerer ${data.navn?.length || 0}`)
    
    if (!data.navn || !Array.isArray(data.navn)) {
      return []
    }
    
    return data.navn
      .map((place: KartverketPlace): SearchResult | null => {
        // Convert coordinates
        if (!place.representasjonspunkt) {
          return null
        }
        
        // Kartverket coordinates are already in WGS84 format
        // Use Norwegian field names: øst (longitude), nord (latitude)
        const lat = place.representasjonspunkt.nord
        const lng = place.representasjonspunkt.øst
        
        if (!isValidNumber(lat) || !isValidNumber(lng) || !isValidNorwegianCoordinate(lat, lng)) {
          console.warn(`❌ Invalid coordinates for ${place.skrivemåte}: lat=${lat}, lng=${lng}`)
          return null
        }
        
        // Extract municipality and county from arrays
        const municipality = place.kommuner?.[0]?.kommunenavn || ''
        const county = place.fylker?.[0]?.fylkesnavn || ''
        
        // Create display name with administrative context
        const typeLabel = norwegianPlaceTypes[place.navneobjekttype] || place.navneobjekttype.toLowerCase()
        const displayName = createDisplayName(place, typeLabel, municipality, county)
        
        return {
          id: `kartverket_${place.stedsnummer}`,
          name: place.skrivemåte,
          displayName,
          lat,
          lng,
          type: 'place' as const,
          source: 'kartverket' as const,
          municipality: municipality,
          county: county,
          description: `${typeLabel}${municipality ? ` i ${municipality} kommune` : ''}${county ? `, ${county} fylke` : ''}`
        }
      })
      .filter((result): result is SearchResult => result !== null)
      .slice(0, 6) // Limit results
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Kartverket søk timed out')
      } else {
        console.error('Kartverket søkefeil:', error.message)
      }
    } else {
      console.error('Ukjent Kartverket feil:', error)
    }
    return []
  }
}

// Create display name with Norwegian administrative context
function createDisplayName(place: KartverketPlace, typeLabel: string, municipality: string, county: string): string {
  const baseName = place.skrivemåte
  
  // For major cities, just show name + type
  const majorCities = ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Kristiansand', 'Tromsø', 'Drammen']
  if (majorCities.includes(baseName) && typeLabel === 'by') {
    return baseName
  }
  
  // For municipalities and counties, show administrative level
  if (place.navneobjekttype === 'Kommune') {
    return `${baseName} kommune`
  }
  if (place.navneobjekttype === 'Fylke') {
    return `${baseName} fylke`
  }
  
  // For other places, include municipality context
  if (municipality && municipality !== baseName) {
    return `${baseName} (${typeLabel}), ${municipality}`
  } else if (county) {
    return `${baseName} (${typeLabel}), ${county} fylke`
  }
  
  return `${baseName} (${typeLabel})`
}

// Distance calculation for deduplication
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Deduplication and sorting
function deduplicateAndSort(results: SearchResult[], query: string): SearchResult[] {
  const normalizedQuery = query.toLowerCase()
  
  // Remove duplicates based on proximity
  const filtered = results.filter((result, index) => {
    return !results.slice(0, index).some(prev => 
      getDistance(result.lat, result.lng, prev.lat, prev.lng) < 0.5 // 500m threshold
    )
  })

  // Sort by relevance
  return filtered.sort((a, b) => {
    // Coordinates always first
    if (a.type === 'coordinates') return -1
    if (b.type === 'coordinates') return 1
    
    // POIs before addresses and places
    if (a.type === 'poi' && b.type !== 'poi') return -1
    if (b.type === 'poi' && a.type !== 'poi') return 1
    
    // Addresses before places (more specific)
    if (a.type === 'address' && b.type === 'place') return -1
    if (b.type === 'address' && a.type === 'place') return 1
    
    // Exact matches
    const aExact = a.name.toLowerCase() === normalizedQuery
    const bExact = b.name.toLowerCase() === normalizedQuery
    if (aExact && !bExact) return -1
    if (bExact && !aExact) return 1
    
    // Starts with query
    const aStartsWith = a.name.toLowerCase().startsWith(normalizedQuery)
    const bStartsWith = b.name.toLowerCase().startsWith(normalizedQuery)
    if (aStartsWith && !bStartsWith) return -1
    if (bStartsWith && !aStartsWith) return 1
    
    // Alphabetical fallback
    return a.displayName.localeCompare(b.displayName, 'no')
  }).slice(0, 8)
}

// Main service class
export class SearchService {
  async search(query: string, localPOIs: POILike[] = []): Promise<SearchResult[]> {
    const cleanQuery = query.trim()
    if (!cleanQuery) return []

    const normalizedQuery = cleanQuery.toLowerCase()

    // Check cache
    const cached = searchCache.get(normalizedQuery)
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.results
    }

    const results: SearchResult[] = []

    try {
      // 1. Parse coordinates
      const coordResult = parseCoordinates(cleanQuery)
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

      // 2. Search local POIs
      const localResults = searchLocalPOIs(normalizedQuery, localPOIs)
      results.push(...localResults)

      // 3. Search Kartverket place names
      const kartverketResults = await searchKartverket(cleanQuery)
      results.push(...kartverketResults)

      // 4. Search Kartverket addresses (parallel search for better performance)
      const addressResults = await searchKartverketAddresses(cleanQuery)
      results.push(...addressResults)

    } catch (error) {
      console.error('Søkefeil:', error)
      // Don't throw - return partial results
    }

    const finalResults = deduplicateAndSort(results, normalizedQuery)
    
    // Cache results
    searchCache.set(normalizedQuery, {
      results: finalResults,
      timestamp: Date.now()
    })

    return finalResults
  }

  clearCache(): void {
    searchCache.clear()
  }
}
// src/services/searchService.ts - Helt ren versjon uten constructor issues

export interface SearchResult {
  id: string
  name: string
  displayName: string
  lat: number
  lng: number
  type: 'poi' | 'place' | 'address' | 'coordinates'
  source: 'internal' | 'nominatim' | 'koordinater' | 'kartverket'
  description?: string
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

// Rate limiter som vanlig funksjon
let lastRequest = 0
const minInterval = 1000

async function waitIfNeeded(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequest
  
  if (timeSinceLastRequest < minInterval) {
    const waitTime = minInterval - timeSinceLastRequest
    await new Promise<void>(resolve => setTimeout(resolve, waitTime))
  }
  
  lastRequest = Date.now()
}

// Cache utenfor klassen
const searchCache = new Map<string, { results: SearchResult[], timestamp: number }>()
const cacheTimeout = 5 * 60 * 1000

const norwegianBounds = {
  south: 57.5,
  west: 4.0,
  north: 71.5,
  east: 31.5
}

function isValidNorwegianCoordinate(lat: number, lng: number): boolean {
  return lat >= norwegianBounds.south && 
         lat <= norwegianBounds.north &&
         lng >= norwegianBounds.west && 
         lng <= norwegianBounds.east
}

function parseCoordinates(input: string): CoordinateParseResult | null {
  const cleaned = input.replace(/[°'"′″\s]/g, ' ').trim()

  // Decimal format
  const decimalMatch = cleaned.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1])
    const lng = parseFloat(decimalMatch[2])
    
    if (isValidNorwegianCoordinate(lat, lng)) {
      return { lat, lng, format: 'decimal' }
    }
  }

  // DMS format
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

    if (isValidNorwegianCoordinate(lat, lng)) {
      return { lat, lng, format: 'dms' }
    }
  }

  return null
}

function searchLocalPOIs(query: string, pois: POILike[]): SearchResult[] {
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
    .slice(0, 5)
}

async function searchNominatim(query: string): Promise<SearchResult[]> {
  try {
    await waitIfNeeded()

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '6',
      countrycodes: 'no',
      bounded: '1',
      viewbox: `${norwegianBounds.west},${norwegianBounds.north},${norwegianBounds.east},${norwegianBounds.south}`
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
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
      let bbox: [number, number, number, number] | undefined = undefined
      if (item.boundingbox && item.boundingbox.length === 4) {
        bbox = [
          parseFloat(item.boundingbox[2]),
          parseFloat(item.boundingbox[0]),
          parseFloat(item.boundingbox[3]),
          parseFloat(item.boundingbox[1])
        ]
      }

      const name = item.name || item.display_name.split(',')[0]
      const parts = []
      
      if (item.name) parts.push(item.name)
      if (item.address?.municipality && item.address.municipality !== item.name) {
        parts.push(item.address.municipality)
      }
      if (item.address?.county && !parts.includes(item.address.county)) {
        parts.push(item.address.county)
      }
      
      const displayName = parts.join(', ') || item.display_name.split(',').slice(0, 2).join(', ')
      const type = item.address?.house_number ? 'address' : 'place'

      return {
        id: `nominatim_${item.place_id}`,
        name,
        displayName,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type,
        source: 'nominatim',
        description: item.type ? `${item.type} i ${item.address?.municipality || item.address?.county || 'Norge'}` : undefined,
        bbox
      }
    }).filter(result => 
      isValidNorwegianCoordinate(result.lat, result.lng)
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

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function deduplicateAndSort(results: SearchResult[], query: string): SearchResult[] {
  const filtered = results.filter((result, index) => {
    return !results.slice(0, index).some(prev => 
      getDistance(result.lat, result.lng, prev.lat, prev.lng) < 0.1
    )
  })

  return filtered.sort((a, b) => {
    if (a.type === 'coordinates') return -1
    if (b.type === 'coordinates') return 1
    
    const aExact = a.name.toLowerCase() === query
    const bExact = b.name.toLowerCase() === query
    if (aExact && !bExact) return -1
    if (bExact && !aExact) return 1
    
    if (a.type === 'poi' && b.type !== 'poi') return -1
    if (b.type === 'poi' && a.type !== 'poi') return 1
    
    return a.displayName.localeCompare(b.displayName, 'no')
  }).slice(0, 8)
}

// FIKSET: Enkel klasse uten constructor problemer
export class SearchService {
  async search(query: string, localPOIs: POILike[] = []): Promise<SearchResult[]> {
    const cleanQuery = query.trim().toLowerCase()
    if (!cleanQuery) return []

    // Sjekk cache
    const cached = searchCache.get(cleanQuery)
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.results
    }

    const results: SearchResult[] = []

    try {
      // 1. Koordinater
      const coordResult = parseCoordinates(query)
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

      // 2. Lokale POI-er
      const localResults = searchLocalPOIs(cleanQuery, localPOIs)
      results.push(...localResults)

      // 3. Nominatim
      if (results.length < 5) {
        const nominatimResults = await searchNominatim(cleanQuery)
        results.push(...nominatimResults)
      }

    } catch (error) {
      console.error('Søkefeil:', error)
    }

    const finalResults = deduplicateAndSort(results, cleanQuery)
    
    searchCache.set(cleanQuery, {
      results: finalResults,
      timestamp: Date.now()
    })

    return finalResults
  }

  clearCache(): void {
    searchCache.clear()
  }
}
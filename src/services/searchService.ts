// src/services/searchService.ts - Fullstendig fikset versjon

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

// Rate limiter
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

// Cache
const searchCache = new Map<string, { results: SearchResult[], timestamp: number }>()
const cacheTimeout = 5 * 60 * 1000

// Constants
const norwegianBounds = {
  south: 57.5,
  west: 4.0,
  north: 71.5,
  east: 31.5
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

// Coordinate parsing
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

// Local POI search
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

// Norwegian translations for Nominatim place types
const norwegianPlaceTypes: Record<string, string> = {
  // Administrative
  'administrative': 'administrativt område',
  'city': 'by',
  'town': 'by',
  'village': 'tettsted',
  'hamlet': 'grend',
  'municipality': 'kommune',
  'county': 'fylke',
  'state': 'fylke',
  'country': 'land',
  
  // Urban areas (fixing your reported issues)
  'quarter': 'bydel',
  'suburb': 'forstad',
  'neighbourhood': 'nabolag',
  'district': 'distrikt',
  'residential': 'boligområde',
  'commercial': 'næringsområde',
  'industrial': 'industriområde',
  
  // Geographic features
  'peak': 'fjelltopp',
  'mountain': 'fjell',
  'hill': 'ås',
  'valley': 'dal',
  'lake': 'innsjø',
  'river': 'elv',
  'island': 'øy',
  'fjord': 'fjord',
  'bay': 'bukt',
  'beach': 'strand',
  'forest': 'skog',
  'wood': 'skog',
  'plain': 'slette',
  'plateau': 'platå',
  
  // Infrastructure
  'railway': 'jernbane',
  'station': 'stasjon',
  'railway_station': 'jernbanestasjon',
  'bus_station': 'busstasjon',
  'airport': 'flyplass',
  'harbour': 'havn',
  'port': 'havn',
  'bridge': 'bru',
  'tunnel': 'tunnel',
  'motorway': 'motorvei',
  'highway': 'hovedvei',
  
  // Places
  'farm': 'gård',
  'house': 'hus',
  'building': 'bygning',
  'church': 'kirke',
  'school': 'skole',
  'hospital': 'sykehus',
  'university': 'universitet',
  'park': 'park',
  'square': 'torg',
  'street': 'gate',
  'road': 'vei',
  'path': 'sti',
  'track': 'spor',
  
  // Natural features
  'water': 'vann',
  'waterway': 'vassdrag',
  'stream': 'bekk',
  'pond': 'dam',
  'wetland': 'våtmark',
  'marsh': 'myr',
  
  // Other common types
  'locality': 'lokalitet',
  'place': 'sted',
  'area': 'område',
  'region': 'region',
  'zone': 'sone',
  
  // Additional common English terms that appear in Norwegian search results
  'office': 'kontor',
  'shop': 'butikk',
  'store': 'butikk',
  'market': 'marked',
  'restaurant': 'restaurant',
  'cafe': 'kafé',
  'hotel': 'hotell',
  'hostel': 'herberge',
  'guest_house': 'gjestehus',
  'camping': 'camping',
  'attraction': 'attraksjon',
  'memorial': 'minnesmerke',
  'monument': 'monument',
  'museum': 'museum',
  'gallery': 'galleri',
  'library': 'bibliotek',
  'theatre': 'teater',
  'cinema': 'kino',
  'stadium': 'stadion',
  'sports_centre': 'idrettssenter',
  'swimming_pool': 'svømmehall',
  'golf_course': 'golfbane',
  'playground': 'lekeplass',
  'garden': 'hage',
  'cemetery': 'kirkegård',
  'clinic': 'klinikk',
  'pharmacy': 'apotek',
  'bank': 'bank',
  'post_office': 'postkontor',
  'police': 'politi',
  'fire_station': 'brannstasjon',
  'townhall': 'rådhus',
  'courthouse': 'tinghus',
  'prison': 'fengsel',
  'kindergarten': 'barnehage',
  'college': 'høgskole',
  'research': 'forskning',
  'factory': 'fabrikk',
  'warehouse': 'lager',
  'office_building': 'kontorbygg',
  'residential_building': 'boligbygg',
  'apartment': 'leilighet',
  'detached': 'enebolig',
  'terrace': 'rekkehus',
  'bungalow': 'bungalow',
  'cabin': 'hytte',
  'hut': 'hytte',
  'shelter': 'skjul',
  'garage': 'garasje',
  'parking_space': 'parkeringsplass',
  'fuel': 'bensin',
  'petrol': 'bensin',
  'gas_station': 'bensinstasjon',
  'charging_station': 'ladestasjon',
  'service_area': 'serviceområde',
  'toll_booth': 'bomstasjon',
  'customs': 'toll',
  'border_control': 'grensekontroll',
  'viewpoint': 'utsiktspunkt',
  'picnic_site': 'rasteplass',
  'picnic_table': 'rastebord',
  'bench': 'benk',
  'waste_basket': 'søppelkurv',
  'recycling': 'resirkulering',
  'telephone': 'telefon',
  'post_box': 'postboks',
  'vending_machine': 'automat',
  'atm': 'minibank',
  'clock': 'klokke',
  'fountain': 'fontene',
  'artwork': 'kunstverk',
  'statue': 'statue',
  'cross': 'kors',
  'wayside_cross': 'vegkors',
  'shrine': 'helligdom',
  'grave_yard': 'gravplass',
  'ruins': 'ruiner',
  'archaeological_site': 'arkeologisk område',
  'battlefield': 'slagmark',
  'castle': 'slott',
  'fort': 'fort',
  'city_gate': 'byport',
  'city_wall': 'bymur',
  'tower': 'tårn',
  'lighthouse': 'fyr',
  'windmill': 'vindmølle',
  'watermill': 'vannmølle',
  'mine': 'gruve',
  'quarry': 'steinbrudd',
  'well': 'brønn',
  'spring': 'kilde',
  'geyser': 'geysir',
  'hot_spring': 'varm kilde',
  'cave': 'hule',
  'sinkhole': 'jordfallshull',
  'cliff': 'klippe',
  'ridge': 'rygg',
  'saddle': 'sal',
  'glacier': 'bre',
  'rapids': 'stryk',
  'reef': 'rev',
  'shoal': 'skjær',
  'sand': 'sand',
  'mud': 'leire',
  'rock': 'stein',
  'stone': 'stein',
  'scree': 'ur',
  'fell': 'fjell',
  'moor': 'myr',
  'heath': 'hei',
  'scrubland': 'krattskog',
  'grassland': 'grasmark',
  'meadow': 'eng',
  'orchard': 'frukthage',
  'vineyard': 'vingård',
  'farmyard': 'gårdsplass',
  'allotments': 'kolonihage',
  'recreation_ground': 'rekreasjonsområde',
  'sports_pitch': 'idrettsplass',
  'running_track': 'løpebane',
  'pitch': 'bane',
  'court': 'bane'
}

// Nominatim search
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

    const data = await response.json()
    
    // Type guard for Nominatim response
    if (!Array.isArray(data)) {
      console.warn('Uventet Nominatim respons format')
      return []
    }

    return data
      .filter((item: unknown): item is NominatimItem => {
        return typeof item === 'object' && 
               item !== null && 
               'place_id' in item && 
               'display_name' in item && 
               'lat' in item && 
               'lon' in item
      })
      .map((item: NominatimItem): SearchResult => {
        const lat = parseFloat(item.lat)
        const lng = parseFloat(item.lon)
        
        // Validate coordinates
        if (!isValidNumber(lat) || !isValidNumber(lng)) {
          throw new Error(`Ugyldige koordinater fra Nominatim: ${item.lat}, ${item.lon}`)
        }

        let bbox: [number, number, number, number] | undefined = undefined
        if (item.boundingbox && Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
          const bboxNumbers = item.boundingbox.map(coord => parseFloat(coord))
          if (bboxNumbers.every(isValidNumber)) {
            bbox = [bboxNumbers[2], bboxNumbers[0], bboxNumbers[3], bboxNumbers[1]]
          }
        }

        const name = item.name || item.display_name.split(',')[0]
        const parts: string[] = []
        
        if (item.name) parts.push(item.name)
        if (item.address?.municipality && item.address.municipality !== item.name) {
          parts.push(item.address.municipality)
        }
        if (item.address?.county && !parts.includes(item.address.county)) {
          parts.push(item.address.county)
        }
        
        const displayName = parts.length > 0 
          ? parts.join(', ') 
          : item.display_name.split(',').slice(0, 2).join(', ')
        
        const type: SearchResult['type'] = item.address?.house_number ? 'address' : 'place'

        // Translate place type to Norwegian
        const _norwegianType = item.type ? norwegianPlaceTypes[item.type] || item.type : undefined
        
        return {
          id: `nominatim_${item.place_id}`,
          name,
          displayName,
          lat,
          lng,
          type,
          source: 'nominatim',
          description: undefined, // Remove type descriptions from search results
          bbox
        }
      })
      .filter(result => isValidNorwegianCoordinate(result.lat, result.lng))
      
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Nominatim søk timed out')
      } else {
        console.error('Nominatim søkefeil:', error.message)
      }
    } else {
      console.error('Ukjent Nominatim feil:', error)
    }
    return []
  }
}

// Distance calculation
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
      getDistance(result.lat, result.lng, prev.lat, prev.lng) < 0.1
    )
  })

  // Sort by relevance
  return filtered.sort((a, b) => {
    // Coordinates always first
    if (a.type === 'coordinates') return -1
    if (b.type === 'coordinates') return 1
    
    // Exact matches
    const aExact = a.name.toLowerCase() === normalizedQuery
    const bExact = b.name.toLowerCase() === normalizedQuery
    if (aExact && !bExact) return -1
    if (bExact && !aExact) return 1
    
    // POIs before other types
    if (a.type === 'poi' && b.type !== 'poi') return -1
    if (b.type === 'poi' && a.type !== 'poi') return 1
    
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

      // 3. Search Nominatim if we need more results
      if (results.length < 5) {
        const nominatimResults = await searchNominatim(cleanQuery)
        results.push(...nominatimResults)
      }

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
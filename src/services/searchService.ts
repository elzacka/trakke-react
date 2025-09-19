// Norwegian search service using Kartverket's official place name API
// Replaces Nominatim for better Norwegian coverage and accuracy
// Updated: Fixed any potential duplicate key warnings

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

// Text formatting functions
function capitalizeFirstLetter(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatProperName(text: string): string {
  if (!text) return text
  // Split by space and capitalize first letter of each word for proper names
  return text.split(' ').map(word => capitalizeFirstLetter(word.toLowerCase())).join(' ')
}

// Kartverket place name API response interfaces
interface KartverketPlaceName {
  skrivemåte?: string
  stedsnavn?: string
  navn?: string
  navneobjekttype?: string
  stedtype?: string
  kommuner?: Array<{
    kommunenavn: string
    kommunenummer: string
  }>
}

interface KartverketPlaceNameResponse {
  navn?: KartverketPlaceName[]
}

// Reverse geocoding - get place name from coordinates
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    console.log(`🔍 Reverse geocoding coordinates: ${lat}, ${lng}`)

    // Use Kartverket's place name API to find nearby places
    const radius = 1000 // 1km radius
    const url = `https://ws.geonorge.no/stedsnavn/v1/punkt?nord=${lat}&ost=${lng}&radius=${radius}&maxAnt=3`

    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`⚠️ Reverse geocoding failed: ${response.status}`)
      return null
    }

    const data: KartverketPlaceNameResponse = await response.json()
    const places = data.navn || []

    if (places.length > 0) {
      // Find the best place name (prefer populated places, then natural features)
      const priorityOrder = ['by', 'bygd', 'tettsted', 'gård', 'naturområde', 'fjell', 'dal', 'ø', 'vatn']

      let bestPlace = places[0] // fallback to first result
      for (const priorityType of priorityOrder) {
        const priorityPlace = places.find((p: KartverketPlaceName) =>
          p.navneobjekttype?.toLowerCase().includes(priorityType) ||
          p.stedtype?.toLowerCase().includes(priorityType)
        )
        if (priorityPlace) {
          bestPlace = priorityPlace
          break
        }
      }

      const placeName = bestPlace.skrivemåte || bestPlace.stedsnavn || bestPlace.navn
      const placeType = bestPlace.navneobjekttype || bestPlace.stedtype || 'sted'
      const municipality = bestPlace.kommuner?.[0]?.kommunenavn

      if (!placeName) {
        return null // No valid place name found
      }

      let locationDescription = placeName
      if (municipality && municipality !== placeName) {
        locationDescription += `, ${municipality}`
      }

      console.log(`✅ Found place: ${locationDescription} (${placeType})`)
      return locationDescription
    }

    return null
  } catch (error) {
    console.warn('⚠️ Reverse geocoding error:', error)
    return null
  }
}

// Enhanced coordinate parsing supporting multiple formats
function parseCoordinates(input: string): CoordinateParseResult | null {
  const trimmed = input.trim()

  // Format 1: "59.90391°N, 10.89720°E" (PRIORITY - most important format)
  const degreeDirectionPattern = /^(\d+\.?\d*)°?\s*([NS])\s*,?\s*(\d+\.?\d*)°?\s*([EW])$/i
  const degreeDirectionMatch = trimmed.match(degreeDirectionPattern)
  if (degreeDirectionMatch) {
    let lat = parseFloat(degreeDirectionMatch[1])
    const latDir = degreeDirectionMatch[2].toUpperCase()
    let lng = parseFloat(degreeDirectionMatch[3])
    const lngDir = degreeDirectionMatch[4].toUpperCase()

    if (latDir === 'S') lat = -lat
    if (lngDir === 'W') lng = -lng

    if (isValidNumber(lat) && isValidNumber(lng) && isValidNorwegianCoordinate(lat, lng)) {
      console.log(`📍 Parsed coordinates (degree-direction): ${lat}, ${lng}`)
      return { lat, lng, format: 'decimal' }
    }
  }

  // Clean input for other formats (remove various symbols but preserve structure)
  const cleaned = input.replace(/['"′″]/g, '').trim()

  // Format 2: Simple decimal "59.123, 7.456" or "59.123 7.456"
  const decimalMatch = cleaned.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1])
    const lng = parseFloat(decimalMatch[2])

    if (isValidNumber(lat) && isValidNumber(lng) && isValidNorwegianCoordinate(lat, lng)) {
      console.log(`📍 Parsed coordinates (decimal): ${lat}, ${lng}`)
      return { lat, lng, format: 'decimal' }
    }
  }

  // Format 3: "N59.123, E7.456" (direction prefix)
  const prefixDirectionMatch = cleaned.match(/^([NS])\s*(\d+\.?\d*)[,\s]+([EW])\s*(\d+\.?\d*)$/i)
  if (prefixDirectionMatch) {
    const latDir = prefixDirectionMatch[1].toUpperCase()
    let lat = parseFloat(prefixDirectionMatch[2])
    const lngDir = prefixDirectionMatch[3].toUpperCase()
    let lng = parseFloat(prefixDirectionMatch[4])

    if (latDir === 'S') lat = -lat
    if (lngDir === 'W') lng = -lng

    if (isValidNumber(lat) && isValidNumber(lng) && isValidNorwegianCoordinate(lat, lng)) {
      console.log(`📍 Parsed coordinates (prefix-direction): ${lat}, ${lng}`)
      return { lat, lng, format: 'decimal' }
    }
  }

  // Format 4: DMS format "59°12'34.5\"N 7°25'42.1\"E" or "59 12 34.5 N 7 25 42.1 E"
  const dmsPattern = /(\d+)[°\s]*(\d+)?['\s]*(\d+\.?\d*)?["\s]*([NS])\s*[,\s]*(\d+)[°\s]*(\d+)?['\s]*(\d+\.?\d*)?["\s]*([EW])/i
  const dmsMatch = cleaned.match(dmsPattern)
  if (dmsMatch) {
    const latDeg = parseInt(dmsMatch[1], 10)
    const latMin = parseInt(dmsMatch[2] || '0', 10)
    const latSec = parseFloat(dmsMatch[3] || '0')
    const latDir = dmsMatch[4].toUpperCase()

    const lngDeg = parseInt(dmsMatch[5], 10)
    const lngMin = parseInt(dmsMatch[6] || '0', 10)
    const lngSec = parseFloat(dmsMatch[7] || '0')
    const lngDir = dmsMatch[8].toUpperCase()

    let lat = latDeg + latMin/60 + latSec/3600
    let lng = lngDeg + lngMin/60 + lngSec/3600

    if (latDir === 'S') lat = -lat
    if (lngDir === 'W') lng = -lng

    if (isValidNumber(lat) && isValidNumber(lng) && isValidNorwegianCoordinate(lat, lng)) {
      console.log(`📍 Parsed coordinates (DMS): ${lat}, ${lng}`)
      return { lat, lng, format: 'dms' }
    }
  }

  return null
}

// Local POI search with proper capitalization
function searchLocalPOIs(query: string, pois: POILike[]): SearchResult[] {
  const normalizedQuery = query.toLowerCase()
  
  return pois
    .filter(poi => {
      const nameMatch = poi.name.toLowerCase().includes(normalizedQuery)
      const descMatch = poi.description.toLowerCase().includes(normalizedQuery)
      return nameMatch || descMatch
    })
    .map(poi => {
      const formattedName = formatProperName(poi.name)
      const formattedDescription = capitalizeFirstLetter(poi.description)
      
      return {
        id: `poi_${poi.id}`,
        name: formattedName,
        displayName: formattedName,
        lat: poi.lat,
        lng: poi.lng,
        type: 'poi' as const,
        source: 'internal' as const,
        description: formattedDescription
      }
    })
    .slice(0, 5)
}


// Norwegian place type translations - Complete Kartverket terminology
const norwegianPlaceTypes: Record<string, string> = {
  // Administrative units
  'By': 'by',
  'Tettsted': 'tettsted', 
  'Grend': 'grend',
  'Kommune': 'kommune',
  'Fylke': 'fylke',
  'Bydel': 'bydel',
  'Kretsdel': 'kretsdel',
  
  // Natural features - Terrain
  'Fjell': 'fjell',
  'Topp': 'topp',
  'Høyde': 'høyde',
  'Ås': 'ås',
  'Egg': 'egg',
  'Kam': 'kam',
  'Rygg': 'rygg',
  'Dal': 'dal',
  'Dalen': 'dalen',
  'Juv': 'juv',
  'Kløft': 'kløft',
  'Li': 'li',
  'Skråning': 'skråning',
  'Platei': 'plateau',
  'Vidde': 'vidde',
  'Heii': 'hei',
  
  // Water features
  'Innsjø': 'innsjø',
  'Vatn': 'vatn',
  'Tjern': 'tjern',
  'Tjnn': 'tjern',
  'Dam': 'dam',
  'Elv': 'elv',
  'Bekk': 'bekk',
  'Å': 'å',
  'Foss': 'foss',
  'Stryk': 'stryk',
  'Kilde': 'kilde',
  'Fjord': 'fjord',
  'Sund': 'sund',
  'Bukt': 'bukt',
  'Vik': 'vik',
  'Strand': 'strand',
  'Øy': 'øy',
  'Holme': 'holme',
  'Skjær': 'skjær',
  'Grunn': 'grunn',
  
  // Vegetation and landscape
  'Skog': 'skog',
  'Myr': 'myr',
  'Mosse': 'mosse',
  'Sump': 'sump',
  'Eng': 'eng',
  'Mark': 'mark',
  'Lynghei': 'lynghei',
  'Slette': 'slette',
  'Bre': 'bre',
  'Snøfond': 'snøfond',
  'Ur': 'ur',
  
  // Cultural features
  'Gård': 'gård',
  'Gårdstun': 'gårdstun',
  'Husklynge': 'husklynge',
  'Ruin': 'ruin',
  'Tuft': 'tuft',
  'Kirke': 'kirke',
  'Kapell': 'kapell',
  'Kloster': 'kloster',
  'Minnesmere': 'minnesmerke',
  'Gravfelt': 'gravfelt',
  'Røys': 'røys',
  'Steinsetning': 'steinsetning',
  'Varde': 'varde',
  
  // Infrastructure
  'Skole': 'skole',
  'Sykehus': 'sykehus',
  'Stasjon': 'stasjon',
  'Jernbanestasjon': 'jernbanestasjon',
  'Holdeplass': 'holdeplass',
  'Havn': 'havn',
  'Hamn': 'hamn',
  'Kai': 'kai',
  'Flyplass': 'flyplass',
  'Landingsstripe': 'landingsplass',
  'Bru': 'bru',
  'Færgekai': 'færgekai',
  'Tunnel': 'tunnel',
  'Vei': 'vei',
  'Gate': 'gate',
  'Plass': 'plass',
  'Torg': 'torg',
  
  // Outdoor/hiking related
  'Hytte': 'hytte',
  'Bu': 'bu',
  'Koie': 'koie',
  'Seter': 'seter',
  'Støl': 'støl',
  'Gapahuk': 'gapahuk',
  'Vindskjul': 'vindskjul',
  'Rasteplass': 'rasteplass',
  'Utsiktspunkt': 'utsiktspunkt',
  'Aussichtspunkt': 'utsiktspunkt',
  'Trigpunkt': 'trigpunkt',
  'Høydemrke': 'høydemærke',
  'Grotte': 'grotte',
  'Hule': 'hule',
  'Berg': 'berg',
  'Steinbrudd': 'steinbrudd',
  'Gruv': 'gruv'
}

// Enhanced address search with fallback strategies
async function searchKartverketAddresses(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  
  try {
    const encodedQuery = encodeURIComponent(query.trim())
    
    // First try exact search
    const url = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodedQuery}&treffPerSide=10&side=1`
    const response = await attemptAddressSearch(url)
    
    // If no exact results and query looks like "StreetName Number", try street name only
    if (!response || response.length === 0) {
      const addressMatch = query.match(/^(.+?)\s+(\d+[A-Za-z]?)\s*$/)
      if (addressMatch) {
        const streetName = addressMatch[1].trim()
        console.log(`\ud83c\udfe0 Ingen eksakt match for "${query}", pr\u00f8ver gatenavn: "${streetName}"`)
        const streetUrl = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(streetName)}&treffPerSide=8&side=1`
        const streetResults = await attemptAddressSearch(streetUrl)
        if (streetResults && streetResults.length > 0) {
          results.push(...streetResults)
        }
      }
    } else {
      results.push(...response)
    }
    
    // If still no results, try fuzzy search as last resort
    if (results.length === 0) {
      console.log(`\ud83c\udfe0 Pr\u00f8ver fuzzy search for "${query}"`)
      const fuzzyUrl = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodedQuery}&treffPerSide=10&side=1&fuzzy=true`
      const fuzzyResults = await attemptAddressSearch(fuzzyUrl)
      if (fuzzyResults) {
        results.push(...fuzzyResults)
      }
    }
    
    return results
    
  } catch (error) {
    console.error('Adresse s\u00f8kefeil:', error)
    return []
  }
}

// Helper function for address search attempts
async function attemptAddressSearch(url: string): Promise<SearchResult[]> {
  try {
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
        
        // Format address components with proper capitalization
        const formattedAddress = formatProperName(address.adressetekst)
        const formattedMunicipality = formatProperName(address.kommunenavn)
        
        return {
          id: `kartverket_addr_${address.adressenavn}_${address.nummer}_${address.postnummer}`,
          name: formattedAddress,
          displayName: `${formattedAddress}, ${formattedMunicipality}`,
          lat,
          lng,
          type: 'address' as const,
          source: 'kartverket' as const,
          municipality: formattedMunicipality,
          description: `Adresse i ${formattedMunicipality} kommune (${address.postnummer})`
        }
      })
      .filter((result): result is SearchResult => result !== null)
      .slice(0, 6)
    
  } catch (error) {
    console.error('Address search error:', error)
    return []
  }
}

// Kartverket place name search implementation
async function searchKartverket(query: string): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query.trim())
    const url = `https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodedQuery}*&treffPerSide=10&side=1&kommunenummer=*&fuzzy=true`
    
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
        
        // Extract municipality and county from arrays with proper capitalization
        const municipality = place.kommuner?.[0]?.kommunenavn ? formatProperName(place.kommuner[0].kommunenavn) : ''
        const county = place.fylker?.[0]?.fylkesnavn ? formatProperName(place.fylker[0].fylkesnavn) : ''
        
        // Create display name with administrative context
        const typeLabel = norwegianPlaceTypes[place.navneobjekttype] || place.navneobjekttype.toLowerCase()
        const formattedPlaceName = formatProperName(place.skrivemåte)
        const displayName = createDisplayName(place, typeLabel, municipality, county)
        
        return {
          id: `kartverket_${place.stedsnummer}`,
          name: formattedPlaceName,
          displayName,
          lat,
          lng,
          type: 'place' as const,
          source: 'kartverket' as const,
          municipality: municipality,
          county: county,
          description: capitalizeFirstLetter(`${typeLabel}${municipality ? ` i ${municipality} kommune` : ''}${county ? `, ${county} fylke` : ''}`)
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
  const baseName = formatProperName(place.skrivemåte)
  
  // For major cities, just show name
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
  
  // For other places, include municipality context but avoid showing street name type
  const _shouldShowType = !['gate', 'vei', 'plass', 'torg'].some(streetType =>
    baseName.toLowerCase().includes(streetType)
  )
  
  if (municipality && municipality !== baseName) {
    // Remove redundant type info - it's shown in description below
    return `${baseName}, ${municipality}`
  } else if (county) {
    // Remove redundant type info - it's shown in description below
    return `${baseName}, ${county}`
  }

  // Just return the base name - type info is shown in description
  
  return baseName
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

    // Places before addresses (prioritize places as requested)
    if (a.type === 'place' && b.type === 'address') return -1
    if (b.type === 'place' && a.type === 'address') return 1

    // For very specific address searches, still show good address matches prominently
    const aIsVeryGoodAddressMatch = a.type === 'address' && (
      a.name.toLowerCase().startsWith(normalizedQuery) ||
      a.name.toLowerCase() === normalizedQuery
    )
    const bIsVeryGoodAddressMatch = b.type === 'address' && (
      b.name.toLowerCase().startsWith(normalizedQuery) ||
      b.name.toLowerCase() === normalizedQuery
    )

    // Very specific address matches can still compete with places
    if (aIsVeryGoodAddressMatch && b.type === 'place' && !b.name.toLowerCase().startsWith(normalizedQuery)) return -1
    if (bIsVeryGoodAddressMatch && a.type === 'place' && !a.name.toLowerCase().startsWith(normalizedQuery)) return 1
    
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
  }).slice(0, 12)
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
      // 1. Parse coordinates and perform reverse geocoding
      const coordResult = parseCoordinates(cleanQuery)
      if (coordResult) {
        // Try to get place name for coordinates
        const placeName = await reverseGeocode(coordResult.lat, coordResult.lng)

        const coordinatesDisplay = `${coordResult.lat.toFixed(5)}°N, ${coordResult.lng.toFixed(5)}°E`

        results.push({
          id: `coord_${coordResult.lat}_${coordResult.lng}`,
          name: placeName || 'Koordinater',
          displayName: placeName
            ? `${placeName} • ${coordinatesDisplay}`
            : coordinatesDisplay,
          lat: coordResult.lat,
          lng: coordResult.lng,
          type: 'coordinates',
          source: 'koordinater',
          description: placeName
            ? `${placeName} - ${coordinatesDisplay}`
            : capitalizeFirstLetter(`Koordinater (${coordResult.format})`)
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
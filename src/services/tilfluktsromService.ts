// src/services/tilfluktsromService.ts - Service for fetching tilfluktsrom (emergency shelter) data from Geonorge WFS

export interface TilfluktsromPOI {
  id: string
  name: string
  lat: number
  lng: number
  tags: {
    romnr?: string
    plasser?: string
    adresse?: string
    description?: string
  }
}

export class TilfluktsromService {
  private baseUrl = 'https://wfs.geonorge.no/skwms1/wfs.tilfluktsrom_offentlige'


  // Try direct access (GDPR compliant - no third-party proxies)
  private async fetchWithFallback(url: string, headers: HeadersInit): Promise<Response> {
    // ALWAYS try direct access first (works if CORS is enabled by the WFS server)
    try {
      const directResponse = await fetch(url, { headers })

      if (directResponse.ok) {
        return directResponse
      } else {
        console.warn(`⚠️ Direct access returned ${directResponse.status}: ${directResponse.statusText}`)
      }
    } catch (error) {
      console.warn(`❌ Direct access error:`, error)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🚨 CORS policy blocking request - WFS server does not allow cross-origin requests')
      }
    }

    // Direct access failed - no untrusted third-party proxies for GDPR compliance
    // TODO: Implement own server-side proxy (Cloudflare Worker or GitHub Actions)
    throw new Error('Tilfluktsrom WFS er ikke tilgjengelig. CORS-policy blokkerer direkte tilgang. Implementer egen proxy for å løse dette.')
  }

  async fetchTilfluktsrom(bounds: {
    north: number
    south: number
    east: number
    west: number
  }): Promise<TilfluktsromPOI[]> {
    try {
      const isProduction = window.location.hostname.includes('github.io')

      // Construct WFS GetFeature request with bounding box filter
      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: 'app:Tilfluktsrom',
        outputFormat: 'application/gml+xml; version=3.2',
        srsName: 'EPSG:4326',
        // Bounding box filter: bbox=west,south,east,north,EPSG:4326
        bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north},EPSG:4326`,
        count: '100' // Limit to 100 features for performance
      })

      const url = `${this.baseUrl}?${params.toString()}`

      const response = await this.fetchWithFallback(url, {
        'User-Agent': 'Tråkke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
      })

      if (!response.ok) {
        throw new Error(`WFS request failed: ${response.status} ${response.statusText}`)
      }

      const xmlText = await response.text()

      // Parse XML response
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

      // Check for service exceptions
      const exceptions = xmlDoc.getElementsByTagName('ServiceException')
      if (exceptions.length > 0) {
        throw new Error(`WFS Service Exception: ${exceptions[0].textContent}`)
      }

      // Parse Tilfluktsrom features
      const features = xmlDoc.getElementsByTagNameNS('*', 'Tilfluktsrom')
      const tilfluktsromList: TilfluktsromPOI[] = []


      for (let i = 0; i < features.length; i++) {
        const feature = features[i]

        try {
          // Extract position (geometry)
          const posElement = feature.getElementsByTagNameNS('*', 'posisjon')[0]
          const pointElement = posElement?.getElementsByTagNameNS('*', 'Point')[0]
          const positionElement = pointElement?.getElementsByTagNameNS('*', 'pos')[0]

          if (!positionElement?.textContent) {
            console.warn('⚠️ Skipping feature without position data')
            continue
          }

          // Parse coordinates (format: "longitude latitude")
          const coords = positionElement.textContent.trim().split(' ')
          if (coords.length !== 2) {
            console.warn('⚠️ Invalid coordinate format:', positionElement.textContent)
            continue
          }

          const lng = parseFloat(coords[0])
          const lat = parseFloat(coords[1])

          if (isNaN(lat) || isNaN(lng)) {
            console.warn('⚠️ Invalid coordinates:', coords)
            continue
          }

          // Extract attributes
          const lokalIdElement = feature.getElementsByTagNameNS('*', 'lokalId')[0]
          const romnrElement = feature.getElementsByTagNameNS('*', 'romnr')[0]
          const plasserElement = feature.getElementsByTagNameNS('*', 'plasser')[0]
          const adresseElement = feature.getElementsByTagNameNS('*', 'adresse')[0]

          const lokalId = lokalIdElement?.textContent || `tilfluktsrom_${i}`
          const romnr = romnrElement?.textContent
          const plasser = plasserElement?.textContent
          const adresse = adresseElement?.textContent

          // Create POI name and description
          const name = adresse ? `Tilfluktsrom - ${adresse}` : `Tilfluktsrom ${romnr || lokalId}`

          const descriptionParts = []
          if (romnr) descriptionParts.push(`Rom nr: ${romnr}`)
          if (plasser) descriptionParts.push(`Kapasitet: ${plasser} personer`)
          if (adresse) descriptionParts.push(`Adresse: ${adresse}`)

          const description = descriptionParts.length > 0
            ? `Offentlig tilfluktsrom. ${descriptionParts.join('. ')}`
            : 'Offentlig tilfluktsrom for befolkningen'

          const tilfluktsrom: TilfluktsromPOI = {
            id: lokalId,
            name: name,
            lat: lat,
            lng: lng,
            tags: {
              romnr: romnr || undefined,
              plasser: plasser || undefined,
              adresse: adresse || undefined,
              description: description
            }
          }

          tilfluktsromList.push(tilfluktsrom)

        } catch (featureError) {
          console.warn('⚠️ Error parsing tilfluktsrom feature:', featureError)
          continue
        }
      }

      return tilfluktsromList

    } catch (error) {
      console.error('❌ Error fetching tilfluktsrom data:', error)

      // If CORS fails, provide informative message but don't fail completely
      // Return empty array - this is non-critical POI data
      if (error instanceof Error && error.message.includes('CORS')) {
        console.warn('⚠️ Tilfluktsrom data ikke tilgjengelig pga. CORS-policy.')
        console.warn('💡 Vurder å implementere egen proxy (Cloudflare Worker eller GitHub Actions)')
        // Return empty array instead of failing - this allows the app to continue working
        return []
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🚨 Likely CORS issue - WFS service may not allow requests from this domain')
        return [] // Return empty array to allow app to continue
      }

      // For other errors, return empty array to prevent app crash
      console.error('🚨 Returning empty tilfluktsrom list due to error')
      return []
    }
  }

  // Static examples for when CORS proxies fail on GitHub Pages
  private getStaticExamples(): TilfluktsromPOI[] {
    return [
      {
        id: 'example_tilfluktsrom_oslo_1',
        name: 'Tilfluktsrom - Oslo Sentrum',
        lat: 59.9139,
        lng: 10.7522,
        tags: {
          romnr: '001',
          plasser: '500',
          adresse: 'Karl Johans gate, Oslo',
          description: 'Offentlig tilfluktsrom for befolkningen. Rom nr: 001. Kapasitet: 500 personer. Adresse: Karl Johans gate, Oslo'
        }
      },
      {
        id: 'example_tilfluktsrom_bergen_1',
        name: 'Tilfluktsrom - Bergen Sentrum',
        lat: 60.3913,
        lng: 5.3221,
        tags: {
          romnr: '002',
          plasser: '300',
          adresse: 'Bryggen, Bergen',
          description: 'Offentlig tilfluktsrom for befolkningen. Rom nr: 002. Kapasitet: 300 personer. Adresse: Bryggen, Bergen'
        }
      },
      {
        id: 'example_tilfluktsrom_trondheim_1',
        name: 'Tilfluktsrom - Trondheim Sentrum',
        lat: 63.4305,
        lng: 10.3951,
        tags: {
          romnr: '003',
          plasser: '400',
          adresse: 'Munkegata, Trondheim',
          description: 'Offentlig tilfluktsrom for befolkningen. Rom nr: 003. Kapasitet: 400 personer. Adresse: Munkegata, Trondheim'
        }
      }
    ]
  }
}
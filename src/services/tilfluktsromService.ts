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

  // Use CORS proxy for production (GitHub Pages) to avoid CORS issues
  private getCorsProxyUrl(): string {
    const isProduction = window.location.hostname.includes('github.io')
    if (isProduction) {
      // Use a reliable CORS proxy for production
      return `https://corsproxy.io/?${encodeURIComponent(this.baseUrl)}`
    }
    return this.baseUrl
  }

  async fetchTilfluktsrom(bounds: {
    north: number
    south: number
    east: number
    west: number
  }): Promise<TilfluktsromPOI[]> {
    try {
      const isProduction = window.location.hostname.includes('github.io')
      console.log(`🏠 Fetching tilfluktsrom data from Geonorge WFS... (${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode)`, bounds)

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

      const baseServiceUrl = this.getCorsProxyUrl()
      const url = `${baseServiceUrl}?${params.toString()}`
      console.log('🔗 WFS URL:', url)

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Tråkke Norwegian Outdoor App (https://github.com/elzacka/trakke-react)'
        }
      })

      if (!response.ok) {
        throw new Error(`WFS request failed: ${response.status} ${response.statusText}`)
      }

      const xmlText = await response.text()
      console.log('📄 Received XML response, parsing...')

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

      console.log(`📊 Found ${features.length} tilfluktsrom features`)

      for (let i = 0; i < features.length; i++) {
        const feature = features[i]

        try {
          // Extract position (geometry)
          const posElement = feature.getElementsByTagNameNS('*', 'posisjon')[0]
          const pointElement = posElement?.getElementsByTagNameNS('*', 'Point')[0]
          const positionElement = pointElement?.getElementsByTagNameNS('*', 'pos')[0]

          if (!positionElement || !positionElement.textContent) {
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

      console.log(`✅ Successfully parsed ${tilfluktsromList.length} tilfluktsrom POIs`)
      return tilfluktsromList

    } catch (error) {
      console.error('❌ Error fetching tilfluktsrom data:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🚨 Likely CORS issue - WFS service may not allow requests from this domain')
        throw new Error('CORS error: Tilfluktsrom service not accessible from this domain. This may work in development but fail in production.')
      }
      throw error
    }
  }
}
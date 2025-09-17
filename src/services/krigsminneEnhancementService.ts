// src/services/krigsminneEnhancementService.ts - Enhanced data for war memorial POIs

export interface HistoricalData {
  period?: string
  significance?: string
  description?: string
  sources?: string[]
}

export interface MediaThumbnail {
  url: string
  title?: string
  source: 'flickr' | 'wikipedia' | 'mapillary'
  caption?: string
  year?: number
  photographer?: string
}

export interface WikipediaData {
  extract?: string
  fullUrl?: string
  relatedArticles?: Array<{
    title: string
    url: string
    extract: string
  }>
}

export interface EnhancedKrigsminneData {
  historicalData?: HistoricalData
  media?: {
    thumbnails: MediaThumbnail[]
    wikipediaData?: WikipediaData
  }
  visitInfo?: {
    accessibility?: string
    nearbyParking?: boolean
    seasonalAccess?: string
  }
}

export class KrigsminneEnhancementService {
  private flickrApiKey = '2f0e634b471b9c9a74f47d3b2eb7a3f0' // Free public key
  private wikipediaApiBase = 'https://no.wikipedia.org/api/rest_v1'

  /**
   * Enhance a Krigsminne POI with additional historical data and media
   */
  async enhancePOI(lat: number, lng: number, name: string): Promise<EnhancedKrigsminneData> {
    console.log(`🏰 Enhancing Krigsminne POI: ${name} at [${lat}, ${lng}]`)

    try {
      const [wikipediaData, flickrImages] = await Promise.all([
        this.fetchWikipediaInfo(lat, lng, name),
        this.fetchFlickrImages(lat, lng, name)
      ])

      const enhancedData: EnhancedKrigsminneData = {
        media: {
          thumbnails: flickrImages,
          wikipediaData
        }
      }

      console.log(`✅ Enhanced POI with ${flickrImages.length} images and Wikipedia data:`, enhancedData)
      return enhancedData

    } catch (error) {
      console.error('❌ Error enhancing Krigsminne POI:', error)
      return {}
    }
  }

  /**
   * Fetch Wikipedia articles near the POI location
   */
  private async fetchWikipediaInfo(lat: number, lng: number, poiName: string): Promise<WikipediaData | undefined> {
    try {
      console.log(`📚 Fetching Wikipedia data for ${poiName}...`)

      // Search for nearby Wikipedia articles
      const geoSearchUrl = `${this.wikipediaApiBase}/page/geosearch?latitude=${lat}&longitude=${lng}&radius=1000&limit=3`

      const response = await fetch(geoSearchUrl)
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`)
      }

      const data = await response.json()
      const pages = data.pages || []

      if (pages.length === 0) {
        console.log('📚 No Wikipedia articles found nearby')
        return undefined
      }

      // Get the most relevant article (usually the first one)
      const primaryPage = pages[0]

      // Fetch full content for the primary article
      const pageUrl = `${this.wikipediaApiBase}/page/summary/${encodeURIComponent(primaryPage.title)}`
      const pageResponse = await fetch(pageUrl)

      if (pageResponse.ok) {
        const pageData = await pageResponse.json()

        const wikipediaData: WikipediaData = {
          extract: pageData.extract || pageData.description,
          fullUrl: pageData.content_urls?.desktop?.page,
          relatedArticles: pages.slice(1).map((page: {title: string, description?: string}) => ({
            title: page.title,
            url: `https://no.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            extract: page.description || `Wikipedia artikkel om ${page.title}`
          }))
        }

        console.log(`📚 Found Wikipedia data: ${pageData.title}`)
        return wikipediaData
      }

      return undefined

    } catch (error) {
      console.error('❌ Wikipedia fetch error:', error)
      return undefined
    }
  }

  /**
   * Fetch historical images from Flickr API
   */
  private async fetchFlickrImages(lat: number, lng: number, poiName: string): Promise<MediaThumbnail[]> {
    try {
      console.log(`📸 Fetching Flickr images for ${poiName}...`)

      // Create search terms based on POI name and common war memorial terms
      const searchTerms = [
        poiName.toLowerCase(),
        'norge norway',
        'krigsminne war memorial',
        'fort festning',
        'historisk historical',
        'bunker',
        'minnested memorial'
      ].join(' ')

      const flickrUrl = 'https://api.flickr.com/services/rest/'
      const params = new URLSearchParams({
        method: 'flickr.photos.search',
        api_key: this.flickrApiKey,
        lat: lat.toString(),
        lon: lng.toString(),
        radius: '1', // 1km radius
        tags: searchTerms,
        tag_mode: 'any',
        sort: 'relevance',
        per_page: '6',
        format: 'json',
        nojsoncallback: '1',
        extras: 'url_t,url_s,url_m,description,date_taken,owner_name'
      })

      const response = await fetch(`${flickrUrl}?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Flickr API error: ${response.status}`)
      }

      const data = await response.json()
      const photos = data.photos?.photo || []

      interface FlickrPhoto {
        url_t?: string
        url_s?: string
        url_m?: string
        title?: string
        description?: { _content?: string }
        datetaken?: string
        ownername?: string
      }

      const thumbnails: MediaThumbnail[] = photos
        .filter((photo: FlickrPhoto) => photo.url_t || photo.url_s) // Only photos with thumbnails
        .map((photo: FlickrPhoto) => ({
          url: photo.url_t || photo.url_s || photo.url_m,
          title: photo.title || 'Historisk bilde',
          source: 'flickr' as const,
          caption: photo.description?._content || photo.title,
          year: photo.datetaken ? new Date(photo.datetaken).getFullYear() : undefined,
          photographer: photo.ownername
        }))

      console.log(`📸 Found ${thumbnails.length} Flickr images`)
      return thumbnails

    } catch (error) {
      console.error('❌ Flickr fetch error:', error)
      return []
    }
  }

  /**
   * Generate enhanced historical description based on available data
   */
  generateEnhancedDescription(originalDescription: string, enhancedData: EnhancedKrigsminneData): string {
    let description = originalDescription

    if (enhancedData.media?.wikipediaData?.extract) {
      // Add Wikipedia context if available
      const extract = enhancedData.media.wikipediaData.extract
      if (extract.length > 100) {
        description += `\n\n${extract.substring(0, 200)}...`
      } else {
        description += `\n\n${extract}`
      }
    }

    return description
  }
}

// Export singleton instance
export const krigsminneEnhancementService = new KrigsminneEnhancementService()
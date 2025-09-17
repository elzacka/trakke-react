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
  private flickrApiKey = '2f0e634b471b9c9a74f47d3b2eb7a3f0' // Free public key for demonstration
  private wikipediaApiBase = 'https://no.wikipedia.org/api/rest_v1' // Norwegian Wikipedia

  /**
   * Enhance a Krigsminne POI with additional historical data and media
   */
  async enhancePOI(lat: number, lng: number, name: string): Promise<EnhancedKrigsminneData> {
    console.log(`🏰 Enhancing Krigsminne POI: ${name} at [${lat}, ${lng}]`)

    try {
      console.log(`📡 Starting parallel fetch for Wikipedia and Flickr data...`)

      const [wikipediaData, flickrImages] = await Promise.allSettled([
        this.fetchWikipediaInfo(lat, lng, name),
        this.fetchFlickrImages(lat, lng, name)
      ])

      const wikiResult = wikipediaData.status === 'fulfilled' ? wikipediaData.value : undefined
      const flickrResult = flickrImages.status === 'fulfilled' ? flickrImages.value : []

      if (wikipediaData.status === 'rejected') {
        console.warn('⚠️ Wikipedia fetch failed:', wikipediaData.reason)
      }
      if (flickrImages.status === 'rejected') {
        console.warn('⚠️ Flickr fetch failed:', flickrImages.reason)
      }

      const enhancedData: EnhancedKrigsminneData = {
        media: {
          thumbnails: flickrResult || [],
          wikipediaData: wikiResult
        }
      }

      const hasContent = (flickrResult?.length || 0) > 0 || (wikiResult?.extract)
      console.log(`✅ Enhanced POI with ${flickrResult?.length || 0} images and ${wikiResult ? 'Wikipedia' : 'no Wikipedia'} data. Has content: ${hasContent}`)

      if (hasContent) {
        console.log(`📊 Enhancement details:`, enhancedData)
      }

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
      console.log(`📚 Fetching Norwegian Wikipedia data for ${poiName}...`)

      // Search for nearby Wikipedia articles with extended radius
      const geoSearchUrl = `${this.wikipediaApiBase}/page/geosearch?latitude=${lat}&longitude=${lng}&radius=5000&limit=5`
      console.log(`🔗 Wikipedia URL: ${geoSearchUrl}`)

      const response = await fetch(geoSearchUrl)
      if (!response.ok) {
        console.error(`❌ Wikipedia API error: ${response.status} ${response.statusText}`)
        throw new Error(`Wikipedia API error: ${response.status}`)
      }

      const data = await response.json()
      console.log(`📊 Wikipedia geosearch response:`, data)

      const pages = data.pages || []

      if (pages.length === 0) {
        console.log('📚 No Norwegian Wikipedia articles found nearby, trying broader search...')

        // Try text search as fallback
        const textSearchUrl = `${this.wikipediaApiBase}/page/search?query=${encodeURIComponent(poiName + ' norge')}&limit=3`
        console.log(`🔗 Wikipedia text search URL: ${textSearchUrl}`)

        const textResponse = await fetch(textSearchUrl)
        if (textResponse.ok) {
          const textData = await textResponse.json()
          console.log(`📊 Wikipedia text search response:`, textData)

          if (textData.pages && textData.pages.length > 0) {
            // Use text search results
            return this.processWikipediaPages(textData.pages)
          }
        }

        return undefined
      }

      return this.processWikipediaPages(pages)

    } catch (error) {
      console.error('❌ Wikipedia fetch error:', error)
      return undefined
    }
  }

  /**
   * Process Wikipedia pages and extract relevant data
   */
  private async processWikipediaPages(pages: Array<{title: string, description?: string}>): Promise<WikipediaData | undefined> {
    try {
      const primaryPage = pages[0]
      console.log(`📄 Processing Wikipedia page: ${primaryPage.title}`)

      // Fetch full content for the primary article
      const pageUrl = `${this.wikipediaApiBase}/page/summary/${encodeURIComponent(primaryPage.title)}`
      console.log(`🔗 Wikipedia summary URL: ${pageUrl}`)

      const pageResponse = await fetch(pageUrl)

      if (pageResponse.ok) {
        const pageData = await pageResponse.json()
        console.log(`📊 Wikipedia summary response:`, pageData)

        const wikipediaData: WikipediaData = {
          extract: pageData.extract || pageData.description,
          fullUrl: pageData.content_urls?.desktop?.page,
          relatedArticles: pages.slice(1).map((page: {title: string, description?: string}) => ({
            title: page.title,
            url: `https://no.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            extract: page.description || `Wikipedia-artikkel om ${page.title}`
          }))
        }

        console.log(`✅ Successfully processed Wikipedia data for: ${pageData.title}`)
        return wikipediaData
      } else {
        console.warn(`⚠️ Wikipedia summary request failed: ${pageResponse.status}`)
      }

      return undefined
    } catch (error) {
      console.error('❌ Error processing Wikipedia pages:', error)
      return undefined
    }
  }

  /**
   * Fetch historical images from Flickr API
   */
  private async fetchFlickrImages(lat: number, lng: number, poiName: string): Promise<MediaThumbnail[]> {
    try {
      console.log(`📸 Fetching Flickr images for ${poiName}...`)

      // Create Norwegian search terms based on POI name and war memorial terms
      const norwegianTerms = [
        poiName.toLowerCase(),
        'norge',
        'krigsminne',
        'minnested',
        'historisk',
        'festning',
        'fort',
        'bunker',
        'minnesmerke',
        'annen verdenskrig',
        'andre verdenskrig',
        'wwii',
        'krig'
      ]

      // Add English equivalents for broader search
      const englishTerms = [
        'norway',
        'war memorial',
        'fortress',
        'historical',
        'memorial',
        'world war',
        'wwii'
      ]

      const searchTerms = [...norwegianTerms, ...englishTerms].join(' ')

      const flickrUrl = 'https://api.flickr.com/services/rest/'
      const params = new URLSearchParams({
        method: 'flickr.photos.search',
        api_key: this.flickrApiKey,
        lat: lat.toString(),
        lon: lng.toString(),
        radius: '5', // Increased to 5km radius for more results
        text: searchTerms, // Use text search instead of just tags
        tags: 'norge,norway,krigsminne,memorial,fort,festning', // Specific tags
        tag_mode: 'any',
        sort: 'relevance',
        per_page: '12', // More results to filter from
        format: 'json',
        nojsoncallback: '1',
        extras: 'url_t,url_s,url_m,description,date_taken,owner_name,tags',
        content_type: '1', // Photos only
        media: 'photos'
      })

      const fullUrl = `${flickrUrl}?${params.toString()}`
      console.log(`🔗 Flickr API URL: ${fullUrl}`)

      const response = await fetch(fullUrl)
      if (!response.ok) {
        console.error(`❌ Flickr API error: ${response.status} ${response.statusText}`)
        throw new Error(`Flickr API error: ${response.status}`)
      }

      const data = await response.json()
      console.log(`📊 Flickr API response:`, data)

      const photos = data.photos?.photo || []
      console.log(`📸 Found ${photos.length} photos from Flickr API`)

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
        .slice(0, 6) // Limit to 6 best images
        .map((photo: FlickrPhoto) => ({
          url: photo.url_t || photo.url_s || photo.url_m,
          title: photo.title || 'Historisk bilde',
          source: 'flickr' as const,
          caption: photo.description?._content || photo.title || 'Historisk fotografi',
          year: photo.datetaken ? new Date(photo.datetaken).getFullYear() : undefined,
          photographer: photo.ownername || 'Ukjent fotograf'
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
// Turrutebasen WMS Service - Norwegian National Trail Database
import type {
  Trail,
  TrailSearchQuery,
  TrailSearchResult,
  BoundingBox,
  ElevationPoint,
  PlannedRoute,
  RoutePreferences
} from '../data/trails'
import { ElevationService } from './elevationService'

export class TurrutebasenService {
  private static readonly WMS_BASE_URL = 'https://wms.geonorge.no/skwms1/wms.friluftsruter2'
  private static readonly WMS_VERSION = '1.3.0'

  private static readonly WMS_LAYERS = {
    hiking: 'friluftsruter:Fotrute',
    cycling: 'friluftsruter:Sykkelrute',
    skiing: 'friluftsruter:Skiloype',
    other: 'friluftsruter:AnnenRute'
  } as const

  static async checkServiceAvailability(): Promise<boolean> {
    try {
      const capabilitiesUrl = `${this.WMS_BASE_URL}?service=WMS&version=${this.WMS_VERSION}&request=GetCapabilities`
      const response = await fetch(capabilitiesUrl, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      console.error('WMS service unavailable:', error)
      return false
    }
  }

  static getWMSTileURL(trailType: keyof typeof this.WMS_LAYERS): string {
    const layer = this.WMS_LAYERS[trailType]
    return `${this.WMS_BASE_URL}?service=WMS&version=${this.WMS_VERSION}&request=GetMap&layers=${layer}&styles=&format=image/png&transparent=true&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
  }

  static getWMSLayerSources(): Record<string, { type: 'raster'; tiles: string[]; tileSize: number; attribution: string }> {
    const sources: Record<string, { type: 'raster'; tiles: string[]; tileSize: number; attribution: string }> = {}

    Object.entries(this.WMS_LAYERS).forEach(([type, _layer]) => {
      sources[`turrutebasen-${type}`] = {
        type: 'raster',
        tiles: [this.getWMSTileURL(type as keyof typeof this.WMS_LAYERS)],
        tileSize: 256,
        attribution: '© Kartverket'
      }
    })

    return sources
  }

  static async fetchTrailsInBounds(_bounds: BoundingBox, _options?: {
    maxFeatures?: number
    types?: string[]
  }): Promise<Trail[]> {
    console.log('Trail data served via WMS layers')
    return []
  }

  static async getTrailById(_id: string): Promise<Trail | null> {
    console.log('Trail detail lookup not supported in WMS mode')
    return null
  }

  static async searchTrails(query: TrailSearchQuery): Promise<TrailSearchResult> {
    console.log('Trail search uses WMS layers')
    return {
      trails: [],
      totalCount: 0,
      searchTime: 0,
      bounds: query.bounds
    }
  }

  static async getElevationProfile(trail: Trail, resolution = 50): Promise<ElevationPoint[]> {
    try {
      const coords = trail.geometry.coordinates
      if (!coords || coords.length < 2) {
        return []
      }
      return await ElevationService.generateElevationProfile(coords, resolution)
    } catch (error) {
      console.error('Failed to generate elevation profile:', error)
      return []
    }
  }

  static async planRoute(start: { lat: number; lng: number }, end: { lat: number; lng: number }, _preferences?: RoutePreferences): Promise<PlannedRoute | null> {
    console.log('Route planning from', start, 'to', end)
    return null
  }
}
/**
 * Naturskog (Natural Forest) WMS Service
 *
 * Provides access to three types of natural forest visualization layers:
 * 1. Skog etablert før 1940 (Forest established before 1940)
 * 2. Naturskogsannsynlighet (Natural forest probability)
 * 3. Naturskogsnærhet (Natural forest proximity)
 *
 * Data from Miljødirektoratet and Landbruksdirektoratet via Geonorge
 */

export type NaturskogLayerType = 'forest_pre_1940' | 'forest_probability' | 'forest_proximity'

export interface NaturskogLayer {
  type: NaturskogLayerType
  name: string
  description: string
  wmsLayerName: string
  icon: string
  color: string
}

export interface MapLibreRasterSource {
  type: 'raster'
  tiles: string[]
  tileSize: number
}

export interface MapLibreRasterLayer {
  id: string
  type: 'raster'
  source: string
  layout: {
    visibility: 'visible' | 'none'
  }
  paint: {
    'raster-opacity': number
    'raster-hue-rotate'?: number
  }
}

export const NATURSKOG_LAYERS: NaturskogLayer[] = [
  {
    type: 'forest_pre_1940',
    name: 'Skog etablert før 1940',
    description: 'Skog som har stått kontinuerlig siden 1940 – kan være plantet eller tynnet, men ikke flatehogd',
    wmsLayerName: 'skog_etablert_foer_1940_ikke_flatehogd',
    icon: 'forest',
    color: '#2d5016'
  },
  {
    type: 'forest_probability',
    name: 'Urørt skog (sannsynlighet)',
    description: 'Hvor sannsynlig det er at skogen er urørt siden 1965 – mindre menneskelig påvirkning',
    wmsLayerName: 'naturskogssannsynlighet',
    icon: 'park',
    color: '#4a7c59'
  },
  {
    type: 'forest_proximity',
    name: 'Villmarkspreg (gradering)',
    description: 'Gradering av hvor urørt og villmarksaktig skogen er',
    wmsLayerName: 'naturskogsnaerhet',
    icon: 'eco',
    color: '#5d8a32'
  }
]

export class NaturskogService {
  private static readonly WMS_BASE_URL = 'https://image001.miljodirektoratet.no/arcgis/services/naturskog/naturskog_v1/MapServer/WMSServer'

  /**
   * Generate WMS layer sources for MapLibre GL JS
   * Uses real Naturskog WMS data from Miljødirektoratet
   */
  static getWMSLayerSources(): Record<string, MapLibreRasterSource> {
    const sources: Record<string, MapLibreRasterSource> = {}

    NATURSKOG_LAYERS.forEach(layer => {
      // Real WMS tiles from Miljødirektoratet - using lowercase parameters to match working Turrutebasen format
      const wmsUrl = `${this.WMS_BASE_URL}?service=WMS&version=1.3.0&request=GetMap&format=image/png&transparent=true&layers=${layer.wmsLayerName}&crs=EPSG:3857&styles=&width=256&height=256&bbox={bbox-epsg-3857}`

      sources[`naturskog-${layer.type}`] = {
        type: 'raster',
        tiles: [wmsUrl],
        tileSize: 256
      }
    })

    return sources
  }

  /**
   * Generate MapLibre layer definitions for the WMS sources
   */
  static getMapLayers(): MapLibreRasterLayer[] {
    return NATURSKOG_LAYERS.map(layer => ({
      id: `naturskog-${layer.type}`,
      type: 'raster',
      source: `naturskog-${layer.type}`,
      layout: {
        visibility: 'none' // Start hidden
      },
      paint: {
        'raster-opacity': 0.8 // Good opacity for WMS data visibility
      }
    }))
  }

  /**
   * Get layer configuration by type
   */
  static getLayerByType(type: NaturskogLayerType): NaturskogLayer | undefined {
    return NATURSKOG_LAYERS.find(layer => layer.type === type)
  }

  /**
   * Validate if WMS service is available
   */
  static async validateService(): Promise<boolean> {
    try {
      const response = await fetch(`${this.WMS_BASE_URL}?SERVICE=WMS&REQUEST=GetCapabilities`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch (error) {
      console.warn('⚠️ Naturskog WMS service not available:', error)
      return false
    }
  }
}
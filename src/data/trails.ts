// Trail data types and interfaces for Turrutebasen integration
// Separate from POI system - trails are linear routes, not points

export type TrailType = 'hiking' | 'skiing' | 'cycling' | 'mixed' | 'other'
export type TrailDifficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type TrailSurface = 'paved' | 'gravel' | 'dirt' | 'stone' | 'boardwalk' | 'snow' | 'mixed'
export type TrailCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'closed' | 'unknown'

export interface ElevationPoint {
  distance: number    // Distance from start in meters
  elevation: number   // Elevation in meters above sea level
  lat: number
  lng: number
}

export interface TrailProperties {
  name: string
  description?: string
  difficulty: TrailDifficulty
  type: TrailType
  distance: number                    // Total distance in meters
  estimatedTime?: number              // Estimated hiking time in minutes
  elevationGain?: number             // Total elevation gain in meters
  elevationLoss?: number             // Total elevation loss in meters
  highestPoint?: number              // Highest elevation in meters
  lowestPoint?: number               // Lowest elevation in meters
  surface?: TrailSurface
  condition?: TrailCondition
  municipality: string
  county: string
  maintainer?: string                // Organization responsible for maintenance
  markings?: string[]               // Trail marking colors/symbols
  season?: string[]                 // Best seasons: 'spring', 'summer', 'autumn', 'winter'
  facilities?: string[]             // Available facilities along trail
  accessibility?: {
    wheelchairAccessible: boolean
    strollerFriendly: boolean
    dogFriendly: boolean
  }
  warnings?: string[]               // Safety warnings or restrictions
  permits?: {
    required: boolean
    description?: string
    link?: string
  }
}

export interface Trail {
  id: string
  geometry: GeoJSON.LineString        // Vector path data from WFS
  properties: TrailProperties
  metadata: {
    source: 'turrutebasen' | 'osm' | 'dnt' | 'local'
    sourceId?: string                 // Original ID from data source
    lastUpdated: string              // ISO date string
    dataQuality: number              // 0-1 confidence score
    verified: boolean                // Has been verified by maintainer
  }
  elevationProfile?: ElevationPoint[] // Cached elevation data
}

export interface TrailSegment {
  id: string
  trailId: string
  geometry: GeoJSON.LineString
  properties: {
    segmentNumber: number
    distance: number
    elevationGain: number
    difficulty: TrailDifficulty
    landmarks?: string[]
    waypoints?: Array<{
      name: string
      description?: string
      lat: number
      lng: number
      type: 'junction' | 'viewpoint' | 'shelter' | 'water' | 'parking' | 'trailhead'
    }>
  }
}

export interface BoundingBox {
  north: number
  south: number
  east: number
  west: number
}

export interface TrailSearchQuery {
  text?: string                      // Name or description search
  bounds?: BoundingBox              // Geographic bounds
  types?: TrailType[]               // Filter by trail types
  difficulties?: TrailDifficulty[]  // Filter by difficulty levels
  minDistance?: number              // Minimum distance in meters
  maxDistance?: number              // Maximum distance in meters
  minElevationGain?: number         // Minimum elevation gain
  maxElevationGain?: number         // Maximum elevation gain
  municipalities?: string[]         // Filter by municipality
  facilities?: string[]             // Must have these facilities
  season?: string                   // Best for this season
  limit?: number                    // Maximum results to return
}

export interface TrailSearchResult {
  trails: Trail[]
  totalCount: number
  bounds?: BoundingBox
  searchTime: number                // Query execution time in ms
}

export interface PlannedRoute {
  id: string
  name?: string
  trails: Trail[]                   // Ordered list of connected trails
  waypoints: Array<{
    lat: number
    lng: number
    name?: string
    type: 'start' | 'end' | 'junction' | 'poi'
  }>
  properties: {
    totalDistance: number
    totalElevationGain: number
    totalElevationLoss: number
    estimatedTime: number
    difficulty: TrailDifficulty     // Overall route difficulty
    surface: TrailSurface[]         // All surface types encountered
  }
  elevationProfile: ElevationPoint[]
  warnings: string[]                // Route-specific warnings
  created: string                   // ISO date string
}

export interface RoutePreferences {
  preferredTypes?: TrailType[]
  maxDifficulty?: TrailDifficulty
  avoidSurfaces?: TrailSurface[]
  requireFacilities?: string[]
  maxDistance?: number
  maxElevationGain?: number
  circularRoute?: boolean           // Return to start point
}

// WFS response interfaces for Turrutebasen data
export interface TurrutebasenFeature {
  type: 'Feature'
  id: string
  geometry: GeoJSON.LineString
  properties: {
    // Standard Turrutebasen WFS properties (mapped from Norwegian)
    turrutenavn?: string             // Trail name
    rutetype?: string                // Route type
    rutelengde?: number             // Route length
    kommune?: string                 // Municipality
    fylke?: string                   // County
    vedlikeholder?: string           // Maintainer
    merkesystem?: string             // Marking system
    vanskelighetgrad?: string        // Difficulty level
    underlaget?: string              // Surface type
    sesong?: string                  // Season
    tilrettelegging?: string         // Accessibility
    [key: string]: unknown              // Additional properties from WFS
  }
  bbox?: [number, number, number, number]
}

export interface TurrutebasenResponse {
  type: 'FeatureCollection'
  features: TurrutebasenFeature[]
  totalFeatures?: number
  numberMatched?: number
  numberReturned?: number
  timeStamp?: string
  crs?: {
    type: string
    properties: {
      name: string
    }
  }
}

// Map styling configuration for different trail types
export interface TrailStyle {
  color: string
  width: number
  opacity: number
  dashArray?: number[]
  glowColor?: string
}

export const TRAIL_STYLES: Record<TrailType, TrailStyle> = {
  hiking: {
    color: '#e74c3c',         // Red for hiking trails
    width: 3,
    opacity: 0.8,
    glowColor: '#e74c3c40'
  },
  skiing: {
    color: '#3498db',         // Blue for ski trails
    width: 3,
    opacity: 0.8,
    dashArray: [5, 5],
    glowColor: '#3498db40'
  },
  cycling: {
    color: '#27ae60',         // Green for cycle routes
    width: 3,
    opacity: 0.8,
    glowColor: '#27ae6040'
  },
  mixed: {
    color: '#9b59b6',         // Purple for mixed-use trails
    width: 3,
    opacity: 0.8,
    glowColor: '#9b59b640'
  },
  other: {
    color: '#95a5a6',         // Gray for other trails
    width: 2,
    opacity: 0.7,
    glowColor: '#95a5a640'
  }
}

export const DIFFICULTY_COLORS: Record<TrailDifficulty, string> = {
  easy: '#27ae60',      // Green
  medium: '#f39c12',    // Orange
  hard: '#e74c3c',      // Red
  expert: '#8e44ad'     // Purple
}

// Utility functions for trail data processing
export class TrailUtils {

  /**
   * Convert Turrutebasen WFS feature to Trail object
   */
  static convertFromTurrutebasen(feature: TurrutebasenFeature): Trail {
    const props = feature.properties

    return {
      id: feature.id,
      geometry: feature.geometry,
      properties: {
        name: props.turrutenavn || `Trail ${feature.id}`,
        description: props.beskrivelse,
        difficulty: this.mapDifficulty(props.vanskelighetgrad),
        type: this.mapTrailType(props.rutetype),
        distance: props.rutelengde || 0,
        surface: this.mapSurface(props.underlaget),
        municipality: props.kommune || '',
        county: props.fylke || '',
        maintainer: props.vedlikeholder,
        markings: props.merkesystem ? [props.merkesystem] : undefined,
        season: props.sesong ? props.sesong.split(',').map((s: string) => s.trim()) : undefined
      },
      metadata: {
        source: 'turrutebasen',
        sourceId: feature.id,
        lastUpdated: new Date().toISOString(),
        dataQuality: 0.8, // Default quality score for Turrutebasen data
        verified: true
      }
    }
  }

  /**
   * Map Norwegian difficulty terms to standard levels
   */
  private static mapDifficulty(difficulty?: string): TrailDifficulty {
    if (!difficulty) return 'medium'

    const normalized = difficulty.toLowerCase()
    if (normalized.includes('lett') || normalized.includes('enkel')) return 'easy'
    if (normalized.includes('middels') || normalized.includes('moderat')) return 'medium'
    if (normalized.includes('krevende') || normalized.includes('vanskelig')) return 'hard'
    if (normalized.includes('ekspert') || normalized.includes('meget')) return 'expert'

    return 'medium'
  }

  /**
   * Map Norwegian trail type terms to standard types
   */
  private static mapTrailType(type?: string): TrailType {
    if (!type) return 'other'

    const normalized = type.toLowerCase()
    if (normalized.includes('fot') || normalized.includes('gå') || normalized.includes('vandre')) return 'hiking'
    if (normalized.includes('ski') || normalized.includes('løype')) return 'skiing'
    if (normalized.includes('sykkel') || normalized.includes('sykling')) return 'cycling'
    if (normalized.includes('blandet') || normalized.includes('multi')) return 'mixed'

    return 'other'
  }

  /**
   * Map Norwegian surface terms to standard surface types
   */
  private static mapSurface(surface?: string): TrailSurface {
    if (!surface) return 'dirt'

    const normalized = surface.toLowerCase()
    if (normalized.includes('asfalt') || normalized.includes('betong')) return 'paved'
    if (normalized.includes('grus') || normalized.includes('singel')) return 'gravel'
    if (normalized.includes('stein') || normalized.includes('berg')) return 'stone'
    if (normalized.includes('tre') || normalized.includes('planke')) return 'boardwalk'
    if (normalized.includes('snø') || normalized.includes('is')) return 'snow'
    if (normalized.includes('blandet') || normalized.includes('varierende')) return 'mixed'

    return 'dirt'
  }

  /**
   * Calculate total distance for a trail
   */
  static calculateDistance(geometry: GeoJSON.LineString): number {
    if (!geometry.coordinates || geometry.coordinates.length < 2) return 0

    let totalDistance = 0
    for (let i = 1; i < geometry.coordinates.length; i++) {
      const [lng1, lat1] = geometry.coordinates[i - 1]
      const [lng2, lat2] = geometry.coordinates[i]
      totalDistance += this.haversineDistance(lat1, lng1, lat2, lng2)
    }

    return totalDistance
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private static haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Get trail bounds (bounding box)
   */
  static getTrailBounds(trail: Trail): BoundingBox {
    const coords = trail.geometry.coordinates
    if (!coords || coords.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 }
    }

    let north = -90, south = 90, east = -180, west = 180

    coords.forEach(([lng, lat]) => {
      north = Math.max(north, lat)
      south = Math.min(south, lat)
      east = Math.max(east, lng)
      west = Math.min(west, lng)
    })

    return { north, south, east, west }
  }

  /**
   * Check if trail intersects with bounding box
   */
  static intersectsBounds(trail: Trail, bounds: BoundingBox): boolean {
    const trailBounds = this.getTrailBounds(trail)

    return !(
      trailBounds.west > bounds.east ||
      trailBounds.east < bounds.west ||
      trailBounds.north < bounds.south ||
      trailBounds.south > bounds.north
    )
  }
}
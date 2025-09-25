/**
 * Distance measurement service for calculating distances between coordinates
 * Supports both Haversine (great circle) and planar distance calculations
 */

export interface Coordinate {
  lat: number
  lng: number
}

export interface DistanceMeasurement {
  id: string
  points: Coordinate[]
  totalDistance: number
  segments: number[]
  created: Date
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateHaversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371000 // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180
  const φ2 = (coord2.lat * Math.PI) / 180
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Calculate planar distance (for short distances where Earth curvature is negligible)
 * Returns distance in meters
 */
export function calculatePlanarDistance(coord1: Coordinate, coord2: Coordinate): number {
  // Convert degrees to meters (approximate for Norway)
  const latToMeters = 111320 // meters per degree latitude
  const lngToMeters = Math.cos((coord1.lat * Math.PI) / 180) * 111320 // meters per degree longitude at this latitude

  const deltaLat = (coord2.lat - coord1.lat) * latToMeters
  const deltaLng = (coord2.lng - coord1.lng) * lngToMeters

  return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng)
}

/**
 * Calculate total distance for multiple points (polyline)
 * Uses Haversine formula for accuracy
 */
export function calculatePolylineDistance(points: Coordinate[]): { totalDistance: number; segments: number[] } {
  if (points.length < 2) {
    return { totalDistance: 0, segments: [] }
  }

  const segments: number[] = []
  let totalDistance = 0

  for (let i = 0; i < points.length - 1; i++) {
    const segmentDistance = calculateHaversineDistance(points[i], points[i + 1])
    segments.push(segmentDistance)
    totalDistance += segmentDistance
  }

  return { totalDistance, segments }
}

/**
 * Format distance for display with appropriate units
 */
export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`
  } else if (distanceInMeters < 10000) {
    return `${(distanceInMeters / 1000).toFixed(2)} km`
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)} km`
  }
}

/**
 * Calculate bearing between two points
 * Returns bearing in degrees (0-360, where 0/360 is North)
 */
export function calculateBearing(coord1: Coordinate, coord2: Coordinate): number {
  const φ1 = (coord1.lat * Math.PI) / 180
  const φ2 = (coord2.lat * Math.PI) / 180
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  const bearing = Math.atan2(y, x)
  return ((bearing * 180) / Math.PI + 360) % 360
}

/**
 * Format bearing for display
 */
export function formatBearing(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(bearing / 22.5) % 16
  return `${Math.round(bearing)}° ${directions[index]}`
}

/**
 * Generate unique ID for distance measurements
 */
export function generateMeasurementId(): string {
  return `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
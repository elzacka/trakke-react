export interface POI {
  id: string
  name: string
  lat: number
  lng: number
  description: string
  type: POIType
  metadata?: Record<string, any>
}

export type POIType = 
  | 'hiking' 
  | 'swimming' 
  | 'camping' 
  | 'waterfalls' 
  | 'viewpoints' 
  | 'history'

export interface CategoryConfig {
  color: string
  icon: string
  name: string
}

export type CategoryConfigMap = Record<POIType, CategoryConfig>

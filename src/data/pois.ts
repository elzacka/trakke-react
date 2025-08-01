// Define types directly in this file to avoid circular dependencies
export interface POI {
  id: string
  name: string
  lat: number
  lng: number
  description: string
  type: POIType
  metadata?: Record<string, string | number>
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

export const categoryConfig: CategoryConfigMap = {
  hiking: { color: '#8B4513', icon: 'hiking', name: 'Vandre' },
  swimming: { color: '#4169E1', icon: 'pool', name: 'Bade' },
  camping: { color: '#228B22', icon: 'camping', name: 'Sove' },
  waterfalls: { color: '#20B2AA', icon: 'water_drop', name: 'Foss' },
  viewpoints: { color: '#FF6347', icon: 'landscape', name: 'Utsikt' },
  history: { color: '#8B4B8B', icon: 'museum', name: 'Historisk' },
}

export const poisData: POI[] = [
  {
    id: 'reinevasstind',
    name: 'Reinevasstind (1404 moh)',
    lat: 59.4892,
    lng: 7.1845,
    description: 'Spektakulær tur til høyeste punkt i Valle. Ca. 6 timer tur/retur.',
    type: 'hiking',
    metadata: { 
      difficulty: 'Krevende',
      duration: '6 timer',
      elevation: '1404 moh'
    }
  },
  {
    id: 'byglandsfjord-badeplass',
    name: 'Byglandsfjord badeplass',
    lat: 59.1234,
    lng: 7.8123,
    description: 'Fin badeplass ved fjorden med gressareal og brygger.',
    type: 'swimming',
    metadata: {
      facilities: 'Toalett, parkering',
      season: 'Juni-august'
    }
  },
  {
    id: 'hovden-camping',
    name: 'Hovden camping',
    lat: 59.5456,
    lng: 7.3456,
    description: 'Familievennlig camping ved foten av Hovdenfjell.',
    type: 'camping',
    metadata: {
      services: 'Hytte, teltplass, strøm',
      booking: 'Påkrevd i høysesong'
    }
  },
  {
    id: 'rjukandefossen',
    name: 'Rjukandefossen',
    lat: 59.3789,
    lng: 7.2789,
    description: '182 meter høy foss - en av Norges høyeste.',
    type: 'waterfalls',
    metadata: {
      height: '182 meter',
      season: 'Best fra mai til oktober',
      accessibility: 'Lett tilgjengelig'
    }
  },
  {
    id: 'hovdenfjell-utsikt',
    name: 'Hovdenfjell utsikt',
    lat: 59.5123,
    lng: 7.3234,
    description: 'Fantastisk utsikt over Setesdal og mot kysten.',
    type: 'viewpoints',
    metadata: {
      elevation: '1200 moh',
      direction: '360° utsikt',
      bestTime: 'Solnedgang'
    }
  },
  {
    id: 'rygnestad-stavkirke',
    name: 'Rygnestad stavkirke',
    lat: 59.1567,
    lng: 7.7890,
    description: 'Middelalderkirke fra 1100-tallet, en av få bevarte stavkirker.',
    type: 'history',
    metadata: {
      period: 'Middelalder (1100-tallet)',
      status: 'Fredet bygning',
      openingHours: 'Sommersesong'
    }
  }
]
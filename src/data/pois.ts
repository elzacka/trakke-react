// src/data/pois.ts - Fikset ESLint warning

export type POIType = 
  | 'hiking' 
  | 'swimming' 
  | 'camping_site'        // Etablerte campingplasser
  | 'tent_spot'           // Flate områder egnet for telt
  | 'hammock_spot'        // Skogsområder med egnede trær
  | 'under_stars'         // Åpne områder for å sove under stjernehimmelen
  | 'wilderness_shelter'  // Gapahuk/vindskjul/DNT-hytter
  | 'waterfalls' 
  | 'viewpoints' 
  | 'history'

export interface CampingMetadata {
  terrain: 'flat' | 'sloped' | 'rocky' | 'soft'
  trees: boolean           // For hengekøye
  tree_types?: string[]    // 'birch', 'pine', 'spruce'
  water_nearby: boolean    // Ferskvann innen 500m
  wind_protection: 'good' | 'moderate' | 'poor'
  legal_status: 'allowed' | 'restricted' | 'private' | 'unknown'
  facilities?: string[]    // 'fireplace', 'toilet', 'shelter', 'water'
  season_best: string[]    // ['summer', 'winter', 'all_year']
  difficulty_access: 'easy' | 'moderate' | 'difficult'
  confidence?: number      // AI confidence in data quality (0-1)
}

// Union type for metadata - kan være enten simple nøkkel-verdi par eller CampingMetadata
export type POIMetadata = Record<string, string | number> | CampingMetadata

export interface POI {
  id: string
  name: string
  lat: number
  lng: number
  description: string
  type: POIType
  metadata?: POIMetadata
  api_source?: 'ut_no' | 'osm' | 'kartverket' | 'manual'
  last_updated?: string
}

export interface CategoryConfig {
  color: string
  icon: string
  name: string
  description?: string
}

export type CategoryConfigMap = Record<POIType, CategoryConfig>

export const categoryConfig: CategoryConfigMap = {
  hiking: { 
    color: '#8B4513', 
    icon: 'hiking', 
    name: 'Vandre',
    description: 'Vandreruter'
  },
  swimming: { 
    color: '#4169E1', 
    icon: 'pool', 
    name: 'Bade',
    description: 'Badeplass'
  },
   wilderness_shelter: { 
    color: '#8B4513', 
    icon: 'cabin', 
    name: 'Hytte og mer',
    description: 'Primitive hytter, gapahuk og vindskjul'
  },
  tent_spot: { 
    color: '#32CD32', 
    icon: 'camping', 
    name: 'Teltplass',
    description: 'Flate områder egnet for telt'
  },
  hammock_spot: { 
    color: '#006400', 
    icon: 'forest', 
    name: 'Hengekøyeplass',
    description: 'Skogsområder med egnede trær for hengekøye'
  },
  waterfalls: { 
    color: '#20B2AA', 
    icon: 'cadence', 
    name: 'Foss',
    description: 'Fosser og vannfall'
  },
  viewpoints: { 
    color: '#FF6347', 
    icon: 'landscape', 
    name: 'Utsiktspunkter',
    description: 'Fine utsiktspunkter'
  },
  history: { 
    color: '#8B4B8B', 
    icon: 'numbers', 
    name: 'Historiske steder',
    description: 'Historiske steder og kulturminner'
  },
}

// Type guard function for camping metadata - Fikset ESLint warning
export function isCampingMetadata(metadata: unknown): metadata is CampingMetadata {
  return typeof metadata === 'object' && 
         metadata !== null &&
         'terrain' in metadata && 
         typeof (metadata as CampingMetadata).terrain === 'string' && 
         'trees' in metadata &&
         typeof (metadata as CampingMetadata).trees === 'boolean'
}

// Eksisterende manuelle POI-er (beholdes som fallback)
export const manualPoisData: POI[] = [
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
    },
    api_source: 'manual'
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
    },
    api_source: 'manual'
  },
  {
    id: 'hovden-camping',
    name: 'Hovden camping',
    lat: 59.5456,
    lng: 7.3456,
    description: 'Familievennlig camping ved foten av Hovdenfjell.',
    type: 'camping_site',
    metadata: {
      services: 'Hytte, teltplass, strøm',
      booking: 'Påkrevd i høysesong'
    },
    api_source: 'manual'
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
    },
    api_source: 'manual'
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
    },
    api_source: 'manual'
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
    },
    api_source: 'manual'
  }
]

// Kombinert POI data - vil bli populert av API service
export let poisData: POI[] = manualPoisData

// Funksjon for å oppdatere POI data med API-data
export function updatePoisData(newPois: POI[]) {
  poisData = [...manualPoisData, ...newPois]
}
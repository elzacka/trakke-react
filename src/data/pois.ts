// src/data/pois.ts - Fikset ESLint warning og manglende kategorier

export type POIType = 
  // Friluftsliv - følger DNT og UT.no standarder
  | 'hiking'              // Dagstur/vandring
  | 'mountain_peaks'      // Toppturer
  | 'ski_trails'          // Skiløyper
  | 'swimming'            // Badeplass
  | 'beach'               // Strand
  | 'lakes_rivers'        // Elv/innsjø
  | 'ice_fishing'         // Isfiske
  // Overnatting - følger DNT kategorier
  | 'staffed_huts'        // Serverte hytter
  | 'self_service_huts'   // Selvbetjente hytter
  | 'wilderness_shelter'  // Gapahuk/vindskjul
  | 'camping_site'        // Camping
  | 'tent_area'           // Teltområde
  | 'wild_camping'        // Fri camping
  // Naturopplevelser - følger Visit Norway standarder
  | 'nature_gems'         // Naturperler (fosser, grotter etc.)
  | 'viewpoints'          // Utsiktspunkt
  | 'cultural_landscapes' // Kulturlandskap
  // Kulturarv - følger Riksantikvaren kategorier
  | 'archaeological'      // Fornminner
  | 'protected_buildings' // Vernede bygninger
  | 'industrial_heritage' // Tekniske kulturminner
  | 'churches'            // Kirker og religiøse steder
  | 'war_memorials'       // Krigsminnesmerker
  | 'peace_monuments'     // Fredsmonumenter
  | 'underwater_heritage' // Undervannskulturarv
  | 'intangible_heritage' // Immaterielle kulturverdier
  // Service og tilgjengelighet
  | 'mountain_service'    // Serveringssteder i fjellet
  | 'accessible_sites'    // Tilrettelagt for funksjonshemmede

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
  api_source?: 'ut_no' | 'osm' | 'kartverket' | 'manual' | 'riksantikvaren'
  last_updated?: string
  weather?: {
    temperature: number
    symbolCode: string
    description: string
    precipitation: number
    windSpeed: number
    lastUpdated: string
  }
}

export interface CategoryConfig {
  color: string
  icon: string
  name: string
  description?: string
}

export type CategoryConfigMap = Record<POIType, CategoryConfig>

// Hierarchical category structure
export interface CategoryNode {
  id: string
  name: string
  icon?: string
  color?: string
  poiTypes?: POIType[]  // POI types that belong to this category
  children?: CategoryNode[]
  parent?: string
}

export interface CategoryState {
  expanded: Record<string, boolean>  // Which parent categories are expanded
  checked: Record<string, boolean>   // Which categories are checked
}

// Kategori-konfigurasjon følger norske standarder (DNT, Kartverket, Riksantikvaren)
export const categoryConfig: CategoryConfigMap = {
  // Friluftsliv kategorier
  hiking: { 
    color: '#8B4513', 
    icon: 'hiking', 
    name: 'Dagstur',
    description: 'Dagsturer og vandreruter'
  },
  mountain_peaks: {
    color: '#4B0082',
    icon: 'terrain',
    name: 'Toppturer',
    description: 'Fjelltopper og høyderygger'
  },
  ski_trails: {
    color: '#00CED1',
    icon: 'downhill_skiing',
    name: 'Skiløyper',
    description: 'Langrennsløyper og skiturer'
  },
  swimming: { 
    color: '#4169E1', 
    icon: 'pool', 
    name: 'Badeplass',
    description: 'Tilrettelagte badeplasser'
  },
  beach: {
    color: '#FFD700',
    icon: 'beach_access',
    name: 'Strand',
    description: 'Naturlige strender'
  },
  lakes_rivers: {
    color: '#1E90FF',
    icon: 'water',
    name: 'Elver og innsjøer',
    description: 'Ferskvann for bading og aktiviteter'
  },
  ice_fishing: {
    color: '#B0E0E6',
    icon: 'set_meal',
    name: 'Isfiske',
    description: 'Isfiskeplasser'
  },
  // Overnatting kategorier
  staffed_huts: {
    color: '#CD853F',
    icon: 'house',
    name: 'Betjente hytter',
    description: 'DNT-hytter med betjening og servering'
  },
  self_service_huts: {
    color: '#8B4513',
    icon: 'cabin',
    name: 'Selvbetjente hytter',
    description: 'Ubetjente DNT-hytter'
  },
  wilderness_shelter: { 
    color: '#A0522D', 
    icon: 'cottage', 
    name: 'Gapahuk/vindskjul',
    description: 'Åpne skjul og primitive hytter'
  },
  camping_site: { 
    color: '#228B22', 
    icon: 'camping', 
    name: 'Camping',
    description: 'Etablerte campingplasser'
  },
  tent_area: { 
    color: '#32CD32', 
    icon: 'holiday_village', 
    name: 'Teltområde',
    description: 'Tilrettelagte teltplasser'
  },
  wild_camping: { 
    color: '#006400', 
    icon: 'forest', 
    name: 'Fri camping',
    description: 'Områder for fri camping (allemansretten)'
  },
  // Naturopplevelser
  nature_gems: { 
    color: '#20B2AA', 
    icon: 'water_drop',
    name: 'Naturperler',
    description: 'Fosser, grotter og unike naturformasjoner'
  },
  viewpoints: { 
    color: '#FF6347', 
    icon: 'landscape', 
    name: 'Utsiktspunkt',
    description: 'Kjente utsiktspunkter'
  },
  cultural_landscapes: {
    color: '#9ACD32',
    icon: 'agriculture',
    name: 'Kulturlandskap',
    description: 'Vernede kulturlandskap'
  },
  // Kulturarv kategorier
  archaeological: {
    color: '#8B4513',
    icon: 'archaeology',
    name: 'Fornminner',
    description: 'Gravhauger, steinalderboplasser, ruiner'
  },
  protected_buildings: {
    color: '#CD853F',
    icon: 'domain',
    name: 'Vernede bygninger',
    description: 'Fredede og vernede bygninger'
  },
  industrial_heritage: {
    color: '#708090',
    icon: 'factory',
    name: 'Tekniske kulturminner',
    description: 'Industrianlegg og tekniske installasjoner'
  },
  churches: {
    color: '#9370DB',
    icon: 'church',
    name: 'Kirker og religiøse steder',
    description: 'Stavkirker, steinkirker og hellige steder'
  },
  war_memorials: { 
    color: '#8B4B8B', 
    icon: 'military_tech',
    name: 'Krigsminnesmerker',
    description: 'Monumenter fra 2. verdenskrig og andre konflikter'
  },
  peace_monuments: {
    color: '#DDA0DD',
    icon: 'celebration',
    name: 'Fredsmonumenter',
    description: 'Fredsmonumenter og forsoningsmarkeringer'
  },
  underwater_heritage: {
    color: '#4682B4',
    icon: 'scuba_diving',
    name: 'Undervannskulturarv',
    description: 'Skipsvrak og undervannsarkeologi'
  },
  intangible_heritage: {
    color: '#DEB887',
    icon: 'auto_stories',
    name: 'Immaterielle kulturverdier',
    description: 'Sagn, tradisjoner og kulturelle praksiser'
  },
  // Service og tilgjengelighet
  mountain_service: {
    color: '#FF8C00',
    icon: 'restaurant',
    name: 'Serveringssteder',
    description: 'Kafeer og restauranter i naturen'
  },
  accessible_sites: {
    color: '#4169E1',
    icon: 'accessible',
    name: 'Universell utforming',
    description: 'Tilrettelagt for funksjonshemmede'
  }
}

// Hierarkisk kategoristruktur følger norske standarder
export const categoryTree: CategoryNode[] = [
  {
    id: 'outdoor_activities',
    name: 'Turløyper',
    icon: 'hiking',
    color: '#228B22',
    children: [
      {
        id: 'hiking',
        name: 'Dagsturer',
        parent: 'outdoor_activities',
        poiTypes: ['hiking']
      },
      {
        id: 'mountain_peaks',
        name: 'Toppturer',
        parent: 'outdoor_activities',
        poiTypes: ['mountain_peaks']
      },
      {
        id: 'ski_trails',
        name: 'Skiløyper',
        parent: 'outdoor_activities',
        poiTypes: ['ski_trails']
      }
    ]
  },
  {
    id: 'water_activities',
    name: 'Bade',
    icon: 'pool',
    color: '#4169E1',
    children: [
      {
        id: 'swimming',
        name: 'Badeplasser',
        parent: 'water_activities',
        poiTypes: ['swimming']
      },
      {
        id: 'beach',
        name: 'Badeplasser med strand',
        parent: 'water_activities',
        poiTypes: ['beach']
      }
    ]
  },
  {
    id: 'accommodation',
    name: 'Sove',
    icon: 'snooze',
    color: '#8B4513',
    children: [
      {
        id: 'staffed_huts',
        name: 'Betjente hytter',
        parent: 'accommodation',
        poiTypes: ['staffed_huts']
      },
      {
        id: 'self_service_huts',
        name: 'Selvbetjente hytter',
        parent: 'accommodation',
        poiTypes: ['self_service_huts']
      },
      {
        id: 'wilderness_shelter',
        name: 'Gapahuk/vindskjul',
        parent: 'accommodation',
        poiTypes: ['wilderness_shelter']
      },
      {
        id: 'camping_site',
        name: 'Campingplasser',
        parent: 'accommodation',
        poiTypes: ['camping_site']
      },
      {
        id: 'tent_area',
        name: 'Teltplasser',
        parent: 'accommodation',
        poiTypes: ['tent_area']
      },
      {
        id: 'wild_camping',
        name: 'Hengekøyeplasser',
        parent: 'accommodation',
        poiTypes: ['wild_camping']
      }
    ]
  },
  {
    id: 'nature_experiences',
    name: 'Naturperler',
    icon: 'nature',
    color: '#20B2AA',
    children: [
      {
        id: 'nature_gems',
        name: 'Fosser',
        parent: 'nature_experiences',
        poiTypes: ['nature_gems']
      },
      {
        id: 'viewpoints',
        name: 'Utsiktspunkter',
        parent: 'nature_experiences',
        poiTypes: ['viewpoints']
      }
    ]
  },
  {
    id: 'cultural_heritage',
    name: 'Historiske steder',
    icon: 'museum',
    color: '#8B4B8B',
    children: [
      {
        id: 'churches',
        name: 'Kirker og religiøse steder',
        parent: 'cultural_heritage',
        poiTypes: ['churches']
      },
      {
        id: 'war_memorials',
        name: 'Krigsminner',
        parent: 'cultural_heritage',
        poiTypes: ['war_memorials']
      },
      {
        id: 'archaeological',
        name: 'Kulturminner',
        parent: 'cultural_heritage',
        poiTypes: ['archaeological']
      }
    ]
  }
]

// Type guard function for camping metadata - Fikset ESLint warning
export function isCampingMetadata(metadata: unknown): metadata is CampingMetadata {
  return typeof metadata === 'object' && 
         metadata !== null &&
         'terrain' in metadata && 
         typeof (metadata as CampingMetadata).terrain === 'string' && 
         'trees' in metadata &&
         typeof (metadata as CampingMetadata).trees === 'boolean'
}

// Sample POIs for demonstration - covering different categories across Norway
export const manualPoisData: POI[] = [
  // Hiking trails
  {
    id: 'sample_preikestolen',
    name: 'Preikestolen',
    lat: 58.9866,
    lng: 6.1926,
    description: 'Berømt fjellformasjon og utsiktspunkt i Lysefjorden',
    type: 'hiking',
    api_source: 'manual'
  },
  {
    id: 'sample_besseggen',
    name: 'Besseggen',
    lat: 61.4972,
    lng: 8.6769,
    description: 'Populær fjelltur i Jotunheimen',
    type: 'hiking',
    api_source: 'manual'
  },
  // Swimming spots
  {
    id: 'sample_tjuvholmen',
    name: 'Tjuvholmen Sjøbad',
    lat: 59.9075,
    lng: 10.7147,
    description: 'Populært badested i Oslo',
    type: 'swimming',
    api_source: 'manual'
  },
  // Beaches
  {
    id: 'sample_bystranda',
    name: 'Bystranda Kristiansand',
    lat: 58.1450,
    lng: 7.9960,
    description: 'Central strand i Kristiansand',
    type: 'beach',
    api_source: 'manual'
  },
  // Viewpoints
  {
    id: 'sample_nordkapp',
    name: 'Nordkapp',
    lat: 71.1725,
    lng: 25.7844,
    description: 'Europas nordligste punkt',
    type: 'viewpoints',
    api_source: 'manual'
  },
  {
    id: 'sample_geirangerfjord',
    name: 'Geirangerfjord utsikt',
    lat: 62.1049,
    lng: 7.2056,
    description: 'Verdensarvfjord med spektakulær utsikt',
    type: 'viewpoints',
    api_source: 'manual'
  },
  // Nature gems (waterfalls)
  {
    id: 'sample_voeringsfossen',
    name: 'Vøringsfossen',
    lat: 60.4186,
    lng: 7.2881,
    description: 'Norges mest kjente foss',
    type: 'nature_gems',
    api_source: 'manual'
  },
  // Churches
  {
    id: 'sample_nidarosdomen',
    name: 'Nidarosdomen',
    lat: 63.4280,
    lng: 10.3958,
    description: 'Norges nasjonalhelligdom',
    type: 'churches',
    api_source: 'manual'
  },
  {
    id: 'sample_borgund_stavkirke',
    name: 'Borgund stavkirke',
    lat: 61.0459,
    lng: 7.8944,
    description: 'Middelaldersk stavkirke fra 1180',
    type: 'churches',
    api_source: 'manual'
  },
  // War memorials
  {
    id: 'sample_akershus_fortress',
    name: 'Akershus festning',
    lat: 59.9077,
    lng: 10.7362,
    description: 'Historisk festning og krigsminnested',
    type: 'war_memorials',
    api_source: 'manual'
  },
  // Archaeological sites
  {
    id: 'sample_lofotr_vikingmuseum',
    name: 'Lofotr Vikingmuseum',
    lat: 68.1397,
    lng: 13.7849,
    description: 'Rekonstruert vikinghøvding-hall',
    type: 'archaeological',
    api_source: 'manual'
  }
]

// Combined POI data - will be populated by API services only
export let poisData: POI[] = []

// Function to update POI data with API data (no manual fallback)
export function updatePoisData(newPois: POI[]) {
  poisData = [...newPois]
}

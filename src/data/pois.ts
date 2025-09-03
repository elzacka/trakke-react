// src/data/pois.ts - Fikset ESLint warning og manglende kategorier
// GeoJSON will be loaded dynamically

// TypeScript interfaces for GeoJSON structures
interface GeoJSONFeature {
  type: 'Feature'
  properties: Record<string, string | number | undefined>
  geometry: {
    type: 'Point' | 'Polygon' | 'MultiPolygon'
    coordinates: number[] | number[][] | number[][][]
  }
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

interface KrigsminnerProps {
  [key: string]: string | number | undefined
  name?: string
  'name:no'?: string
  'name:nb'?: string
  description?: string
  'description:no'?: string
  'description:nb'?: string
  military?: string
  bunker_type?: string
  historic?: string
  memorial?: string
  location?: string
  man_made?: string
  layer?: string
  inscription?: string
  year?: string
  start_date?: string
  '@id'?: string
}

interface UtsiktspunkterProps {
  [key: string]: string | number | undefined
  name?: string
  'name:no'?: string
  'name:nb'?: string
  description?: string
  'description:no'?: string
  'description:nb'?: string
  tourism?: string
  natural?: string
  amenity?: string
  building?: string
  ele?: string
  alt_name?: string
  opening_hours?: string
  operator?: string
  website?: string
  phone?: string
  wheelchair?: string
  '@id'?: string
}

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
  // Bergen-inspirerte kategorier
  | 'fishing_spots'       // Fiskevann og fisketillatelse områder
  | 'canoeing'            // Kanopadling
  | 'parking'             // Parkering
  | 'rest_areas'          // Rasteplasser
  | 'cable_cars'          // Gondolbaner og taubaner
  | 'public_transport'    // Kollektivtransport holdeplasser
  | 'train_stations'      // Togstasjoner
  | 'information_boards'  // Informasjonstavler
  | 'toilets'             // Toaletter
  | 'drinking_water'      // Drikkevann områder
  | 'fire_places'         // Bål- og grillplasser
  | 'hammock_spots'       // Dedikerte hengekøyeplasser

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
    name: 'Kirker',
    description: 'Stavkirker, steinkirker og hellige steder'
  },
  war_memorials: { 
    color: '#8B4B8B', 
    icon: 'military_tech',
    name: 'Krigsminner',
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
  },
  // Bergen-inspirerte kategorier
  fishing_spots: {
    color: '#008B8B',
    icon: 'phishing',
    name: 'Fiskeplasser',
    description: 'Fiskevann og områder med fisketillatelse'
  },
  canoeing: {
    color: '#40E0D0',
    icon: 'kayaking',
    name: 'Kanopadling',
    description: 'Kajakk og kano ruter og utleie'
  },
  parking: {
    color: '#808080',
    icon: 'local_parking',
    name: 'Parkering',
    description: 'Parkeringsplasser for friluftsområder'
  },
  rest_areas: {
    color: '#DDA0DD',
    icon: 'deck',
    name: 'Rasteplasser',
    description: 'Rasteplasser med benker og bord'
  },
  cable_cars: {
    color: '#FF6347',
    icon: 'cable_car',
    name: 'Taubaner',
    description: 'Gondolbaner og skiheiser'
  },
  public_transport: {
    color: '#4682B4',
    icon: 'directions_bus',
    name: 'Kollektivtransport',
    description: 'Buss og trikk holdeplasser'
  },
  train_stations: {
    color: '#2F4F4F',
    icon: 'train',
    name: 'Togstasjoner',
    description: 'Jernbane stasjoner og plattformer'
  },
  information_boards: {
    color: '#32CD32',
    icon: 'info',
    name: 'Informasjonstavler',
    description: 'Skilt og informasjonstavler'
  },
  toilets: {
    color: '#8FBC8F',
    icon: 'wc',
    name: 'Toaletter',
    description: 'Offentlige toaletter'
  },
  drinking_water: {
    color: '#87CEEB',
    icon: 'water_drop',
    name: 'Drikkevann',
    description: 'Vannkilder og drikkevannspost'
  },
  fire_places: {
    color: '#DC143C',
    icon: 'local_fire_department',
    name: 'Bålplasser',
    description: 'Bål- og grillplasser'
  },
  hammock_spots: {
    color: '#90EE90',
    icon: 'weekend',
    name: 'Hengekøyeplasser',
    description: 'Egnede plasser for hengekøye'
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
        name: 'Turstier',
        parent: 'outdoor_activities',
        poiTypes: ['hiking']
      },
      {
        id: 'mountain_peaks',
        name: 'Fjelltopper',
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
        name: 'Betjente DNT-hytter',
        parent: 'accommodation',
        poiTypes: ['staffed_huts']
      },
      {
        id: 'self_service_huts',
        name: 'Ubetjente hytter',
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
        name: 'Fri camping',
        parent: 'accommodation',
        poiTypes: ['wild_camping']
      },
      {
        id: 'hammock_spots',
        name: 'Hengekøyeplasser',
        parent: 'accommodation',
        poiTypes: ['hammock_spots']
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
        name: 'Kirker',
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
        name: 'Fornminner',
        parent: 'cultural_heritage',
        poiTypes: ['archaeological']
      }
    ]
  },
  {
    id: 'services_infrastructure',
    name: 'Service',
    icon: 'local_gas_station',
    color: '#FF8C00',
    children: [
      {
        id: 'parking',
        name: 'Parkering',
        parent: 'services_infrastructure',
        poiTypes: ['parking']
      },
      {
        id: 'rest_areas',
        name: 'Rasteplasser',
        parent: 'services_infrastructure',
        poiTypes: ['rest_areas']
      },
      {
        id: 'toilets',
        name: 'Toaletter',
        parent: 'services_infrastructure',
        poiTypes: ['toilets']
      },
      {
        id: 'drinking_water',
        name: 'Drikkevann',
        parent: 'services_infrastructure',
        poiTypes: ['drinking_water']
      },
      {
        id: 'fire_places',
        name: 'Bålplasser',
        parent: 'services_infrastructure',
        poiTypes: ['fire_places']
      },
      {
        id: 'information_boards',
        name: 'Informasjon',
        parent: 'services_infrastructure',
        poiTypes: ['information_boards']
      }
    ]
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: 'directions_transit',
    color: '#4682B4',
    children: [
      {
        id: 'cable_cars',
        name: 'Taubaner',
        parent: 'transport',
        poiTypes: ['cable_cars']
      },
      {
        id: 'public_transport',
        name: 'Kollektivtransport',
        parent: 'transport',
        poiTypes: ['public_transport']
      },
      {
        id: 'train_stations',
        name: 'Togstasjoner',
        parent: 'transport',
        poiTypes: ['train_stations']
      }
    ]
  },
  {
    id: 'water_activities_extended',
    name: 'Vann og fiske',
    icon: 'sailing',
    color: '#008B8B',
    children: [
      {
        id: 'fishing_spots',
        name: 'Fiskeplasser',
        parent: 'water_activities_extended',
        poiTypes: ['fishing_spots']
      },
      {
        id: 'canoeing',
        name: 'Kanopadling',
        parent: 'water_activities_extended',
        poiTypes: ['canoeing']
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

// Manual POIs removed - using API-only data source
// Empty export for backward compatibility
export const manualPoisData: POI[] = []

// Original manual POIs kept here for reference but not used
const removedManualPoisData: POI[] = [
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

// GeoJSON conversion function for Krigsminner data
function convertKrigsminnerGeoJSONToPOIs(geojson: GeoJSONFeatureCollection): POI[] {
  if (!geojson || !geojson.features) {
    console.warn('⚠️ Invalid GeoJSON data for Krigsminner')
    return []
  }

  const pois: POI[] = []
  
  geojson.features.forEach((feature: GeoJSONFeature, index: number) => {
    try {
      // Extract coordinates - handle both Point and Polygon geometries
      let lat: number, lng: number
      
      if (feature.geometry?.type === 'Point') {
        const coords = feature.geometry.coordinates as number[]
        lng = coords[0]
        lat = coords[1]
      } else if (feature.geometry?.type === 'Polygon') {
        // Use first coordinate of first ring for polygon centroid approximation
        const coords = feature.geometry.coordinates as number[][]
        lng = coords[0][0]
        lat = coords[0][1]
      } else if (feature.geometry?.type === 'MultiPolygon') {
        // Use first coordinate of first polygon
        const coords = feature.geometry.coordinates as number[][][]
        lng = coords[0][0][0]
        lat = coords[0][0][1]
      } else if (feature.geometry?.type === 'LineString') {
        // For LineString, use the midpoint of the line
        const coords = feature.geometry.coordinates as number[][]
        const midIndex = Math.floor(coords.length / 2)
        lng = coords[midIndex][0]
        lat = coords[midIndex][1]
      } else {
        // Skip unsupported geometry types silently
        return
      }

      // Validate coordinates - skip invalid features without logging every single one
      if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
        return
      }

      const props = (feature.properties || {}) as KrigsminnerProps
      
      // Generate Norwegian name and description
      const name = props.name || 
                   props['name:no'] || 
                   props['name:nb'] || 
                   generateKrigsminnerName(props)
      
      const description = props.description || 
                         props['description:no'] || 
                         props['description:nb'] || 
                         generateKrigsminnerDescription(props)

      const poi: POI = {
        id: `krigsminner_${props['@id']?.replace(/[^\w]/g, '_') || index}`,
        name,
        lat,
        lng,
        description,
        type: 'war_memorials',
        metadata: {
          bunker_type: props.bunker_type || 'unknown',
          military: props.military || 'bunker',
          location: props.location || 'surface',
          man_made: props.man_made || '',
          layer: props.layer || '',
          historic: props.historic || '',
          memorial: props.memorial || '',
          ...(props.inscription && { inscription: String(props.inscription) }),
          ...(props.year && { year: String(props.year) }),
          ...(props.start_date && { start_date: String(props.start_date) })
        },
        api_source: 'manual',
        last_updated: new Date().toISOString()
      }

      pois.push(poi)
    } catch (error) {
      console.error(`❌ Failed to convert Krigsminner feature ${index}:`, error)
    }
  })

  console.log(`✅ Converted ${pois.length} Krigsminner POIs from GeoJSON`)
  return pois
}

// Helper function to generate Norwegian names for Krigsminner
function generateKrigsminnerName(props: KrigsminnerProps): string {
  if (props.military === 'bunker') {
    if (props.bunker_type === 'gun_emplacement') return 'Kanoninnretning'
    if (props.bunker_type === 'shelter') return 'Skjulsrom'
    if (props.bunker_type === 'ammunition') return 'Ammunisjonsbunker'
    if (props.bunker_type === 'command') return 'Kommandoplass'
    return 'Bunker'
  }
  if (props.historic === 'memorial') return 'Krigsminne'
  if (props.historic === 'monument') return 'Monument'
  if (props.historic === 'battlefield') return 'Slagmark'
  if (props.man_made === 'tunnel') return 'Tunnel'
  return 'Krigsminne'
}

// Helper function to generate Norwegian descriptions for Krigsminner  
function generateKrigsminnerDescription(props: KrigsminnerProps): string {
  const parts: string[] = []
  
  if (props.military === 'bunker') {
    parts.push('Militært forsvarsverk fra andre verdenskrig')
  }
  
  if (props.bunker_type) {
    const bunkerTypes: Record<string, string> = {
      'gun_emplacement': 'kanonplassering',
      'shelter': 'skjulsrom for sivile eller militære',
      'ammunition': 'ammunisjonslager', 
      'command': 'kommandosentral',
      'observation': 'observasjonspost'
    }
    parts.push(`Type: ${bunkerTypes[props.bunker_type] || props.bunker_type}`)
  }
  
  if (props.location === 'underground') {
    parts.push('Underjordisk anlegg')
  }
  
  if (props.layer && props.layer.includes('-')) {
    parts.push('Ligger under bakkenivå')
  }

  if (parts.length === 0) {
    parts.push('Historisk krigsminnested i Norge')
  }

  return parts.join('. ') + '.'
}

// GeoJSON conversion function for Utsiktspunkter data
function convertUtsiktspunkterGeoJSONToPOIs(geojson: GeoJSONFeatureCollection): POI[] {
  if (!geojson || !geojson.features) {
    console.warn('⚠️ Invalid GeoJSON data for Utsiktspunkter')
    return []
  }

  const pois: POI[] = []
  
  geojson.features.forEach((feature: GeoJSONFeature, index: number) => {
    try {
      // Extract coordinates - handle both Point and Polygon geometries
      let lat: number, lng: number
      
      if (feature.geometry?.type === 'Point') {
        const coords = feature.geometry.coordinates as number[]
        lng = coords[0]
        lat = coords[1]
      } else if (feature.geometry?.type === 'Polygon') {
        // Use first coordinate of first ring for polygon centroid approximation
        const coords = feature.geometry.coordinates as number[][]
        lng = coords[0][0]
        lat = coords[0][1]
      } else if (feature.geometry?.type === 'MultiPolygon') {
        // Use first coordinate of first polygon
        const coords = feature.geometry.coordinates as number[][][]
        lng = coords[0][0][0]
        lat = coords[0][0][1]
      } else if (feature.geometry?.type === 'LineString') {
        // For LineString, use the midpoint of the line
        const coords = feature.geometry.coordinates as number[][]
        const midIndex = Math.floor(coords.length / 2)
        lng = coords[midIndex][0]
        lat = coords[midIndex][1]
      } else {
        // Skip unsupported geometry types silently
        return
      }

      // Validate coordinates - skip invalid features without logging every single one
      if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
        return
      }

      const props = (feature.properties || {}) as UtsiktspunkterProps
      
      // Generate Norwegian name and description
      const name = props.name || 
                   props['name:no'] || 
                   props['name:nb'] || 
                   props.alt_name ||
                   generateUtsiktspunkterName(props)
      
      const description = props.description || 
                         props['description:no'] || 
                         props['description:nb'] || 
                         generateUtsiktspunkterDescription(props)

      const poi: POI = {
        id: `utsiktspunkter_${props['@id']?.replace(/[^\w]/g, '_') || index}`,
        name,
        lat,
        lng,
        description,
        type: 'viewpoints',
        metadata: {
          tourism: props.tourism || 'viewpoint',
          natural: props.natural || '',
          amenity: props.amenity || '',
          building: props.building || '',
          ele: props.ele || '',
          opening_hours: props.opening_hours || '',
          operator: props.operator || '',
          wheelchair: props.wheelchair || '',
          ...(props.website && { website: String(props.website) }),
          ...(props.phone && { phone: String(props.phone) })
        },
        api_source: 'manual',
        last_updated: new Date().toISOString()
      }

      pois.push(poi)
    } catch (error) {
      console.error(`❌ Failed to convert Utsiktspunkter feature ${index}:`, error)
    }
  })

  console.log(`✅ Converted ${pois.length} Utsiktspunkter POIs from GeoJSON`)
  return pois
}

// Helper function to generate Norwegian names for Utsiktspunkter
function generateUtsiktspunkterName(props: UtsiktspunkterProps): string {
  if (props.tourism === 'viewpoint') {
    if (props.natural === 'peak') return 'Fjelltopp'
    if (props.building === 'tower') return 'Utsiktstårn'
    if (props.amenity === 'restaurant') return 'Restaurant med utsikt'
    if (props.natural === 'wood') return 'Utsiktspunkt i skog'
    return 'Utsiktspunkt'
  }
  if (props.amenity === 'restaurant') return 'Restaurant'
  if (props.building === 'tower') return 'Tårn'
  return 'Utsiktspunkt'
}

// Helper function to generate Norwegian descriptions for Utsiktspunkter  
function generateUtsiktspunkterDescription(props: UtsiktspunkterProps): string {
  const parts: string[] = []
  
  if (props.tourism === 'viewpoint') {
    parts.push('Utsiktspunkt med panoramautsikt over norsk natur')
  }
  
  if (props.natural === 'peak' && props.ele) {
    parts.push(`Fjelltopp ${props.ele} meter over havet`)
  } else if (props.ele) {
    parts.push(`Høyde: ${props.ele} meter over havet`)
  }
  
  if (props.building === 'tower') {
    parts.push('Utsiktstårn for bedre oversikt')
  }
  
  if (props.amenity === 'restaurant') {
    parts.push('Restaurant eller serveringssted')
  }
  
  if (props.wheelchair === 'yes') {
    parts.push('Tilgjengelig for rullestol')
  }
  
  if (props.opening_hours) {
    parts.push(`Åpningstider: ${props.opening_hours}`)
  }
  
  if (props.operator) {
    parts.push(`Driftes av ${props.operator}`)
  }

  if (parts.length === 0) {
    parts.push('Flott utsiktspunkt for naturopplevelser i Norge')
  }

  return parts.join('. ') + '.'
}

// GeoJSON loading functions removed - using pure OSM API
// Empty exports for backward compatibility
export async function loadKrigsminnerPOIs(): Promise<POI[]> { return [] }
export async function loadUtsiktspunkterPOIs(): Promise<POI[]> { return [] }

// Original functions kept for reference but not used
async function removedLoadKrigsminnerPOIs(): Promise<POI[]> {
  try {
    const response = await fetch('./krigsminner1.geojson')
    if (!response.ok) {
      throw new Error(`Failed to fetch Krigsminner data: ${response.status}`)
    }
    const geojson = await response.json()
    return convertKrigsminnerGeoJSONToPOIs(geojson)
  } catch (error) {
    console.error('❌ Failed to load Krigsminner data:', error)
    return []
  }
}

// Utsiktspunkter loading function removed - using pure OSM API
async function removedLoadUtsiktspunkterPOIs(): Promise<POI[]> {
  try {
    const response = await fetch('./utsiktspunkter.geojson')
    if (!response.ok) {
      throw new Error(`Failed to fetch Utsiktspunkter data: ${response.status}`)
    }
    const geojson = await response.json()
    return convertUtsiktspunkterGeoJSONToPOIs(geojson)
  } catch (error) {
    console.error('❌ Failed to load Utsiktspunkter data:', error)
    return []
  }
}

// Export empty arrays initially - will be populated by load functions
export const krigsminnerPOIs: POI[] = []
export const utsiktspunkterPOIs: POI[] = []

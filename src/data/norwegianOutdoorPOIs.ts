// Norwegian Outdoor Recreation POI Data
// Based on Norwegian "friluftsliv" standards and DNT categories

import { POI } from './pois'

// Sample Norwegian outdoor recreation POIs
// In production, this could be loaded from Kartverket APIs or other Norwegian sources
export const norwegianOutdoorPOIs: POI[] = [
  // Famous Norwegian hiking destinations
  {
    id: 'preikestolen',
    name: 'Preikestolen',
    description: 'Verdens mest fotograferte fjell - 604 meter over Lysefjorden',
    lat: 58.9864,
    lng: 6.1877,
    type: 'viewpoints'
  },
  {
    id: 'besseggen',
    name: 'Besseggen',
    description: 'Norges mest populære dagstur - klassisk fjelltur i Jotunheimen',
    lat: 61.4992,
    lng: 8.6789,
    type: 'hiking'
  },
  {
    id: 'galdhopiggen',
    name: 'Galdhøpiggen',
    description: 'Norges høyeste fjell - 2469 moh',
    lat: 61.6362,
    lng: 8.3125,
    type: 'mountain_peaks'
  },
  {
    id: 'trolltunga',
    name: 'Trolltunga',
    description: 'Spektakulær fjellformasjon 1180 meter over havet',
    lat: 60.1242,
    lng: 6.7400,
    type: 'viewpoints'
  },
  {
    id: 'lofoten_rorbuer',
    name: 'Lofoten Rorbuer',
    description: 'Tradisjonelle fiskehytter i Lofoten',
    lat: 68.1102,
    lng: 13.6470,
    type: 'camping_site'
  },
  {
    id: 'nordkapp',
    name: 'Nordkapp',
    description: 'Europas nordligste punkt - midnattssol og nordlys',
    lat: 71.1725,
    lng: 25.7841,
    type: 'viewpoints'
  },
  // DNT huts in popular areas
  {
    id: 'fannarakhutte',
    name: 'Fannaråkhytta',
    description: 'DNT hytte - startpunkt for Fannaråken',
    lat: 61.5219,
    lng: 7.8736,
    type: 'staffed_huts'
  },
  {
    id: 'gjendesheim',
    name: 'Gjendesheim',
    description: 'DNT turisthytte ved Gjende - start for Besseggen',
    lat: 61.4956,
    lng: 8.6744,
    type: 'staffed_huts'
  },
  // Swimming spots
  {
    id: 'bygdoy_sjobad',
    name: 'Bygdøy sjøbad',
    description: 'Populær badeplass i Oslo',
    lat: 59.9071,
    lng: 10.6833,
    type: 'swimming'
  },
  {
    id: 'ramberg_beach',
    name: 'Ramberg Beach',
    description: 'Hvit sandstrand i Lofoten',
    lat: 68.0847,
    lng: 13.1347,
    type: 'beach'
  },
  // Self-service huts
  {
    id: 'glitterheim',
    name: 'Glitterheim',
    description: 'Ubetjent hytte i Jotunheimen - nær Glittertind',
    lat: 61.6742,
    lng: 8.5167,
    type: 'self_service_huts'
  },
  // Wilderness shelters
  {
    id: 'rondvassbu_shelter',
    name: 'Rondvassbu vindskjul',
    description: 'Vindskjul ved Rondvatnet i Rondane',
    lat: 61.8833,
    lng: 9.8333,
    type: 'wilderness_shelter'
  },
  // Nature gems (waterfalls)
  {
    id: 'voringsfossen',
    name: 'Vøringsfossen',
    description: 'Spektakulær foss med 182 meters fall',
    lat: 60.3167,
    lng: 7.2833,
    type: 'nature_gems'
  },
  {
    id: 'kjosfossen',
    name: 'Kjøsfossen',
    description: 'Berømt foss langs Flåmsbana',
    lat: 60.8167,
    lng: 7.1167,
    type: 'nature_gems'
  },
  // Churches - Stave churches
  {
    id: 'borgund_stavkirke',
    name: 'Borgund stavkirke',
    description: 'Norges best bevarte stavkirke fra ca. 1200',
    lat: 60.9167,
    lng: 7.5167,
    type: 'churches'
  },
  {
    id: 'urnes_stavkirke',
    name: 'Urnes stavkirke',
    description: 'Verdensarv stavkirke fra ca. 1130',
    lat: 61.3000,
    lng: 7.3167,
    type: 'churches'
  },
  // War memorials
  {
    id: 'akershus_fortress',
    name: 'Akershus festning',
    description: 'Historisk festning og krigsmuseum i Oslo',
    lat: 59.9075,
    lng: 10.7369,
    type: 'war_memorials'
  },
  // Archaeological sites
  {
    id: 'alta_rock_art',
    name: 'Helleristningene i Alta',
    description: 'Verdensarv med over 5000 helleristninger',
    lat: 69.9689,
    lng: 23.2717,
    type: 'archaeological'
  },
  // Ski trails
  {
    id: 'holmenkollen',
    name: 'Holmenkollen skiarena',
    description: 'Berømt skihoppbakke og skimuseum',
    lat: 59.9631,
    lng: 10.6606,
    type: 'ski_trails'
  },
  // Tent areas
  {
    id: 'jotunheimen_tenting',
    name: 'Gjendesheim teltplass',
    description: 'Teltplass ved starten av Besseggen',
    lat: 61.4950,
    lng: 8.6750,
    type: 'tent_area'
  },
  // Fishing spots
  {
    id: 'gaula_fishing',
    name: 'Gaula laksefiske',
    description: 'Verdens beste laksefiske i Trøndelag',
    lat: 62.8667,
    lng: 10.1333,
    type: 'fishing_spots'
  },
  // Canoeing
  {
    id: 'flaamsdalen_kayak',
    name: 'Flåmsdalen kajakk',
    description: 'Padling i spektakulære fjordlandskap',
    lat: 60.8627,
    lng: 7.1136,
    type: 'canoeing'
  },
  // Cable cars
  {
    id: 'floybanen',
    name: 'Fløibanen',
    description: 'Kabelbane til Fløyen i Bergen',
    lat: 60.3928,
    lng: 5.3242,
    type: 'cable_cars'
  }
]

// Function to filter POIs by type
export const getPOIsByType = (poiType: string): POI[] => {
  return norwegianOutdoorPOIs.filter(poi => poi.type === poiType)
}

// Function to get POIs within viewport bounds
export const getPOIsInViewport = (
  bounds: { north: number; south: number; east: number; west: number },
  poiTypes: string[]
): POI[] => {
  return norwegianOutdoorPOIs.filter(poi => {
    // Check if POI is within bounds
    const inBounds = poi.lat <= bounds.north && 
                    poi.lat >= bounds.south && 
                    poi.lng <= bounds.east && 
                    poi.lng >= bounds.west

    // Check if POI type is requested
    const typeMatch = poiTypes.includes(poi.type)

    return inBounds && typeMatch
  })
}

// Export total count for UI
export const norwegianPOICount = norwegianOutdoorPOIs.length
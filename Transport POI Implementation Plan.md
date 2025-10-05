# Transport POI Implementation Plan
## Bussholdeplass (Bus Stops) and Togstasjon (Train Stations)

**Created:** October 5, 2025
**Status:** Planning Phase

---

## Current POI Structure

The application already has POI categories defined:

- **Bussholdeplass** (`bussholdeplass`) → Maps to `public_transport` POI type
- **Togstasjon** (`togstasjon`) → Maps to `train_stations` POI type

Located in: `src/data/pois.ts` lines 678-705

---

## Data Source Options

### Option 1: Entur API (Recommended) ✅

**Advantages:**
- Official Norwegian public transport data
- 75,000 daily departures on 4,700 routes
- Data from 60 operators nationwide
- Real-time data available
- Free and open data
- Includes stop IDs (NSR:StopPlace:XXXXX) for integration with timetables

**API Details:**
- **Endpoint:** `https://api.entur.io/geocoder/v1/autocomplete`
- **Format:** JSON (Pelias-based)
- **Authentication:** Requires `ET-Client-Name` header
- **License:** NLOD (Norwegian License for Open Government Data)

**Example Request:**
```javascript
fetch('https://api.entur.io/geocoder/v1/autocomplete?text=Oslo&size=100&layers=venue', {
  headers: {
    'ET-Client-Name': 'trakke-norwegian-outdoor-app'
  }
})
```

**Response Fields:**
- `features[]` - Array of results
  - `properties.name` - Stop name
  - `properties.id` - Entur stop ID (e.g., "NSR:StopPlace:59872")
  - `properties.category` - Type (e.g., "onstreetBus", "railStation")
  - `geometry.coordinates` - [lng, lat]
  - `properties.locality` - City/area name

**Filtering Stops:**
- Use `categories` parameter: `stopPlace-onstreetBus` for buses
- Use `categories` parameter: `stopPlace-railStation` for trains
- Use `boundary.rect` for bounding box filtering

### Option 2: OpenStreetMap via Overpass API

**Advantages:**
- Already integrated (see `overpassService.ts`)
- No API key required
- Well-documented tagging system
- Global coverage

**Disadvantages:**
- Data quality varies by area
- May be incomplete for Norwegian public transport
- No official stop IDs for timetable integration
- Slower query performance for large areas

**Overpass Query for Bus Stops:**
```javascript
const busStopsQuery = `
  [out:json][timeout:25];
  (
    node["highway"="bus_stop"](${south},${west},${north},${east});
    node["public_transport"="platform"]["bus"="yes"](${south},${west},${north},${east});
  );
  out center body 500;
`;
```

**Overpass Query for Train Stations:**
```javascript
const trainStationsQuery = `
  [out:json][timeout:25];
  (
    node["railway"="station"](${south},${west},${north},${east});
    node["railway"="halt"](${south},${west},${north},${east});
    way["railway"="station"](${south},${west},${north},${east});
  );
  out center body 500;
`;
```

---

## Recommended Implementation

### Use **Entur API** for both bus stops and train stations

**Reasons:**
1. Official Norwegian data source
2. Complete and accurate coverage
3. Maintained by national authority
4. Includes stop IDs for future timetable integration
5. Free and open under NLOD license

---

## Implementation Steps

### 1. Create Entur Service

Create new file: `src/services/enturService.ts`

```typescript
/**
 * Service for fetching public transport stop data from Entur API
 * Entur operates Norway's national public transport registry
 */

export interface EnturStop {
  id: string // NSR:StopPlace:XXXXX
  name: string
  type: 'bus' | 'train' | 'tram' | 'metro' | 'ferry'
  lat: number
  lng: number
  locality?: string // City/area name
  category: string // Entur category
}

export interface StopBounds {
  north: number
  south: number
  east: number
  west: number
}

export class EnturService {
  private static readonly GEOCODER_URL = 'https://api.entur.io/geocoder/v1'
  private static readonly CLIENT_NAME = 'trakke-norwegian-outdoor-app'
  private static readonly CACHE_DURATION = 15 * 60 * 1000 // 15 minutes
  private static cache = new Map<string, { data: EnturStop[], timestamp: number }>()

  /**
   * Fetch bus stops within bounds
   */
  static async fetchBusStops(bounds: StopBounds): Promise<EnturStop[]> {
    return this.fetchStops(bounds, ['stopPlace-onstreetBus', 'stopPlace-busStation'])
  }

  /**
   * Fetch train stations within bounds
   */
  static async fetchTrainStations(bounds: StopBounds): Promise<EnturStop[]> {
    return this.fetchStops(bounds, ['stopPlace-railStation'])
  }

  /**
   * Generic method to fetch stops by category
   */
  private static async fetchStops(
    bounds: StopBounds,
    categories: string[]
  ): Promise<EnturStop[]> {
    const cacheKey = `${categories.join(',')}_${bounds.north},${bounds.south},${bounds.east},${bounds.west}`

    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('🗄️ Using cached Entur data')
      return cached.data
    }

    try {
      console.log('🔄 Fetching stops from Entur API...', bounds)

      // Entur uses a different approach - we need to use the reverse geocoding
      // or the features endpoint with bounding box
      const url = `${this.GEOCODER_URL}/reverse?` + new URLSearchParams({
        'point.lat': String((bounds.north + bounds.south) / 2),
        'point.lon': String((bounds.east + bounds.west) / 2),
        'boundary.rect.min_lat': String(bounds.south),
        'boundary.rect.min_lon': String(bounds.west),
        'boundary.rect.max_lat': String(bounds.north),
        'boundary.rect.max_lon': String(bounds.east),
        'size': '500',
        'categories': categories.join(',')
      })

      const response = await fetch(url, {
        headers: {
          'ET-Client-Name': this.CLIENT_NAME,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Entur API error: ${response.status}`)
      }

      const data = await response.json()
      const stops = this.parseEnturResponse(data, categories)

      // Cache the results
      this.cache.set(cacheKey, { data: stops, timestamp: Date.now() })

      console.log(`✅ Fetched ${stops.length} stops from Entur`)
      return stops

    } catch (error) {
      console.error('❌ Error fetching Entur stops:', error)
      return []
    }
  }

  /**
   * Parse Entur API response to our POI format
   */
  private static parseEnturResponse(data: any, categories: string[]): EnturStop[] {
    if (!data.features || !Array.isArray(data.features)) {
      return []
    }

    return data.features
      .filter((feature: any) => {
        // Filter by category
        const category = feature.properties?.category?.[0]
        return categories.some(cat => category?.includes(cat.split('-')[1]))
      })
      .map((feature: any) => {
        const props = feature.properties
        const coords = feature.geometry?.coordinates

        if (!coords || coords.length !== 2) {
          return null
        }

        // Determine type from category
        let type: 'bus' | 'train' | 'tram' | 'metro' | 'ferry' = 'bus'
        const category = props.category?.[0] || ''
        if (category.includes('rail')) type = 'train'
        else if (category.includes('tram')) type = 'tram'
        else if (category.includes('metro')) type = 'metro'
        else if (category.includes('ferry')) type = 'ferry'

        return {
          id: props.id || `entur_${coords[1]}_${coords[0]}`,
          name: props.name || 'Unnamed stop',
          type,
          lat: coords[1],
          lng: coords[0],
          locality: props.locality,
          category: category
        }
      })
      .filter((stop: EnturStop | null): stop is EnturStop => stop !== null)
  }
}
```

### 2. Integrate into POI Data Service

Update `src/services/poiDataService.ts`:

```typescript
import { EnturService } from './enturService'

// Add to fetchPOIsByType function
case 'public_transport':
  console.log('🚌 Fetching bus stops from Entur')
  const busStops = await EnturService.fetchBusStops(bounds)
  return busStops.map(stop => ({
    id: stop.id,
    name: stop.name,
    lat: stop.lat,
    lng: stop.lng,
    category: 'public_transport',
    type: 'public_transport',
    color: POI_TYPES.public_transport.color,
    description: stop.locality ? `${stop.name} (${stop.locality})` : stop.name,
    icon: POI_TYPES.public_transport.icon,
    tags: {
      entur_id: stop.id,
      locality: stop.locality || '',
      category: stop.category
    }
  }))

case 'train_stations':
  console.log('🚂 Fetching train stations from Entur')
  const stations = await EnturService.fetchTrainStations(bounds)
  return stations.map(stop => ({
    id: stop.id,
    name: stop.name,
    lat: stop.lat,
    lng: stop.lng,
    category: 'train_stations',
    type: 'train_stations',
    color: POI_TYPES.train_stations.color,
    description: stop.locality ? `${stop.name} (${stop.locality})` : stop.name,
    icon: POI_TYPES.train_stations.icon,
    tags: {
      entur_id: stop.id,
      locality: stop.locality || '',
      category: stop.category
    }
  }))
```

### 3. Testing

Test with Oslo area:
```typescript
const osloBounds = {
  north: 59.95,
  south: 59.85,
  east: 10.85,
  west: 10.65
}
```

Expected results:
- Bus stops: Hundreds (Oslo has extensive bus network)
- Train stations: 10-20 major stations

### 4. Performance Considerations

- **Caching:** 15-minute cache (transport stops don't change frequently)
- **Result limit:** 500 stops per query (configurable)
- **Viewport filtering:** Only load stops within current map view
- **Clustering:** Consider clustering for dense urban areas

---

## Alternative: Hybrid Approach

Use **Entur for major stops** and **OpenStreetMap for coverage**:

1. Entur API for official stops with timetables
2. Overpass API for rural/unofficial stops
3. De-duplicate by proximity (< 50m = same stop)

---

## Future Enhancements

Once basic stops are implemented:

1. **Timetable integration** - Show next departures using Entur Journey Planner API
2. **Route visualization** - Display bus/train routes
3. **Real-time data** - Live departure times
4. **Service alerts** - Delays, cancellations
5. **Accessibility info** - Wheelchair access, elevators

---

## Questions to Consider

1. **Density:** Should we limit the number of bus stops shown (e.g., only major hubs)?
2. **Icons:** Different icons for bus vs. train vs. tram?
3. **Popup content:** What information to show (name, next departures, lines)?
4. **Mobile performance:** How many stops before clustering is needed?

---

## Recommendation Summary

✅ **Use Entur API** for both bus stops and train stations
✅ Implement caching to reduce API calls
✅ Add `ET-Client-Name: trakke-norwegian-outdoor-app` header
✅ Start with simple name + location, add timetables later
✅ Consider result limiting for performance (500 stops max)

The Entur API provides official, complete, and free data that's perfect for this use case.

# Integrate Cultural and War Heritage POIs into Tråkke App

## Objective

Implement a comprehensive POI (Points of Interest) system for Norwegian cultural heritage sites and war memorials/sites to be displayed on the interactive map in the Tråkke outdoor recreation app. 

Use Norwegian for all UI text, labels, and user-facing content. Strictly follow Norwegian grammar rules, spelling conventions, and capitalization patterns. Avoid English-style mid-sentence capitalization - use Norwegian lowercase conventions for common nouns, month names, and similar terms within sentences.

Sort all these POI-s under sub-categories under "Historiske steder" and add/edit sub-categories as you find neccessary.
## Data Sources (Priority Order)

### 1. Primary Source: Riksantikvaren API (Kulturminnesøk)

**Endpoint:** ArcGIS REST API from Riksantikvaren

- **Base URL:** `https://husmann.ra.no/arcgis/rest/services/Husmann/Husmann/MapServer/`
- **Data types:** Cultural heritage sites, archaeological sites, protected buildings, underwater heritage
- **Coverage:** 220,000+ objects across Norway
- **Format:** JSON/GeoJSON via REST API
- **Authentication:** Public, no API key required

**Key datasets to integrate:**

- `/4` - Lokaliteter (Heritage sites/locations)
- `/5` - Enkeltminner (Individual monuments)
- `/6` - Sikringssoner (Protection zones)

### 2. Secondary Source: OpenStreetMap via Overpass API

**Endpoint:** `https://overpass-api.de/api/interpreter`

- **Query focus:** Objects with tags: `historic=*`, `military=*`, `landuse=military`
- **Coverage:** Community-contributed data across Norway
- **Format:** JSON/GeoJSON
- **Authentication:** Public, no API key required

## Technical Requirements

### Data Integration Features

1. **POI Categories:**
    
    - Archaeological sites (burial mounds, stone circles, ancient settlements)
    - War memorials and WWII sites (bunkers, crash sites, resistance sites)
    - Protected buildings and churches
    - Underwater cultural heritage
    - Military installations (historical)
2. **Map Display Features:**
    
    - Custom icons for different POI categories
    - Clustering for dense areas
    - Filter toggles by category type
    - Detail popup with information and images when available
3. **Data Management:**
    
    - Efficient caching strategy for large datasets
    - Incremental data loading based on map viewport
    - Offline capability for downloaded areas
    - Data refresh mechanism

### Implementation Steps

#### Phase 1: Riksantikvaren Integration

1. **API Research & Testing:**
    
    - Test API endpoints and understand response structure
    - Identify optimal query parameters for geographic bounding boxes
    - Test rate limits and data volume per request
2. **Data Service Implementation:**
    
    - Create service class for Riksantikvaren API calls
    - Implement geographic filtering by bounding box
    - Add error handling and retry logic
    - Parse response data into standardized POI format
3. **Map Integration:**
    
    - Create POI layer in existing map component
    - Implement custom markers for different heritage types
    - Add clustering for performance with large datasets
    - Implement viewport-based data loading

#### Phase 2: OpenStreetMap Enhancement

1. **Overpass Query Development:**
    
    - Design efficient Overpass QL queries for Norwegian boundaries
    - Focus on `historic=*` and `military=*` tags
    - Filter for relevant military heritage (not active installations)
2. **Data Enrichment:**
    
    - Compare OSM data with Riksantikvaren to avoid duplicates
    - Use OSM data to fill gaps in official records
    - Prioritize official sources where both exist

#### Phase 3: User Experience Features

1. **POI Detail Views:**
    
    - Display detailed information about each site
    - Show historical context and significance
    - Include photos when available from APIs
    - Add direction/navigation integration
2. **Discovery Features:**
    
    - "Nearby heritage sites" recommendations
    - Themed routes (Viking heritage, WWII sites, etc.)
    - Educational content integration

### Technical Specifications

#### Data Models

```typescript
interface HeritagePoI {
  id: string;
  source: 'riksantikvaren' | 'openstreetmap';
  category: 'archaeological' | 'military' | 'building' | 'underwater' | 'memorial';
  name: string;
  description: string;
  coordinates: [number, number]; // [lng, lat]
  period?: string; // Historical period
  protection_status?: string;
  images?: string[];
  source_url?: string;
  created_at: Date;
  updated_at: Date;
}
```

#### Performance Requirements

- Load POIs progressively based on zoom level
- Cluster markers when >50 POIs in viewport
- Cache API responses for 24 hours
- Limit initial load to 1000 POIs per request

#### API Integration Best Practices

- Implement proper error handling for network issues
- Add loading states for data fetching
- Respect API rate limits (implement request throttling)
- Use geographic bounding box queries for efficiency
- Implement data validation for API responses

### Quality Assurance

1. **Data Validation:**
    
    - Verify coordinates are within Norwegian boundaries
    - Check for duplicate entries across data sources
    - Validate required fields are populated
2. **User Testing:**
    
    - Test POI visibility at different zoom levels
    - Verify detail popup functionality
    - Test performance with large datasets
    - Validate offline functionality
3. **Content Review:**
    
    - Ensure appropriate categorization of sensitive war sites
    - Verify historical accuracy of displayed information
    - Check for potentially outdated or incorrect data

## Expected Deliverables

1. **Heritage POI Service:** Complete integration with both APIs
2. **Map Layer Enhancement:** POI display with categorization and filtering
3. **Detail View Component:** Rich information display for selected POIs
4. **Performance Optimization:** Efficient data loading and caching
5. **Documentation:** API integration guide and user feature documentation

## Success Metrics

- Successfully load and display 1000+ heritage POIs across Norway
- Response time <2 seconds for POI data loading
- Accurate categorization of 95%+ of POIs
- Zero crashes when handling large datasets
- Positive user feedback on heritage discovery features

---

**Note:** Prioritize the Riksantikvaren API as the primary data source due to its official status and comprehensive coverage. Use OpenStreetMap data strategically to enhance coverage, particularly for military heritage sites that may not be fully represented in official databases.
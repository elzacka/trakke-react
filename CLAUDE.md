# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a React-based outdoor recreation app called "Tråkke" that helps users discover hiking trails, swimming spots, camping areas, and other points of interest (POIs) throughout Norway. The app is focused on Norwegian "friluftsliv" culture with comprehensive coverage of all mainland Norway plus Arctic regions.

**Tech Stack:**
- React 19.1.0 + TypeScript 5.8.3 + Vite 7.0.6
- Leaflet maps (manual implementation, not react-leaflet)
- Material Symbols for icons
- CSS for styling (no framework)

**Key Architecture:**
- Component-based structure with WorkingTrakkeApp as main component
- Service layer for external APIs (OSM, Nominatim search)
- Centralized POI data management with TypeScript interfaces
- Custom Leaflet markers with category-based styling
- Zoom-based POI display for performance

## Development Commands

```bash
npm run dev          # Start dev server (usually port 3000, fallback 3001)
npm run build        # Build for production (TypeScript compile + Vite build)
npm run preview      # Preview production build
npm run lint         # Run ESLint with max 0 warnings (strict policy)
```

## Current Implementation Status

### ✅ **Complete Feature Set**
- **Geographic Coverage**: Full Norway (57.5-71.5°N, 4.0-31.5°E) - all mainland + Arctic regions
- **POI Categories**: All Norwegian outdoor recreation categories working
- **Language**: 100% Norwegian (Bokmål) throughout - no English mixing
- **API Compliance**: All external APIs have proper User-Agent headers and rate limiting
- **Performance**: Zoom-based POI display prevents map clutter

### **Key Configuration Values**

#### **Map Center & Zoom**
```typescript
// WorkingTrakkeApp.tsx line 132
.setView([64.5, 11.0], 6) // Central Norway, zoom 6 shows most of country
```

#### **Norway Bounding Box**
```typescript
// osmService.ts lines 18-23
const NORWAY_BBOX = {
  south: 57.5,   // Lindesnes (southernmost point)
  west: 4.0,     // Western coast including Shetland time zone areas
  north: 71.5,   // Nordkapp and beyond  
  east: 31.5     // Eastern border with Russia (Finnmark)
}
```

#### **Zoom-based POI Display**
```typescript
// WorkingTrakkeApp.tsx lines 236-257
// High priority (zoom 11+): viewpoints, nature_gems, staffed_huts, camping_site, war_memorials, churches, mountain_peaks
// Medium priority (zoom 13+): hiking, swimming, beach, self_service_huts, wilderness_shelter, archaeological, protected_buildings, parking, cable_cars
// Low priority (zoom 15+): tent_area, wild_camping, hammock_spots, rest_areas, toilets, drinking_water, fire_places, information_boards, public_transport
// Detail (zoom 17+): train_stations, fishing_spots, canoeing, mountain_service, accessible_sites, ski_trails, lakes_rivers, ice_fishing
```

## Code Architecture

### **File Structure**
```
src/
├── WorkingTrakkeApp.tsx          # Main app component
├── components/
│   ├── Sidebar.tsx               # Clean sidebar (guidance removed)
│   ├── SearchBox/                # Norwegian search with 150+ translations
│   └── HierarchicalCategoryFilter.tsx
├── hooks/
│   └── usePOIData.ts            # Combined manual + OSM data loading
├── services/
│   ├── osmService.ts            # Norway-wide OSM queries (simplified)
│   └── searchService.ts         # Norwegian translation dictionary
└── data/
    └── pois.ts                  # POI types and manual Norwegian landmarks
```

### Core Data Types
- `POI` interface: Main data structure for points of interest
- `POIType`: Union type defining categories (hiking, swimming, camping variants, etc.)
- `CampingMetadata`: Extended metadata for camping-related POIs
- `CategoryConfig`: Visual configuration (colors, icons) per POI type

### Key Components
- **WorkingTrakkeApp.tsx**: Main application component with manual Leaflet integration
- **Sidebar.tsx**: POI filtering and category management
- **SearchBox/**: Search functionality with Norwegian place name translation
- **HierarchicalCategoryFilter.tsx**: Category filtering with Material Icons

### Services & Data Layer
- **osmService.ts**: OpenStreetMap API integration with simplified Norway-wide queries
- **searchService.ts**: Nominatim search with 150+ Norwegian translations  
- **usePOIData.ts**: Combined manual + OSM POI data management hook

### Data Flow
1. POI data starts with manual Norwegian landmarks in `data/pois.ts` (Preikestolen, Besseggen, Nordkapp, etc.)
2. OSM Overpass API augments data with Norway-wide camping, war memorials, etc.
3. Components consume data through `usePOIData` hook
4. Map renders POIs with zoom-based display and category-specific styling

## API Integrations

### **OpenStreetMap Overpass**
- **Coverage**: All of Norway (57.5-71.5°N, 4.0-31.5°E)
- **Timeout**: 25 seconds for Overpass QL queries
- **Rate Limiting**: 20 seconds total timeout for data loading
- **User-Agent**: Proper headers for API compliance
- **Categories**: Camping, war memorials, churches, archaeological sites, etc.

### **Nominatim Search**
- **Language**: Norwegian place names with English fallbacks
- **Translation**: 150+ Norwegian terms (fjell→mountain, elv→river, etc.)
- **Rate Limiting**: 1 request/second limit respected
- **Caching**: 5-minute search result cache

## Geographic Scope & Features

### **Current Coverage**
- **Full Norway**: All mainland + Arctic regions (Svalbard scope ready)
- **Map Center**: [64.5, 11.0] (Central Norway)
- **Zoom Strategy**: Smart POI display based on zoom levels (11→13→15→17+ thresholds)

### **POI Categories** (All Norwegian)
- **Hiking & Nature**: hiking, viewpoints, nature_gems, mountain_peaks
- **Water Activities**: swimming, beach, lakes_rivers, canoeing, ice_fishing  
- **Accommodation**: camping_site, tent_area, staffed_huts, self_service_huts, wilderness_shelter
- **Culture & History**: war_memorials, churches, archaeological, protected_buildings
- **Facilities**: parking, toilets, drinking_water, fire_places, information_boards
- **Transport**: public_transport, train_stations, cable_cars

## Norwegian Language Guidelines (Klarspråk)

When writing user-facing content, follow Norwegian "klarspråk" principles:

### Core Principles
- **Find**: Users can find what they need (findable)
- **Understand**: Clear comprehension (comprehensible)  
- **Use**: Actionable information (actionable)

### Writing Style
- **Language**: Contemporary Bokmål throughout
- **Voice**: Active voice, direct address with "du/deg"
- **Tone**: Encouraging, reliable, approachable, practical
- **Terminology**: Consistent outdoor recreation terms

### UI Applications
- **Error Messages**: Explain what happened + what user can do
- **Button Labels**: Clear action verbs ("Søk", "Lagre", "Del rute")
- **Instructions**: Context-appropriate help for outdoor activities

## Performance & Technical Notes

### **API Timeouts**
```typescript
// usePOIData.ts line 35: 20 seconds for Norway-wide queries
// osmService.ts: 25 seconds for Overpass QL timeout
```

### **Expected Behavior on Load**
1. **Manual POIs visible** immediately - Norwegian landmarks across Norway
2. **Map centered** on central Norway (64.5°N, 11.0°E) at zoom 6
3. **OSM loading message** in console: "🔄 Loading POIs from OpenStreetMap in background..."
4. **Within 20 seconds**: OSM POIs appear with success message

### **User Interactions**
1. **Zoom in** → More POIs appear (progressive zoom thresholds)
2. **Click categories** → Toggle POI types in sidebar  
3. **Click POI markers** → Norwegian descriptions only
4. **Search box** → Norwegian place names and coordinates

## Current Status

### **Project State** 
- **Status**: Norway-wide outdoor recreation app ready
- **Language**: 100% Norwegian (Bokmål)
- **Coverage**: Complete Norway mainland + Arctic regions
- **Technical**: All builds successful, no TypeScript/ESLint issues

### **Git Status**
- **Branch**: main
- **Changes**: All recent improvements uncommitted (Norway expansion, translations, zoom UX)
- **Ready**: Features working and tested, ready for commit

### **Next Steps**
1. Test app functionality after any server restarts
2. Consider UX improvements for user guidance
3. Verify all POI categories load correctly across Norway
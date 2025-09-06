# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a React-based outdoor recreation app called "Tråkke" that helps users discover hiking trails, swimming spots, camping areas, and other points of interest (POIs) throughout Norway. The app focuses on Norwegian "friluftsliv" culture with comprehensive coverage of all mainland Norway plus Arctic regions.

**Tech Stack:**
- React 19.1.0 + TypeScript 5.8.3 + Vite 7.0.4
- MapLibre GL JS 5.7.0 (replaced Leaflet implementation)
- Material Symbols for icons
- CSS for styling (no framework)

**Key Architecture:**
- Component-based structure with MapLibreTrakkeApp as main component
- Service layer for Norwegian place name search via Nominatim
- Norwegian outdoor recreation POI data with TypeScript interfaces
- MapLibre GL JS with official Kartverket topographic tiles
- Category-based POI filtering with real-time viewport updates

## Development Commands

```bash
npm run dev          # Start dev server (usually port 3000)
npm run build        # Build for production (TypeScript compile + Vite build)  
npm run preview      # Preview production build
npm run lint         # Run ESLint with max 0 warnings (strict policy)
npm run deploy       # Deploy to GitHub Pages
```

## Current Implementation Status

### ✅ **Complete Feature Set**
- **Geographic Coverage**: Full Norway (57.5-71.5°N, 4.0-31.5°E) using Kartverket official maps
- **POI Categories**: Currently only Krigsminner (war memorials) from OpenStreetMap are active
- **Language**: 100% Norwegian (Bokmål) throughout
- **Map Technology**: MapLibre GL JS with Kartverket WMS topographic tiles
- **Search**: Norwegian place name search with coordinate display

### **Critical Configuration Values**

#### **Norwegian Territory Bounds**
```typescript
// MapLibreMap.tsx - Used for initial map bounds and maxBounds
const NORWAY_BOUNDS = [
  [3.0, 57.5],   // Southwest (extended west for full coastline)  
  [32.0, 72.0]   // Northeast (extended north for full coverage)
]
```

#### **Map Initialization**
```typescript
// MapLibreMap.tsx - Constructor bounds for complete Norway visibility
bounds: [
  [3.0, 57.5],   // Southwest corner - extended for full coastline
  [32.0, 72.0]   // Northeast corner - extended for full northern coverage
],
fitBoundsOptions: {
  padding: { top: 10, bottom: 10, left: 10, right: 10 }
}
```

#### **Kartverket Tile Source**
```typescript
// Official Norwegian topographic tiles
'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'
```

## Code Architecture

### **Core Application Structure**
```
src/
├── MapLibreTrakkeApp.tsx         # Main app component
├── main.tsx                      # Entry point using MapLibreTrakkeApp
├── components/
│   ├── MapLibreMap.tsx           # MapLibre GL map component (core)
│   ├── CategoryPanel.tsx         # POI category filtering
│   ├── SearchBox/                # Norwegian search with translations
│   └── HierarchicalCategoryFilter.tsx
├── data/
│   ├── pois.ts                   # POI types and category tree definitions
│   └── norwegianOutdoorPOIs.ts  # Famous Norwegian outdoor locations
└── services/
    └── searchService.ts          # Nominatim search with Norwegian translations
```

### **Core Data Types**
- `POI` interface: Main data structure for points of interest  
- `CategoryState`: Manages checked/expanded state for category tree
- `CategoryNode`: Hierarchical category structure with Norwegian names
- `SearchResult`: Search results from Nominatim with Norwegian place names

### **Key Components**
- **MapLibreTrakkeApp.tsx**: Main application component managing state and layout
- **MapLibreMap.tsx**: MapLibre GL map with Kartverket tiles, POI rendering, and coordinate display
- **CategoryPanel.tsx**: Category filtering UI with expand/collapse functionality
- **SearchBox/**: Norwegian place name search with real-time suggestions

### **Data Flow**
1. Norwegian POI data loaded from `norwegianOutdoorPOIs.ts` (Preikestolen, Besseggen, etc.)
2. Category state managed in MapLibreTrakkeApp with real-time filtering
3. Map viewport changes trigger POI filtering based on bounds and active categories
4. Search integrates Norwegian place names via Nominatim with coordinate results

## Map Technology & Norwegian Integration

### **MapLibre GL JS with Kartverket**
- **Base Tiles**: Official Kartverket WMS topographic tiles
- **Initial View**: Automatic bounds fitting to show complete Norway
- **Controls**: Navigation, scale (målestokk), geolocation with Norwegian attribution
- **Coordinate Display**: Real-time coordinate overlay at map bottom

### **Norwegian POI Data**
- **Famous Landmarks**: Preikestolen, Trolltunga, Nordkapp, Galdhøpiggen
- **DNT Infrastructure**: Fannaråkhytta, Gjendesheim (staffed huts)
- **Cultural Sites**: Stave churches (Borgund, Urnes), war memorials
- **Outdoor Activities**: Skiing (Holmenkollen), fishing (Gaula), waterfalls

### **Search & Localization** 
- **Norwegian Search**: Nominatim API with 150+ Norwegian translations
- **Coordinate Parsing**: Decimal degrees, DMS, UTM coordinate support
- **Place Name Translation**: fjell→mountain, elv→river, etc.
- **Rate Limiting**: 1 request/second with 5-minute caching

## POI Categories (Currently Only Active: Krigsminner)

**Currently Available:**
- **Historiske steder > Krigsminner** (Cultural Heritage > War Memorials): ACTIVE - loaded from OpenStreetMap

**Future Categories (currently inactive/greyed out):**
- **Turløyper** (Outdoor Activities): hiking, mountain_peaks, ski_trails
- **Bade** (Water Activities): swimming, beach  
- **Sove** (Accommodation): staffed_huts, self_service_huts, camping_site, tent_area
- **Naturperler** (Nature Experiences): viewpoints, nature_gems (waterfalls)
- **Historiske steder** (Other): churches, archaeological (inactive)
- **Service** (Infrastructure): parking, toilets, information_boards, cable_cars

## User Experience & Norwegian Standards

### **Language Guidelines (Klarspråk)**
- **Contemporary Bokmål**: Active voice, direct address with "du/deg"
- **Outdoor Terminology**: Consistent friluftsliv vocabulary
- **Clear Actions**: "Søk", "Lagre", "Del rute" for UI elements
- **Error Messages**: Explain what happened + what user can do

### **Map Interaction**
- **Initial View**: Complete Norwegian territory visible on load
- **Category Selection**: Real-time POI filtering with expand/collapse
- **Search Results**: Smooth map centering with 1-second animation
- **Coordinate Display**: Live mouse coordinates in Norwegian format

## Technical Implementation Notes

### **Performance Considerations**
- **Viewport-based Loading**: POIs load only when categories selected and in view
- **Category Pre-selection**: Key categories (viewpoints, hiking, mountains) pre-selected for immediate content
- **Search Caching**: 5-minute cache for place name results
- **Map Optimization**: Constructor bounds more reliable than post-init fitBounds calls

### **API Integration**
- **Nominatim Search**: Norwegian place name translation with proper User-Agent
- **Kartverket Tiles**: Official Norwegian topographic maps via WMS
- **No OSM Dependency**: Removed OpenStreetMap POI loading, uses curated Norwegian data

### **Development Workflow**
1. **Hot Reload**: Vite dev server with instant updates
2. **Type Safety**: Strict TypeScript with no ESLint warnings policy
3. **Norwegian Focus**: All content, coordinates, and interactions in Norwegian context
4. **Map-First Design**: Geography and outdoor recreation drive all feature decisions

## Current Status

- **Primary Component**: MapLibreTrakkeApp.tsx
- **Map Technology**: MapLibre GL JS with Kartverket tiles (replaced Leaflet)
- **Data Source**: OpenStreetMap via Overpass API for Krigsminner (war memorials)
- **Language**: 100% Norwegian Bokmål interface and content
- **Coverage**: Complete Norway from Lindesnes to Nordkapp with Arctic regions
- **Build Status**: All TypeScript and linting issues resolved

## APP- OG KARTNAVIGASJON

### **Keyboard Shortcuts**
- **Ctrl+K / ⌘+K**: Open sidebar and focus search field (or focus search if already open)
- **Ctrl+B / ⌘+B**: Toggle sidebar open/closed
- **Escape**: Close sidebar (if open) or blur search field (if focused)

### **Mouse Navigation**
- **Click & Drag**: Pan map
- **Mouse Wheel**: Zoom in/out
- **Double-click**: Zoom in
- **Right-click**: Context menu (browser default)

### **POI Interaction**
- **Click purple markers**: Show POI popup with name and description
- **Hover over markers**: Cursor changes to pointer
- **Click popup close**: Close popup

### **Search Functionality**
- **Type location name**: Real-time Norwegian place name search
- **Arrow keys**: Navigate search results
- **Enter**: Select highlighted result and center map
- **Tab**: Select result without closing dropdown
- **Escape**: Close search results or blur search field

### **Category Navigation**
- **Click category checkbox**: Toggle POI visibility for that category
- **Click expand/collapse arrows**: Show/hide subcategories
- **Parent categories**: Auto-select when all children are selected

### **Sidebar Controls**
- **Chevron button**: Toggle sidebar visibility
- **Search shortcuts**: Quick access via keyboard
- **Responsive collapse**: Automatically adapts to screen size

## CURRENT STATUS ✅

### **Fully Working Features**
- ✅ POI popup clicks - Fixed with layer-specific event handlers
- ✅ Keyboard shortcuts for navigation and search
- ✅ MapLibre GL JS with Kartverket topographic tiles
- ✅ Norwegian place name search via Nominatim API
- ✅ POI data loading from OpenStreetMap Overpass API
- ✅ Category-based filtering with real-time updates
- ✅ Material Symbols icons for POI markers and UI
- ✅ Responsive design with sidebar toggle
- ✅ Clean codebase with no legacy leftovers
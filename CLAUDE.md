# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🗺️ Project Overview

Tråkke is a Norwegian outdoor recreation app built with React + TypeScript + Vite that displays Points of Interest (POIs) on interactive maps using official Norwegian map data from Kartverket. The app focuses on hiking, camping, cultural sites, and outdoor activities across Norway.

## 🛠️ Development Commands

- **Development**: `npm run dev` - Start development server on http://localhost:3000
- **Build**: `npm run build` - TypeScript compilation and production build
- **Lint**: `npm run lint` - ESLint checking with React and TypeScript rules
- **Deploy**: `npm run deploy` - Deploy to GitHub Pages using gh-pages

## 🏗️ Architecture Overview

### Core Components Structure
- **`MapLibreTrakkeApp.tsx`** - Main application component containing all state management, POI loading logic, and API orchestration
- **`MapLibreMap.tsx`** - Map rendering component using MapLibre GL JS with Kartverket WMTS raster tiles (zoom limits: 3-17)
- **`CategoryPanel.tsx`** - Sidebar with hierarchical POI category filtering
- **`SearchBox/`** - Norwegian place name search using Kartverket's official place name API
- **`HierarchicalCategoryFilter.tsx`** - Multi-level category tree with checkbox states

### Data Architecture
- **POI Categories**: Defined in `src/data/pois.ts` with 7 main categories (Aktivitet, Naturperle, Overnatte, På eventyr, Service, Transport, Turløype)
- **API-Based POI Rendering**: Uses MapLibre GL Markers (NOT GeoJSON layers) for performance
- **Color Coordination**: Each POI category has specific colors that must match between markers and UI elements
- **POI Transform Functions**: Located in `MapLibreTrakkeApp.tsx` - convert API data to internal POI format with correct colors

### Service Layer
- **`overpassService.ts`** - OpenStreetMap Overpass API queries for POI data (war memorials, caves, towers, hunting stands)
- **`searchService.ts`** - Norwegian place name and address search using Kartverket's official APIs (replaced Nominatim)
- **`kartverketTrailService.ts`** - Future integration with official Norwegian trail data

### Map Integration
- **Map Library**: MapLibre GL JS with Kartverket WMTS raster tiles
- **Zoom Configuration**: minZoom: 3, maxZoom: 17 (prevents grey map at extreme zoom levels)
- **Coordinate System**: Web Mercator (EPSG:3857)
- **POI Popups**: Custom HTML popups with close buttons (X), not default MapLibre popups
- **Interactive Features**: Click-to-copy coordinates, position/search markers, smooth animations

## 🚨 Critical Architecture Rules

The ESLint configuration enforces these architectural decisions:

### ✅ REQUIRED Patterns
- **API-based POI rendering**: Use `new maplibregl.Marker()` with DOM elements
- **Kartverket WMTS tiles**: Use the official cache.kartverket.no raster tile service
- **Color consistency**: POI marker colors must match category colors from `pois.ts`
- **Kartverket APIs**: Use official Norwegian APIs for place name search (not Nominatim)

### ❌ FORBIDDEN Patterns
- **GeoJSON sources**: Banned by ESLint rules - causes performance issues
- **Vector tiles**: Currently forbidden (legacy rule from architecture document)
- **Inconsistent POI colors**: All POI transform functions must use correct category colors
- **Third-party search APIs**: Use Kartverket APIs for Norwegian data accuracy

## 🎯 POI System

### POI Loading Flow
1. User checks POI categories in CategoryPanel
2. `MapLibreTrakkeApp.tsx` detects active categories via `getActiveCategoryTypes()`
3. Appropriate transform functions called (e.g., `transformOverpassPOIs()`)
4. POI data loaded from APIs (Overpass API for OpenStreetMap data)
5. `MapLibreMap.tsx` receives POI array and creates MapLibre GL Markers
6. Each marker gets click handler for custom popup display

### POI Categories & Colors (Current 2024)
- **Aktivitet** (`#0d9488` teal): Swimming, beaches, fishing, fire places, canoeing
- **Naturperle** (`#059669` green): Nature gems, waterfalls, viewpoints, observation towers
- **Overnatte** (`#b45309` amber): Camping, shelters, cabins, tent areas, hammock spots
- **På eventyr** (`#7c3aed` purple): War memorials, cultural heritage, caves, archaeological sites
- **Service** (`#ea580c` orange): Information, drinking water, rest areas, toilets, parking
- **Transport** (`#0284c7` blue): Public transport, cable cars, train stations
- **Turløype** (`#16a34a` green): Hiking trails, ski routes, cycling paths

### Custom Popup System
POI popups are custom HTML elements positioned above markers with:
- Color-coded headers matching POI category
- Close button (×) in upper-right corner
- Wikipedia/Wikidata links when available
- Auto-close on zoom/pan and outside clicks

## 🔍 Search System

### Enhanced Norwegian Search
- **Primary API**: Kartverket's official place name service (ws.geonorge.no)
- **Secondary API**: Kartverket address search for comprehensive coverage
- **Features**:
  - Coordinate parsing (UTM, decimal degrees)
  - Place name prioritization over addresses
  - Enhanced result limits (12 total results)
  - Automatic duplicate removal
  - Search result markers on map
  - Arrow key navigation and keyboard shortcuts

### Search Result Types
- **Coordinates**: Direct coordinate input (various formats supported)
- **Places**: Official Norwegian place names from Kartverket
- **Addresses**: Street addresses and postal codes
- **POIs**: Points of Interest from loaded categories

## 🎨 Styling & Design

- **Icons**: Material Symbols Outlined font for consistency
- **Norwegian UI**: All interface text in Norwegian (bokmål)
- **Responsive**: Mobile-first design with collapsible sidebar
- **Color System**: Consistent color palette across categories, POIs, and UI elements
- **Typography**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Animations**: Smooth transitions for sidebar, markers, and popups

## 📱 User Experience & Features

### Default State
- Sidebar collapsed on load
- No POI categories active (user must explicitly select)
- Map centered on user location (with fallback to Oslo)

### Interactive Features
- **Click-to-copy coordinates**: Click coordinate display to copy to clipboard
- **Position marker**: Shows marker when using location button
- **Search markers**: Places markers for search results
- **Smooth animations**: All UI transitions are animated
- **Responsive chevron**: Sidebar toggle arrow flips correctly

### Keyboard Shortcuts
- **Ctrl+K / ⌘+K**: Progressive search action (open sidebar → focus search → close sidebar)
- **Ctrl+B / ⌘+B**: Toggle sidebar open/closed
- **Escape**: Blur search input or collapse sidebar
- **Arrow keys**: Navigate search results
- **Enter**: Select highlighted search result
- **Tab**: Auto-complete search result without closing dropdown

### Map Controls
- Custom controls for compass, credits, and zoom
- Location button with loading states and marker placement
- Click-to-copy Norwegian coordinate display (decimal degrees)

## 🔧 Configuration Notes

- **Base URL**: Set to `./` for GitHub Pages deployment
- **Port**: Development server runs on 3000 with auto-open
- **Build**: TypeScript strict mode with Vite optimization
- **ESLint**: Custom rules prevent architectural regressions and unused variables
- **No testing framework**: Tests not currently implemented

## 🚀 Deployment

Built for GitHub Pages with `gh-pages` package. The `deploy` script builds and pushes the `dist` folder to the `gh-pages` branch. GitHub Actions automatically run lint and build checks on every push.

## 🧩 Recent Major Features (September 13th. 2025)

### Search Enhancements
- Replaced Nominatim with Kartverket's official APIs for better Norwegian coverage
- Added address search capability alongside place name search
- Implemented search result markers that appear on map selection
- Enhanced search prioritization (places over addresses)
- Removed duplicate information and icons from search results

### UI/UX Improvements
- Added click-to-copy functionality for coordinate display
- Implemented position marker for location button clicks
- Fixed chevron toggle behavior for all sidebar interaction methods
- Enhanced keyboard navigation with progressive Ctrl+K behavior
- Improved mobile responsiveness and touch interactions

### Technical Improvements
- Fixed MapLibre marker visibility issues (removed conflicting CSS)
- Corrected POI category colors (caves now properly purple in "På eventyr")
- Enhanced error handling and loading states
- Improved TypeScript export patterns for better build compatibility
- Fixed all ESLint unused variable warnings for clean CI/CD
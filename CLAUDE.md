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
- **`SearchBox/`** - Norwegian place name search using Nominatim API
- **`HierarchicalCategoryFilter.tsx`** - Multi-level category tree with checkbox states

### Data Architecture
- **POI Categories**: Defined in `src/data/pois.ts` with 7 main categories (Aktivitet, Naturperle, Overnatte, På eventyr, Service, Transport, Turløype)
- **API-Based POI Rendering**: Uses MapLibre GL Markers (NOT GeoJSON layers) for performance
- **Color Coordination**: Each POI category has specific colors that must match between markers and UI elements
- **POI Transform Functions**: Located in `MapLibreTrakkeApp.tsx` - convert API data to internal POI format with correct colors

### Service Layer
- **`overpassService.ts`** - OpenStreetMap Overpass API queries for POI data (war memorials, caves, towers, hunting stands)
- **`searchService.ts`** - Norwegian place name search with coordinate/address/POI type detection  
- **`kartverketTrailService.ts`** - Future integration with official Norwegian trail data

### Map Integration
- **Map Library**: MapLibre GL JS with Kartverket WMTS raster tiles
- **Zoom Configuration**: minZoom: 3, maxZoom: 17 (prevents grey map at extreme zoom levels)
- **Coordinate System**: Web Mercator (EPSG:3857) 
- **POI Popups**: Custom HTML popups with close buttons (X), not default MapLibre popups

## 🚨 Critical Architecture Rules

The ESLint configuration enforces these architectural decisions:

### ✅ REQUIRED Patterns
- **API-based POI rendering**: Use `new maplibregl.Marker()` with DOM elements
- **Kartverket WMTS tiles**: Use the official cache.kartverket.no raster tile service
- **Color consistency**: POI marker colors must match category colors from `pois.ts`

### ❌ FORBIDDEN Patterns  
- **GeoJSON sources**: Banned by ESLint rules - causes performance issues
- **Vector tiles**: Currently forbidden (legacy rule from architecture document)
- **Inconsistent POI colors**: All POI transform functions must use correct category colors

## 🎯 POI System

### POI Loading Flow
1. User checks POI categories in CategoryPanel
2. `MapLibreTrakkeApp.tsx` detects active categories via `getActiveCategoryTypes()`
3. Appropriate transform functions called (e.g., `transformOverpassPOIs()`)
4. POI data loaded from APIs (Overpass API for OpenStreetMap data)
5. `MapLibreMap.tsx` receives POI array and creates MapLibre GL Markers
6. Each marker gets click handler for custom popup display

### POI Categories & Colors
- **Aktivitet** (`#0d9488` teal): Swimming, beaches, fishing, fire places, canoeing
- **Naturperle** (`#059669` green): Nature gems, caves, viewpoints, observation towers
- **Overnatte** (`#b45309` orange): Camping, shelters, cabins, tent areas
- **På eventyr** (`#7c3aed` purple): War memorials, cultural heritage, archaeological sites
- **Service** (`#ea580c` orange): Information, drinking water, rest areas, toilets, parking
- **Transport** (`#0284c7` blue): Public transport, cable cars, train stations
- **Turløype** (`#16a34a` green): Hiking trails, ski routes, cycling paths

### Custom Popup System
POI popups are custom HTML elements positioned above markers with:
- Color-coded headers matching POI category
- Close button (×) in upper-right corner  
- Wikipedia/Wikidata links when available
- Auto-close on zoom/pan and outside clicks

## 🎨 Styling & Design

- **Icons**: Material Symbols Outlined font for consistency
- **Norwegian UI**: All interface text in Norwegian (bokmål)
- **Responsive**: Mobile-first design with collapsible sidebar
- **Color System**: Consistent color palette across categories, POIs, and UI elements
- **Typography**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)

## 📱 User Experience

### Default State
- Sidebar collapsed on load
- No POI categories active (user must explicitly select)
- Map centered on user location (with fallback to Oslo)

### Keyboard Shortcuts  
- Handled in `MapLibreTrakkeApp.tsx` with focus management
- Search input can be focused via keyboard shortcuts

### Map Controls
- Custom controls for compass, credits, and zoom
- Scale display with metric units (meter/kilometer)
- Location button with loading states
- Norwegian coordinate display

## 🔧 Configuration Notes

- **Base URL**: Set to `./` for GitHub Pages deployment
- **Port**: Development server runs on 3000 with auto-open
- **Build**: TypeScript strict mode with Vite optimization
- **ESLint**: Custom rules prevent architectural regressions
- **No testing framework**: Tests not currently implemented

## 🚀 Deployment

Built for GitHub Pages with `gh-pages` package. The `deploy` script builds and pushes the `dist` folder to the `gh-pages` branch.
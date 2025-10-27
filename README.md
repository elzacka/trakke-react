# 🥾 Tråkke - Norwegian Outdoor Discovery Platform

[![Deploy to GitHub Pages](https://github.com/elzacka/trakke-react/actions/workflows/deploy.yml/badge.svg)](https://github.com/elzacka/trakke-react/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Tråkke** is a web application for exploring Norway's nature, cultural heritage, and outdoor adventures. Built with official Norwegian government data sources and open data for comprehensive, accurate coverage of trails, points of interest, and geographical information.

🌐 **Live App**: [https://elzacka.github.io/trakke-react/](https://elzacka.github.io/trakke-react/)

## 📍 Current Status

**Fully Functional:**
- Interactive maps with GPS navigation and distance measurement
- 12+ POI categories with real-time data from government and open sources
- Trail system with WMS raster layers from Turrutebasen (Norwegian National Trail Database)
- Mobile-optimized interface with keyboard shortcuts
- Nature area overlays (Naturskog layers) from Norwegian environmental agencies

## ✨ Features

- **Interactive Maps** - Topographic (Kartverket) and satellite (Esri) maps with seamless switching
- **GPS Navigation** - Real-time location tracking with coordinate display and reverse geocoding
- **Distance Measurement** - Visual distance tool with markers and real-time feedback
- **Smart Search** - Norwegian place names, addresses, coordinates, and local POI search
- **12+ POI Categories** - Organized into 6 main groups:
  - **Aktivitet** (Activity): Swimming spots, beaches, fire pits, fishing spots, canoeing
  - **Naturperle** (Nature gems): Waterfalls, viewpoints
  - **Overnatte** (Accommodation): Camping, shelters, cabins, hammock spots
  - **På eventyr** (Adventure): Caves, war memorials, cultural heritage, observation towers
  - **Service**: Information, drinking water, rest areas, emergency shelters, toilets, parking
  - **Transport**: Bus stops, train stations, cable cars
- **Trail System** - Norwegian trail data (hiking, skiing, cycling) via Turrutebasen WMS layers
- **Nature Areas** - Naturskog overlay layers from Miljødirektoratet (forest and nature protection areas)
- **Mobile Optimized** - Touch-friendly controls, responsive design, keyboard navigation
- **Keyboard Shortcuts** - Efficient navigation with customizable hotkeys

## 🏗️ Technology

- **Stack**: React 19 + TypeScript, MapLibre GL JS, Zustand, Vite
- **Data Sources**:
  - **Base Maps**: Kartverket WMTS (topographic), Esri World Imagery (satellite)
  - **POIs**: OpenStreetMap via Overpass API, Geonorge WFS (emergency shelters)
  - **Transport**: Entur Geocoder API (bus stops, train stations)
  - **Trails**: Turrutebasen WMS (Norwegian National Trail Database)
  - **Nature Areas**: Miljødirektoratet WMS (Naturskog layers)
- **Browser Support**: Chrome/Edge 90+, Firefox 88+, Safari 14+, Mobile Safari iOS 14+
- **Architecture**:
  - **Entry Point**: `src/main.tsx` → `src/MapLibreTrakkeApp.tsx`
  - **State Management**: React Context + local state (no Redux/Zustand stores)
  - **Map Engine**: MapLibre GL JS with custom DOM overlay for POIs
  - **POI Rendering**: Custom positioned DOM elements (NOT GeoJSON rendering)
  - **Layer Management**: Lazy loading with automatic re-initialization on style changes

## 🚀 Quick Start

```bash
# Install and run
git clone https://github.com/elzacka/trakke-react.git
cd trakke-react
npm install
npm run dev
```

- **Development**: http://localhost:5173
- **Build**: `npm run build`
- **Deploy**: `npm run deploy`

## 🎮 Controls

### Desktop Navigation
- **Search**: `Ctrl+K` to open search panel (Norwegian place names, coordinates, addresses)
- **Sidebar**: `Ctrl+B` to toggle sidebar
- **Location**: `Ctrl+L` to toggle GPS tracking
- **Coordinates**: `Ctrl+click` on map to copy coordinates, or click coordinate display
- **Zoom**: Scroll wheel (normal), `Shift+scroll` (precise control - 4.5x finer increments)
- **Box Zoom**: `Shift+drag` to zoom to selected area
- **Rotate/Tilt**: `Ctrl+drag` to rotate and tilt the map
- **Distance**: Click ruler → click map points → click ruler to finish

### Mobile Gestures
- **Pan**: Single finger drag
- **Zoom**: Pinch in/out
- **Rotate**: Two-finger rotate
- **Coordinates**: Long press (500ms) on map to copy, coordinates update as finger moves
- **POI Details**: Tap markers to view information
- **Touch Targets**: Minimum 44px for all interactive elements

## 🔧 Configuration

**Environment** (`.env.local`):
```env
VITE_APP_TITLE=Tråkke
VITE_BASE_URL=/trakke-react/
```

**Map Services**: Configured in `src/components/MapLibreMap.tsx`

## 🎨 Design System

The application uses a cohesive Norwegian nature-inspired color palette:

### Primary Colors
- **Primary Green** (`#3e4533`): Interactive elements (location button, ruler, admin)
- **Link Color** (`#667154`): All hyperlinks
- **Category Colors**:
  - Purple (`#7c3aed`): På eventyr (Adventure)
  - Orange (`#b45309`): Overnatte (Accommodation)
  - Orange (`#ea580c`): Service facilities
  - Teal (`#0d9488`): Aktivitet (Activity)
  - Green (`#059669`): Naturperle (Nature gems)
  - Blue (`#0284c7`): Transport

### UI Components
- **Coordinate Display**: Click to copy coordinates, visual feedback on copy
- **Distance Measurement**: Integrated indicator matching coordinate display styling
- **Modals**: Uniform 340px (mobile) / 500px (desktop) with consistent padding
- **Bottom Alignment**: All bottom UI components at 24px from bottom

## 🤝 Contributing

### Development Workflow
1. Fork repository → create feature branch
2. **ALWAYS run before committing**:
   ```bash
   npm run lint        # Must pass with 0 errors (max 150 warnings)
   npm run build       # TypeScript build must succeed
   ```
3. Use the safe-commit helper script (recommended):
   ```bash
   ./scripts/safe-commit.sh "Your commit message"
   ```
4. Follow TypeScript + Norwegian terminology guidelines
5. Test on desktop and mobile before submitting PR

### Code Quality Requirements
- **ESLint**: Zero tolerance for errors, max 150 warnings
- **TypeScript**: All builds must pass type checking
- **Pre-commit Hook**: Automatically blocks commits with ESLint errors
- **Language**: All user-facing text in Norwegian (Bokmål)

### Adding POI Categories
1. Add fetch function to appropriate service (e.g., `src/services/overpassService.ts`)
2. Add transform function to `src/MapLibreTrakkeApp.tsx`
3. Add loading logic to main POI loading `useEffect`
4. Enable category in `src/components/HierarchicalCategoryFilter.tsx`
5. Verify POI type exists in `src/data/pois.ts`
6. Add data attribution to "Om kartet" modal

See `CLAUDE.md` for detailed implementation guidelines.

## 🏔️ Norwegian Heritage

Embraces **Allemansretten** (Right to Roam), **Friluftsliv** (outdoor life), DNT standards, and cultural heritage preservation.

## 📄 Attribution & License

- **Data**:
  - Base maps: © Kartverket (topographic), © Esri (satellite imagery)
  - POI data: © OpenStreetMap contributors, © DSB (emergency shelters)
  - Transport data: © Entur (Norwegian public transport)
  - Trail data: © Kartverket/Turrutebasen (Norwegian National Trail Database)
  - Nature areas: © Miljødirektoratet (Norwegian Environment Agency)
- **License**: MIT - see [LICENSE](LICENSE)

---

**🇳🇴 Built for Norway's outdoor community** - Discover hidden gems from swimming spots to war memorials, mountain peaks to wilderness shelters.

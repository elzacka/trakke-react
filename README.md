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

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development guidelines.

### Quick Start - Remote Development

**Option 1: GitHub Codespaces (Recommended)**
```bash
1. Click "Code" → "Codespaces" → "Create codespace on main"
2. Wait for environment to build (automatic npm install)
3. Run: npm run dev
4. Access dev server via forwarded port
```

**Option 2: Local Development**
```bash
git clone https://github.com/elzacka/trakke-react.git
cd trakke-react
npm install
npm run dev
```

### Development Workflow (Zero Local Setup Required)

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes** - Automatic quality checks on commit via Husky
   - ESLint auto-fixes on commit
   - Prettier formats code
   - Tests run automatically

3. **Push to GitHub** - Branch preview deploys automatically
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. **Test Your Feature**
   - Preview URL posted in PR comments
   - Scan QR code to test on iPhone
   - Test desktop in any browser

5. **Create Pull Request**
   - Automated quality checks run
   - Preview deployment updates on each push
   - Merge when all checks pass

### Quality Automation

✅ **Automated on every commit:**
- ESLint auto-fix
- Prettier formatting
- Type checking (via pre-commit hook)

✅ **Automated on every push:**
- Full test suite
- Build verification
- Preview deployment
- Quality check reports

✅ **Automated weekly:**
- Dependency updates via Dependabot

### Available Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run typecheck    # TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier
npm test             # Run tests in watch mode
npm run test:ui      # Open Vitest UI
npm run test:coverage # Run tests with coverage
```

### Claude Code Commands

If using Claude Code, custom slash commands are available:
- `/check` - Run all quality checks
- `/test` - Run tests with optional coverage
- `/fix` - Auto-fix linting and formatting
- `/review` - Comprehensive code review

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

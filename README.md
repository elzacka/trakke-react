# 🥾 Tråkke - Norwegian Outdoor Discovery Platform

[![Deploy to GitHub Pages](https://github.com/elzacka/trakke-react/actions/workflows/deploy.yml/badge.svg)](https://github.com/elzacka/trakke-react/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Tråkke** is a modern web application for exploring Norway's nature, cultural heritage, and outdoor adventures. Built with official Norwegian government data sources and open data for comprehensive, accurate coverage of trails, points of interest, and geographical information.

🌐 **Live App**: [https://elzacka.github.io/trakke-react/](https://elzacka.github.io/trakke-react/)

## ✨ Features

### 🗺️ Interactive Maps
- **Multiple Map Layers**
  - High-quality topographic maps from Kartverket (Norwegian Mapping Authority)
  - Satellite imagery from Esri World Imagery
  - Seamless switching between map types

- **Navigation & Tools**
  - Real-time GPS location tracking
  - Distance measurement tool with visual feedback
  - Coordinate display (decimal degrees, DMS format)
  - Reverse geocoding to identify locations
  - Keyboard shortcuts for efficient navigation

### 🎯 Points of Interest (POIs)

Organized into 7 main categories with Norwegian terminology:

- **🏃 Aktivitet** - Swimming spots, fire pits, fishing areas, canoeing locations
- **🌿 Naturperle** - Waterfalls, viewpoints, caves, natural landmarks
- **🏠 Overnatte** - Camping sites, shelters, cabins, wilderness huts
- **🗺️ På eventyr** - War memorials (WWII bunkers, monuments), observation towers, archaeological sites
- **🔧 Service** - Emergency shelters (Tilfluktsrom), information boards, toilets, parking
- **🚌 Transport** - Bus stops, cable cars, train stations
- **🥾 Turløype** - Hiking trails, ski tracks, cycling routes from official sources

### 🔍 Intelligent Search
- Norwegian place name search via Kartverket's official API
- Address lookup with fuzzy matching
- Coordinate parsing (multiple formats supported)
- Reverse geocoding
- Local POI search with Norwegian language support

### 📱 Responsive Design
- Fully optimized for desktop, tablet, and mobile devices
- Touch-friendly map controls and gestures
- Accessible UI with keyboard navigation support
- Unified design system across all screen sizes

## 🏗️ Technical Stack

### Core Technologies
- **React 19** with TypeScript for type-safe, modern component architecture
- **MapLibre GL JS** for high-performance vector and raster mapping
- **Zustand** for lightweight, scalable state management
- **Vite** for fast development and optimized production builds

### Data Sources

#### Official Norwegian Government APIs
- **Kartverket** - Topographic maps, place names, addresses, trail data
- **Geonorge** - Emergency shelters (DSB dataset), administrative boundaries
- **Turrutebasen** - Official hiking and skiing trail networks

#### Open Data
- **OpenStreetMap** (via Overpass API) - Community-contributed POI data
- **Esri World Imagery** - Satellite and aerial imagery

#### Cultural Institutions
- **Digitalt Museum** - Historical photographs of war memorials
- **Nasjonalbiblioteket** - National Library digital collections
- **Flickr** - Community-contributed historical photos

### Architecture

```
src/
├── components/              # React components
│   ├── MapLibreMap.tsx     # Main map with controls
│   ├── CategoryPanel.tsx   # POI category management
│   ├── SearchBox.tsx       # Search functionality
│   └── modal/              # Modal dialogs
├── data/
│   ├── pois.ts             # POI types and category definitions
│   └── symbols.ts          # Map symbols configuration
├── services/               # External API integrations
│   ├── overpassService.ts  # OpenStreetMap data
│   ├── searchService.ts    # Norwegian-optimized search
│   ├── kartverketTrailService.ts  # Official trail data
│   ├── tilfluktsromService.ts     # Emergency shelters
│   ├── distanceService.ts  # Distance calculations
│   └── krigsminneEnhancementService.ts  # Historical enrichment
├── state/                  # Zustand stores
│   ├── uiStore.ts         # UI state management
│   └── UIProvider.tsx     # State provider
└── features/              # Feature-specific components
    ├── shortcuts/         # Keyboard shortcuts modal
    └── legend/            # Map legend
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/elzacka/trakke-react.git
cd trakke-react

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

### Deploy to GitHub Pages

```bash
# Deploy to GitHub Pages
npm run deploy
```

## 🎮 User Guide

### Keyboard Shortcuts

**Desktop:**
- `Ctrl + K` - Open search
- `Ctrl + B` - Toggle sidebar
- `Esc` - Close modals/dialogs
- `↑` `↓` - Navigate search results
- `Enter` - Select search result
- `Tab` - Complete search

**Map Navigation:**
- Drag to pan
- Scroll wheel to zoom
- `Shift + drag` to zoom to area
- `Ctrl + drag` to tilt and rotate
- Double-click to zoom in
- Right-click to copy coordinates
- `Ctrl + click` to copy coordinates

**Mobile/Tablet:**
- Drag finger to pan
- Pinch to zoom
- Two fingers + rotate to rotate map
- Two fingers + swipe up/down to tilt
- Double-tap to zoom in
- Long press to copy coordinates

### Distance Measurement

1. Click the ruler button (turns teal when active)
2. Click points on the map to measure distances
3. Red markers appear with connecting lines
4. Distance labels show between each point
5. Click ruler button again to finish measurement
6. Use clear button to remove all measurements

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
VITE_APP_TITLE=Tråkke
VITE_BASE_URL=/trakke-react/
```

For production deployment on a different path, update `VITE_BASE_URL` accordingly.

### Map Services Configuration

Maps are configured in `src/components/MapLibreMap.tsx`:

- **Kartverket Topographic**: `https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png`
- **Esri Satellite**: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run linting: `npm run lint`
5. Build and test: `npm run build`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style Guidelines

- **TypeScript** with strict type checking enabled
- **ESLint** configuration with React hooks rules
- **Norwegian terminology** for POI categories and user-facing content
- **Component-scoped styling** using inline styles or CSS-in-JS
- **No comments** in code unless absolutely necessary for complex logic
- **Consistent naming**: camelCase for variables/functions, PascalCase for components

### Adding New POI Categories

1. Update `src/data/pois.ts` with new POI type definitions:
```typescript
export type POIType =
  | 'existing_type'
  | 'new_category_name'
```

2. Add Overpass API query in `src/services/overpassService.ts`:
```typescript
case 'new_category_name':
  return `
    node["tag"="value"](${bbox});
    way["tag"="value"](${bbox});
  `
```

3. Update category tree in `src/data/pois.ts` with Norwegian labels and icons

4. Add map symbols in `src/data/symbols.ts` if needed

### Testing Checklist

Before submitting a PR, verify:
- [ ] App builds without errors: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Features work on desktop and mobile
- [ ] No console errors in browser
- [ ] Map loads correctly (both topo and satellite)
- [ ] Search functionality works
- [ ] Distance measurement works
- [ ] Keyboard shortcuts work

## 📱 Browser Support

- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Mobile Safari**: iOS 14+
- **Chrome Mobile**: Android 90+

## 🏔️ About Norway's Outdoor Culture

Tråkke embraces Norway's outdoor heritage and values:

- **Allemansretten** (Right to Roam) - The traditional Norwegian right to access nature
- **Friluftsliv** - The Norwegian concept of outdoor life and nature connection
- **DNT** - Norwegian Trekking Association standards for trails and huts
- **Cultural Heritage** - Preserving and sharing WWII history and archaeological sites
- **Sustainable Tourism** - Promoting responsible outdoor recreation

## 🗺️ Data Attribution

### Map Data
- **Kartverket** - Topographic maps and official place names
- **© Kartverket** - [www.kartverket.no](https://www.kartverket.no)
- **© Esri** - Satellite imagery
- **© OpenStreetMap contributors** - Community POI data

### POI Data Sources
- **OpenStreetMap** - Licensed under [ODbL](https://www.openstreetmap.org/copyright)
- **Geonorge / DSB** - Emergency shelters dataset
- **Kartverket** - Official trail networks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kartverket** - For providing free access to official Norwegian mapping data
- **OpenStreetMap community** - For comprehensive, open POI coverage
- **MapLibre** - For excellent open-source mapping technology
- **Norwegian cultural institutions** - For historical data and imagery
- **Geonorge** - For providing access to official government datasets

## 🐛 Known Issues & Roadmap

### Planned Features
- Offline map support (PWA)
- Route planning and navigation
- User-contributed POIs
- Photo uploads and sharing
- Social features (favorite trails, ratings)
- Multi-language support (English, German)

### Performance Optimizations
- Lazy loading for POI categories
- Map tile caching
- Bundle size optimization

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/elzacka/trakke-react/issues)
- **Discussions**: [GitHub Discussions](https://github.com/elzacka/trakke-react/discussions)

---

**🇳🇴 Built for Norway's outdoor community**

*Tråkke combines official government data with open sources to help you discover Norway's hidden gems - from secret swimming spots to historical war memorials, mountain peaks to cozy wilderness shelters.*
# 🥾 Tråkke - Discover Norway with your hiking boots on

[![Deploy to GitHub Pages](https://github.com/elzacka/trakke-react/actions/workflows/deploy.yml/badge.svg)](https://github.com/elzacka/trakke-react/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Tråkke** is a Norwegian outdoor discovery web application that helps you explore Norway's stunning nature, cultural heritage sites, and outdoor adventures. Built with official Norwegian government data sources for authentic and comprehensive coverage.

🌐 **Live App**: [https://elzacka.github.io/trakke-react/](https://elzacka.github.io/trakke-react/)

## ✨ Features

### 🗺️ **Interactive Norwegian Maps**
- High-quality topographic maps from Kartverket (Norwegian Mapping Authority)
- Satellite imagery from Esri World Imagery
- Real-time location tracking and GPS positioning
- Distance measurement tools for planning hikes
- Custom map controls optimized for outdoor use

### 🎯 **Points of Interest (POIs)**
- **War Memorials (Krigsminne)** - WWII bunkers, memorials with historical photos and data
- **Natural Features** - Caves, waterfalls, observation towers, viewpoints
- **Outdoor Accommodation** - Shelters, cabins, camping spots, fire pits
- **Emergency Services** - Public emergency shelters (Tilfluktsrom)
- **Trail Networks** - Hiking, skiing, and cycling routes from official sources
- **Cultural Heritage** - Archaeological sites, protected buildings, monuments

### 🔍 **Intelligent Search**
- Norwegian place names via Kartverket's official API
- Address lookup with fuzzy matching
- Coordinate parsing (decimal degrees, DMS format)
- Reverse geocoding to show location names
- Local POI search with Norwegian language support

### 📱 **User Experience**
- Responsive design for desktop and mobile
- Keyboard shortcuts for power users (`Ctrl+K`, `Ctrl+B`, `Esc`)
- Hierarchical category system with Norwegian terminology
- Enhanced POI data with Wikipedia links and cultural context
- Real-time coordinate display with map scale

## 🏗️ Technical Stack

### Frontend
- **React 19** with TypeScript for modern component architecture
- **MapLibre GL** for high-performance vector and raster mapping
- **Zustand** for lightweight state management
- **Vite** for fast development and optimized builds
- **CSS-in-JS** for component-scoped styling

### Data Sources
- **OpenStreetMap** via Overpass API for comprehensive POI data
- **Kartverket** (Norwegian Mapping Authority) for maps, places, addresses, trails
- **Geonorge** WFS services for official government datasets
- **Norwegian Cultural Institutions** (Digitalt Museum, National Library, Flickr)

### Key Services
```
src/services/
├── overpassService.ts        # OpenStreetMap data fetching
├── searchService.ts          # Norwegian-optimized search
├── kartverketTrailService.ts # Official trail data
├── krigsminneEnhancementService.ts # Historical data enrichment
├── distanceService.ts        # Measurement calculations
└── poiDataService.ts         # POI data management
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
git clone https://github.com/elzacka/trakke-react.git
cd trakke-react
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view the app.

### Build for Production
```bash
npm run build
npm run preview
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

## 📂 Project Structure

```
src/
├── components/           # React components
│   ├── MapLibreMap.tsx  # Main map component
│   ├── CategoryPanel.tsx # POI category management
│   ├── SearchBox/       # Search functionality
│   └── modal/           # Modal dialogs
├── data/
│   ├── pois.ts          # POI data types and categories
│   └── symbols.ts       # Map symbols and icons
├── services/            # External API integrations
├── state/               # Zustand state management
└── features/            # Feature-specific components
```

## 🎯 Category System

The app organizes POIs into 7 main categories:

- **🏃 Aktivitet** - Swimming spots, fire pits, fishing areas, canoeing
- **🌿 Naturperle** - Waterfalls, viewpoints, natural gems
- **🏠 Overnatte** - Camping, shelters, huts, hammock spots
- **🗺️ På eventyr** - Caves, war memorials, observation towers
- **🔧 Service** - Information boards, toilets, parking, emergency shelters
- **🚌 Transport** - Bus stops, cable cars, train stations
- **🥾 Turløype** - Hiking trails, ski tracks, cycling routes

## 🌍 Data Sources & APIs

### Official Norwegian Government APIs
- **Kartverket APIs** - Place names, addresses, topographic data
- **Geonorge WFS** - Emergency shelters, administrative boundaries
- **Turrutebasen** - Official hiking and skiing trail networks

### Open Data Sources
- **OpenStreetMap** - Community-contributed POI data
- **Overpass API** - Real-time OSM data queries

### Cultural Institutions
- **Digitalt Museum** - Historical photographs and artifacts
- **Nasjonalbiblioteket** - National Library digital collections
- **Flickr** - Community-contributed historical photos

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for local development:
```
VITE_APP_TITLE=Tråkke
VITE_BASE_URL=/trakke-react/
```

### Map Configuration
The app uses official Norwegian map services:
- **Topographic**: Kartverket WMTS tiles
- **Satellite**: Esri World Imagery
- **Trails**: Kartverket WMS trail overlays

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- TypeScript with strict type checking
- ESLint configuration with React hooks rules
- Consistent naming conventions (Norwegian for POI categories)
- Component-scoped CSS-in-JS styling

### Adding New POI Categories
1. Update `src/data/pois.ts` with new POI types and category configurations
2. Add corresponding Overpass API queries in `src/services/overpassService.ts`
3. Update the category tree structure and translations

## 📱 Mobile Support

The app is fully responsive and optimized for mobile outdoor use:
- Touch-friendly map controls
- GPS location services
- Offline-capable Progressive Web App (PWA) features planned
- Battery-optimized rendering

## 🏔️ About Norway's Outdoor Culture

Tråkke embraces Norway's **allemansretten** (right to roam) and rich outdoor heritage:
- **Friluftsliv** - The Norwegian concept of outdoor life and connection with nature
- **DNT** - Norwegian Trekking Association trail standards and hut systems
- **Cultural Heritage** - WWII history, archaeological sites, traditional architecture
- **Sustainable Tourism** - Promoting responsible outdoor recreation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kartverket** - Norwegian Mapping Authority for official map data
- **OpenStreetMap** community for comprehensive POI coverage
- **Norwegian cultural institutions** for historical enrichment data
- **MapLibre** community for excellent open-source mapping tools

---

**🇳🇴 Made with ❤️ for Norway's outdoor community**

*Tråkke helps you discover the hidden gems of Norwegian nature and culture - from secret fishing spots to historical war memorials, all with official government data accuracy.*
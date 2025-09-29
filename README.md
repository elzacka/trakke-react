# 🥾 Tråkke - Norwegian Outdoor Discovery Platform

[![Deploy to GitHub Pages](https://github.com/elzacka/trakke-react/actions/workflows/deploy.yml/badge.svg)](https://github.com/elzacka/trakke-react/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Tråkke** is a modern web application for exploring Norway's nature, cultural heritage, and outdoor adventures. Built with official Norwegian government data sources and open data for comprehensive, accurate coverage of trails, points of interest, and geographical information.

🌐 **Live App**: [https://elzacka.github.io/trakke-react/](https://elzacka.github.io/trakke-react/)

## 📍 Current Status

**Fully Functional:**
- Interactive maps with GPS navigation and distance measurement
- 6 POI categories with real-time data from government sources
- Mobile-optimized interface with keyboard shortcuts

**In Development:**
- Trail system integration with Turrutebasen (Norwegian National Trail Database)
- Feature temporarily unavailable while resolving API connectivity

## ✨ Features

- **Interactive Maps** - Topographic (Kartverket) and satellite (Esri) maps with seamless switching
- **GPS Navigation** - Real-time location tracking with coordinate display and reverse geocoding
- **Distance Measurement** - Visual distance tool with markers and real-time feedback
- **Smart Search** - Norwegian place names, addresses, coordinates, and local POI search
- **6 POI Categories** - Aktivitet, Naturperle, Overnatte, På eventyr, Service, Transport
- **Trail System** - ⚠️ Temporarily unavailable (coming soon) - Norwegian trail data integration in development
- **Mobile Optimized** - Touch-friendly controls, responsive design, keyboard navigation
- **Keyboard Shortcuts** - Efficient navigation with customizable hotkeys

## 🏗️ Technology

- **Stack**: React 19 + TypeScript, MapLibre GL JS, Zustand, Vite
- **Data Sources**: Kartverket, Geonorge, OpenStreetMap, Esri, Norwegian cultural institutions
- **Browser Support**: Chrome/Edge 90+, Firefox 88+, Safari 14+, Mobile Safari iOS 14+

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

- **Desktop**: `Ctrl+K` search, `Ctrl+B` toggle sidebar, `Ctrl+click` copy coordinates
- **Mobile**: Long press to copy coordinates, pinch to zoom, two-finger rotate
- **Distance**: Click ruler button → click map points → click ruler again to finish

## 🔧 Configuration

**Environment** (`.env.local`):
```env
VITE_APP_TITLE=Tråkke
VITE_BASE_URL=/trakke-react/
```

**Map Services**: Configured in `src/components/MapLibreMap.tsx`

## 🤝 Contributing

1. Fork repository → create feature branch
2. Run `npm run lint` and `npm run build`
3. Follow TypeScript + Norwegian terminology guidelines
4. Test on desktop and mobile before PR

**Adding POI Categories**: Update `src/data/pois.ts` → add Overpass query in `src/services/overpassService.ts` → add Norwegian labels

## 🏔️ Norwegian Heritage

Embraces **Allemansretten** (Right to Roam), **Friluftsliv** (outdoor life), DNT standards, and cultural heritage preservation.

## 📄 Attribution & License

- **Data**: © Kartverket, © Esri, © OpenStreetMap contributors, Geonorge/DSB
- **License**: MIT - see [LICENSE](LICENSE)

---

**🇳🇴 Built for Norway's outdoor community** - Discover hidden gems from swimming spots to war memorials, mountain peaks to wilderness shelters.

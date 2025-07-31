# 🏔️ Tråkke

React-versjon av Tråkke - frilufts-app for å oppdage vandreturer, badesteder, severdigheter og mer i Norge.

## 🚀 Se appene live
- **[HTML-versjon (original)](https://elzacka.github.io/trakke/src/)** 
- **React-versjon**: Under utvikling 🚧

## ✨ Funksjoner
- ⚡ **React + TypeScript + Vite** - Moderne utviklingsstack
- 🗺️ **Interaktivt kart** med Leaflet
- 🎯 **Filtrerbare POI-kategorier** (vandring, bading, camping, fosser, utsiktspunkter, historie)
- 📱 **Responsive design** for mobil og desktop
- 🎨 **Material Symbols** for konsistente ikoner
- 🏔️ **Fokus på Bykle og Valle** kommuner

## 🛠️ Teknologi
- **Frontend**: React 19 + TypeScript + Vite
- **Kart**: Leaflet + React-Leaflet  
- **Ikoner**: Material Symbols Outlined
- **Styling**: CSS Modules
- **Deployment**: Vercel (planlagt)

## 🚀 Kom i gang

### Forutsetninger
- Node.js 18+ 
- npm eller yarn

### Installasjon
```bash
# Klon repository
git clone https://github.com/elzacka/trakke-react.git
cd trakke-react

# Installer dependencies
npm install

# Start utviklingsserver
npm run dev
```

### Bygg for produksjon
```bash
npm run build
npm run preview
```

## 📋 Utvikling

### Filstruktur
```
src/
├── components/
│   ├── Header/
│   ├── Map/
│   └── Sidebar/
├── data/
├── types/
└── styles/
```

### Scripts
- `npm run dev` - Start utviklingsserver
- `npm run build` - Bygg for produksjon  
- `npm run preview` - Forhåndsvis bygget app
- `npm run lint` - Kjør ESLint

## 🎯 Migrering fra HTML-versjon

Denne React-versjonen migrerer fra den [originale HTML-versjonen](https://github.com/elzacka/trakke) med følgende forbedringer:
- ⚡ Raskere utvikling med Vite
- 🧩 Modulær komponentstruktur
- 📱 Bedre responsivt design
- 🔧 TypeScript for type-sikkerhet
- 🚀 Optimalisert for deployment

## 📋 Planlagte funksjoner  
- [ ] **Turdata/turplanlegging**: UT.no (DNT) API
- [ ] **Kartlag**: Kartverket API 
- [ ] **Værdata**: YR.no API
- [ ] **Bilder**: Flickr API med geografisk søk
- [ ] **Utvide**: Oslo → Norge
- [ ] **App Store**: iPhone app
- [ ] **Offline modus**: Nedlastbare kart

## 🤝 Bidrag
Bidrag er velkomne! Åpne en issue eller send en pull request.

## 📄 Lisens
(Ikke aktivert lisens ennå) MIT License - se [LICENSE](LICENSE) fil for detaljer.

---

**Laget med ❤️ for friluftsliv i Setesdal**

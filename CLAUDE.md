# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**⚠️ DATE AWARENESS REMINDER**: Always check today's date and ensure all references to years, dates, and "current" information reflect the actual current date. Update version references, "Recent Features" sections, and any temporal language accordingly.

## 🗺️ Project Overview

Tråkke is a Norwegian outdoor recreation app built with React + TypeScript + Vite that displays Points of Interest (POIs) on interactive maps using official Norwegian map data from Kartverket. The app focuses on hiking, camping, cultural sites, and outdoor activities across Norway.

## 🛠️ Development Commands

- **Development**: `npm run dev` - Start development server on http://localhost:3000
- **Build**: `npm run build` - TypeScript compilation and production build
- **Lint**: `npm run lint` - ESLint checking with React and TypeScript rules
- **Deploy**: `npm run deploy` - Deploy to GitHub Pages using gh-pages

## 🔄 Daily Development Startup Protocol

### 📅 MANDATORY: Daily Context Check
**CRITICAL**: Before performing ANY task each day, Claude MUST:

1. **Verify Current Date**: Check today's date and ensure all references to years, dates, and 'current' information reflect the actual current date
2. **Read CLAUDE.md Completely**: Review this entire document for current setup, learned lessons, and avoid repeating mistakes
3. **Environment Status Check**: Verify single dev server, clean port usage, and optimal setup

### 📦 Dependencies & Updates Management

**Before starting development work:**

```bash
# Check for outdated packages
npm outdated

# Update dependencies (review changes first)
npm update

# Check Node.js version
node --version

# Check npm version
npm --version

# Verify Vite version
npx vite --version
```

**Monthly Dependency Audit:**
- Review package.json for unused dependencies
- Check for security vulnerabilities: `npm audit`
- Update major versions with careful testing
- Document breaking changes in this file

**Current Key Dependencies** (September 15, 2025):
- **Vite**: v7.0.6 - Core build tool with excellent performance
- **React**: v19.1.0 - Latest stable with improved performance
- **MapLibre GL JS**: v5.7.0 - Map rendering library, actively maintained
- **TypeScript**: v5.8.3 - Type safety with latest language features
- **ESLint**: v9.30.1 - Code quality enforcement

**Critical Dependencies to Monitor:**
- **Vite**: Core build tool - check for performance improvements
- **React & TypeScript**: Framework updates for new features/fixes
- **MapLibre GL JS**: Map rendering - crucial for map functionality
- **ESLint**: Code quality - may require config updates

### 🔄 Development Workflow Protocol

**MANDATORY Order for ALL Development Tasks:**

1. **Daily Startup** (each day before first task):
   - Read CLAUDE.md completely ✅
   - Verify current date context ✅
   - Check dependency updates ✅
   - Ensure clean dev environment ✅

2. **Pre-Development**:
   - Simply run: `npm run dev` (Vite handles port conflicts gracefully)
   - Only troubleshoot if actual errors occur

3. **During Development**:
   - Follow architectural safeguards (no GeoJSON, use API-based POI rendering)
   - Test changes incrementally
   - Monitor console for errors

4. **Pre-Commit Protocol**:
   ```bash
   # MANDATORY before any commit
   npm run lint      # Fix all linting issues
   npm run build     # Ensure production build works
   # Run app manually and verify core functionality
   ```

5. **Testing & Verification Requirements**:
   - **Unit Testing**: Claude performs technical testing of features
   - **Integration Testing**: Both Claude and user test together
   - **User Acceptance**: User MUST verify final functionality
   - **Performance Testing**: Check zoom, POI loading, map interactions

6. **Commit & Push Protocol**:
   - Never commit without explicit user approval
   - Include meaningful commit messages with 🤖 Generated with Claude Code footer
   - Update CLAUDE.md if new patterns/issues discovered

## 📋 Code Review & Maintenance Schedule

### 🗓️ Regular Review Cycles

**Weekly Code Review** (every Friday):
- Review architectural compliance (GeoJSON restrictions, POI rendering patterns)
- Check for code duplication or inefficiencies
- Verify ESLint/TypeScript compliance
- Update documentation for any new patterns

**Monthly Codebase Audit** (first Monday of month):
- Comprehensive dependency review and updates
- Performance audit (bundle size, load times)
- Security vulnerability scan: `npm audit`
- Remove dead code and unused imports
- Review and update CLAUDE.md accuracy

**Quarterly Architecture Review** (every 3 months):
- Evaluate technology stack relevance
- Review prohibited patterns (are they still necessary?)
- Plan major upgrades or refactoring
- Document architectural decisions and reasoning

### 📝 CLAUDE.md Maintenance Protocol

**Update CLAUDE.md Immediately When:**
- New development patterns are established
- Troubleshooting solutions are discovered
- Dependencies are updated with breaking changes
- New architectural constraints are needed
- Performance optimizations are implemented
- User workflow changes occur

**Monthly CLAUDE.md Review:**
- Verify all commands and examples still work
- Remove outdated information
- Add new lessons learned from recent development
- Reorganize for better clarity if needed
- Ensure version numbers and references are current

**CLAUDE.md Quality Checklist:**
- [ ] All bash commands tested and working
- [ ] Dependency versions reflect current setup
- [ ] No outdated URLs or references
- [ ] Troubleshooting steps are complete and accurate
- [ ] Development workflow is optimized for efficiency
- [ ] New team members could follow instructions successfully

### 🎯 Efficiency & Mistake Prevention

**Common Mistakes to Avoid** (update as discovered):
- **CRITICAL**: Being overly cautious with dev server management - just run `npm run dev` immediately when asked
- Committing without running lint/build checks
- Using prohibited patterns (GeoJSON layers)
- Forgetting to update zoom limits based on real-world services
- Not verifying current date context for time-sensitive information

## 📋 Map Configuration & Technical Specifications

### Official Kartverket WMTS Configuration (September 15, 2025)
**Status**: CURRENT - Using official Geonorge WMTS specifications (21 levels: 0-20)
**Last Updated**: September 15, 2025

**Correct WMTS Configuration**:
Based on official Kartverket documentation and GetCapabilities specifications:

```javascript
sources: {
  'kartverket-topo': {
    type: 'raster',
    tiles: [
      'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'
    ],
    tileSize: 256,
    attribution: '© Kartverket',
    minzoom: 0,
    maxzoom: 20 // Official Geonorge WMTS specification: 21 levels (0-20)
  }
}
```

**Map Zoom Limits**:
- **minZoom**: 3 (Norway-wide view)
- **maxZoom**: 19 (Conservative limit within official 0-20 range, avoiding grey tiles)
- **Source maxzoom**: 20 (Official Geonorge WMTS specification: 21 levels)
- **Layer maxzoom**: 20 (Match source specification)

**Service Migration (2024-2025)**:
- ❌ **Deprecated**: `opencache.statkart.no` (phased out)
- ✅ **Current**: `cache.kartverket.no/v1/wmts/` (official service)
- **GetCapabilities**: `https://cache.kartverket.no/v1/wmts/1.0.0/WMTSCapabilities.xml`

**Supported Coordinate Systems**:
- EPSG:3857 (WebMercator) - Used in this app
- EPSG:25832, 25833, 25835 (UTM zones) - Available but not used

**Scale Reference** (per official Geonorge specs):
- **Zoom 0**: 1:81,920,000 (Norway-wide overview)
- **Zoom levels 0-20**: 21 levels total, each halving previous resolution
- **Zoom 19**: ~15m scale (Current conservative app limit)
- **Zoom 20**: ~7.5m scale (Official max, very detailed)
- **norgeskart.no**: Uses full 0-20 range for maximum detail

**Efficiency Measures:**
- Use TodoWrite tool for complex multi-step tasks
- Batch related changes together
- Test incrementally rather than making large changes
- Keep browser dev tools open during development
- Monitor performance impact of changes

## 🚀 Development Environment Best Practices

### Development Server Management
**PERMANENT SOLUTION**: Reliable server startup (September 17, 2025)

**ROOT CAUSE IDENTIFIED**: `host: true` in Vite config caused binding issues on macOS
**SOLUTION IMPLEMENTED**: Explicit localhost binding with enhanced stability

1. **Primary startup**: `npm run dev` (configured with explicit localhost binding)
2. **Robust alternative**: `./dev-server.sh` (automated cleanup and diagnostics)
3. **Vite config optimized**:
   - `host: 'localhost'` (explicit binding prevents network issues)
   - `strictPort: false` (automatic port fallbacks)
   - `force: true` (dependency re-optimization)
   - Separate HMR port (3001) with explicit localhost binding
4. **Automatic fallbacks**: Vite uses ports 3000, 3001, 3002, etc. if conflicts occur

### Environment Maintenance
- **Clear Vite cache**: `rm -rf node_modules/.vite` - If experiencing build issues
- **Clean dist folder**: `rm -rf dist` - Remove previous build artifacts
- **Force restart**: `npm run dev -- --force` - Bypass cache on problematic restarts
- **Dependencies**: Keep `npm install` up to date for latest package versions

### Troubleshooting Development Server
**Permanent solution implemented - these should rarely be needed:**

```bash
# For automated diagnosis and cleanup
./dev-server.sh

# Manual troubleshooting (if needed)
lsof -i:3000                    # Check port usage
pkill -f "vite"                 # Kill Vite processes
rm -rf node_modules/.vite       # Clear cache
npm run dev                     # Restart
```

**Known Issues Resolved**:
- ✅ **"Dette nettstedet er ikke tilgjengelig"**: Fixed with localhost binding
- ✅ **Recurring server accessibility**: Solved with explicit host configuration
- ✅ **Port conflicts**: Handled with strictPort: false

### Performance Optimization
- Run only necessary browser tabs when developing
- Close unused development tools and processes
- Use single browser window for testing to reduce resource usage
- Monitor system resources if experiencing slow performance

## 🏗️ Architecture Overview

### Core Components Structure
- **`MapLibreTrakkeApp.tsx`** - Main application component containing all state management, POI loading logic, and API orchestration
- **`MapLibreMap.tsx`** - Map rendering component using MapLibre GL JS with Kartverket WMTS raster tiles (zoom limits: 3-19)
- **`CategoryPanel.tsx`** - Sidebar with hierarchical POI category filtering and modal access buttons
- **`SearchBox/`** - Norwegian place name search using Kartverket's official place name API
- **`HierarchicalCategoryFilter.tsx`** - Multi-level category tree with checkbox states
- **`Modal.tsx`** - Reusable modal component for legend and shortcuts
- **`features/legend/TegnforklaringModal.tsx`** - Comprehensive map legend with 79+ official Kartverket symbols
- **`features/shortcuts/HurtigtasterModal.tsx`** - Keyboard shortcuts help modal replacing deprecated ShortcutsPanel
- **`state/uiStore.ts` & `UIProvider.tsx`** - UI state management for modal controls

### Sidebar (Category Panel) Layout Specifications

**Structure & Hierarchy**:
- **Header**: Logo "Tråkke" with tagline "Oppdag Norge med turskoa på"
- **Category List**: Expandable/collapsible categories with consistent icon + label layout
- **Modal Access Buttons**: Hurtigtaster (keyboard icon) and Tegnforklaring (list icon) buttons

**Spacing & Visual Guidelines**:
- Tagline: Lighter text weight (`font-weight: 400`, `color: #6b7280`)
- Category groups: 16px vertical spacing between main categories
- Subcategories: +12px indent from parent level
- Expand/collapse indicators: 24x24px hitbox for touch accessibility
- Modal buttons: Background `#ffffff`, border `#e2e8f0`, hover effects with smooth transitions

- **Hurtigtaster**: Keyboard shortcuts modal (keyboard icon)
- **Tegnforklaring**: Map legend modal (list icon)
- Both buttons: 12px padding, icon + label layout, hover effects

### Data Architecture
- **POI Categories**: Defined in `src/data/pois.ts` with 7 main categories (Aktivitet, Naturperle, Overnatte, På eventyr, Service, Transport, Turløype)
- **Custom POI Rendering**: Uses custom DOM overlay markers (colored circles) for POI display; MapLibre markers only for position and search results
- **Color Coordination**: Each POI category has specific colors that must match between markers and UI elements
- **POI Transform Functions**: Located in `MapLibreTrakkeApp.tsx` - convert API data to internal POI format with correct colors
- **Map Legend Data**: Defined in `src/data/symbols.ts` with 79+ official Kartverket symbols, organized by categories and columns

### Tegnforklaring (Map Legend) System

**Implementation** (September 15, 2025):
- **`TegnforklaringModal.tsx`** - Complete legend modal with accurate symbol rendering
- **`src/data/symbols.ts`** - 79+ symbols with exact RGB values from official Kartverket PDF specifications
- **Symbol Categories**: 11 categories (bygninger_befolket_omrade, samferdsel, kraftlinje, industri_anlegg, arealbruk, administrative_grenser, hydrografi, kystlinje_terreng, vegetasjon, bebyggelse_tjenester, gjenstander)
- **Visual Types**: line, fill, point, symbol, mixed - each with proper styling and patterns

**Symbol Rendering System**:
- **Line symbols**: Various styles (solid, dashed, dotted), patterns (railway, parallel), custom widths
- **Fill symbols**: Background colors, border colors, pattern overlays (dots)
- **Point symbols**: Circle and square shapes, special patterns (rocks)
- **Symbol types**: Geometric shapes (square, circle, triangle) with color combinations
- **Mixed types**: Complex combinations for advanced cartographic symbols

**Official Color Accuracy**:
- RGB values extracted from "tegneregler_N5 Kartdata_spesifikasjon-skjermkartografi_compressed.pdf"
- Example: Tettbebyggelse [247, 190, 140], Roads [210, 35, 42], Administrative boundaries [180, 135, 255]
- Two-column layout matching official "Tegnforklaring_Kartverket.png" reference
- Norwegian terminology preserved exactly as in official documentation

**Modal Features**:
- Responsive grid (1 column mobile, 2 columns desktop)
- Category headers with proper styling and hierarchy
- Symbol visual rendering with 24x24px icons
- Proper spacing and typography matching app design system

### Service Layer
- **`overpassService.ts`** - OpenStreetMap Overpass API queries for POI data (war memorials, caves, towers, hunting stands)
- **`searchService.ts`** - Norwegian place name and address search using Kartverket's official APIs (replaced Nominatim)
- **`kartverketTrailService.ts`** - Norwegian trail data integration with Kartverket WMS services (IMPLEMENTED - see Trail Implementation Status below)

### Map Integration
- **Map Library**: MapLibre GL JS with official Kartverket WMTS raster tiles
- **Zoom Configuration**: minZoom: 3, maxZoom: 19 (within official Geonorge 0-20 range, conservative)
- **Tile Service**: `cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/` (official 2025 service)
- **Coordinate System**: Web Mercator (EPSG:3857)
- **POI Popups**: Custom HTML popups with close buttons (X), not default MapLibre popups
- **Interactive Features**: Click-to-copy coordinates, position/search markers, smooth animations

## 🚨 Critical Architecture Rules

The ESLint configuration enforces these architectural decisions:

### ✅ REQUIRED Patterns
- **Custom POI rendering**: Use custom DOM overlay markers (colored circles) for POI display; MapLibre markers only for position and search results
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
5. `MapLibreMap.tsx` receives POI array and creates custom DOM overlay markers (colored circles)
6. Each marker gets click handler for custom popup display

### POI Categories & Colors (Current 2025)
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
- **Color System**: Unified brand color (`#0d9488` teal green) with consistent palette across categories, POIs, and UI elements
- **Typography**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Animations**: Smooth transitions for sidebar, markers, and popups

### Visual Hierarchy & Spacing Guidelines

**Consistent Spacing Scale**:
- Use multiples of 4 or 8px for all spacing
- Touch targets minimum 44x44px (WCAG compliance)
- Category groups: 16px vertical spacing
- Subcategories: +12px indent from parent
- Map controls: 12px gaps between buttons

**Button Design System**:
- **Default State**: `rgba(255,255,255,0.9)` background, 8px border-radius
- **Hover/Active**: `scale(1.05)` transform, enhanced shadow
- **Size**: 44x44px for touch accessibility
- **Icon Color**: `#111827` with Material Symbols Outlined

**Typography Hierarchy**:
- **Logo**: Standard weight with tagline in lighter `#6b7280`
- **Categories**: Consistent icon + label layout
- **Coordinates**: 12px font size, monospace-style
- **Attribution**: 12px, subtle `#6b7280` color

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

### Map Controls Layout & Specifications

**Right-Side Control Cluster** (top to bottom):
1. **Compass** - Reset map to north orientation
2. **Location** - Center on user's position with loading states
3. **Zoom In** - Plus (+) symbol
4. **Zoom Out** - Minus (–) symbol
5. **Info Button** - Information ("i") symbol

**Layout Requirements**:
- All buttons: 44x44px (touch-friendly)
- Equal 12px vertical gaps between controls
- Aligned as single visual cluster with subtle shadow
- Border-radius: 8px for grouped appearance
- Position: Fixed right side of viewport

**Bottom Overlay Elements**:
- **Coordinates**: Bottom-left corner, always visible, click-to-copy functionality
- **Attribution**: Bottom-right corner, always visible ("© Kartverket | © OpenStreetMap-bidragsytere")
- **Scale Display**: Currently not implemented (removed from previous versions)

**Coordinate Display Behavior**:
- **Fixed Position**: Bottom-left corner (16px from edges)
- **Overlay Behavior**: When sidebar opens, coordinates overlay on top (higher z-index)
- **Visual Adaptation**:
  - On map: Semi-transparent background `rgba(255,255,255,0.8)`
  - Over sidebar: Solid white background with border
- **Font**: 12px, monospace-style for precision

## 📁 Current Project Structure (September 15, 2025)

```
src/
├── components/
│   ├── modal/
│   │   └── Modal.tsx              # Reusable modal component
│   ├── searchbox/
│   │   ├── SearchBox.tsx          # Search input component
│   │   └── index.tsx              # Exports
│   ├── CategoryPanel.tsx          # Sidebar with category filtering + modal buttons
│   ├── HierarchicalCategoryFilter.tsx  # Category tree component
│   └── MapLibreMap.tsx            # Main map component
├── data/
│   ├── pois.ts                    # POI categories and types
│   └── symbols.ts                 # Tegnforklaring symbols (79+ definitions)
├── features/
│   ├── legend/
│   │   └── TegnforklaringModal.tsx  # Comprehensive map legend modal
│   └── shortcuts/
│       ├── HurtigtasterModal.tsx   # Keyboard shortcuts modal
│       └── data.ts                 # Shortcuts data
├── services/
│   ├── kartverketTrailService.ts   # Future trail integration
│   ├── overpassService.ts          # OpenStreetMap POI queries
│   └── searchService.ts            # Norwegian place name search
├── state/
│   ├── UIProvider.tsx              # UI state provider
│   └── uiStore.ts                  # UI state management
└── MapLibreTrakkeApp.tsx          # Main app component
```

## 🔧 Configuration Notes

### Development Environment
- **Base URL**: Set to `./` for GitHub Pages deployment
- **Port**: Development server runs on 3000 with auto-open
- **Build**: TypeScript strict mode with Vite optimization
- **ESLint**: Custom rules prevent architectural regressions and unused variables
- **No testing framework**: Tests not currently implemented

### Environment Variables & API Keys
- **No API keys required**: Uses public Norwegian government APIs (Kartverket, Overpass)
- **CORS handling**: All APIs support cross-origin requests
- **Rate limiting**: Be mindful of API rate limits during development

### Performance Considerations
- **POI marker rendering**: Uses custom DOM overlay markers (colored circles) for POI display; MapLibre markers only for position and search results
- **API caching**: Search results and POI data should be cached to reduce API calls
- **Image optimization**: POI category icons use Material Symbols (font-based)
- **Bundle size**: Currently ~1.2MB gzipped (consider code splitting for future optimization)

### Accessibility Features
- **WCAG Compliance**: 44x44px minimum touch targets
- **Keyboard Navigation**: Full keyboard accessibility for search and controls
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: All text meets WCAG AA contrast requirements
- **Focus Management**: Visible focus indicators and logical tab order

## 🚀 Deployment

Built for GitHub Pages with `gh-pages` package. The `deploy` script builds and pushes the `dist` folder to the `gh-pages` branch. GitHub Actions automatically run lint and build checks on every push.

## 🧩 Recent Major Features (September 2025)

### Tegnforklaring (Map Legend) Implementation
- Complete legend modal with 79+ official Kartverket symbols using exact RGB values from PDF specifications
- Organized into 11 symbol categories with proper visual rendering (line, fill, point, symbol types)
- Two-column responsive layout matching official Kartverket reference materials
- Integrated with CategoryPanel via UI state management system

### Zoom Level & WMTS Configuration Updates
- Updated to match official Geonorge specifications: 21 zoom levels (0-20)
- Increased conservative maxZoom from 17 to 19 while avoiding grey tile regression
- Source and layer maxzoom updated to 20 to match official specification
- Documentation updated with proper scale references and Geonorge compliance

### UI State Management & Modal System
- Added UIProvider and uiStore for centralized modal state management
- Replaced deprecated ShortcutsPanel with modern HurtigtasterModal
- Created reusable Modal component for consistent modal behavior
- Integrated modal access buttons into CategoryPanel sidebar

### Search Enhancements
- Replaced Nominatim with Kartverket's official APIs for better Norwegian coverage
- Added address search capability alongside place name search
- Implemented search result markers that appear on map selection
- Enhanced search prioritization (places over addresses)
- Removed duplicate information and icons from search results

### UI/UX Design System & Color Scheme (September 2025)
- **Unified Brand Color**: Implemented consistent teal green (`#0d9488`) across:
  - Tråkke logo icon and app name for cohesive branding
  - Admin login button and all interactive states (hover, focus, active)
  - Coordinate copy confirmation feedback
  - Position button active state (maintains existing functionality)
- **Enhanced Modal Design**: AdminLoginModal resized and optimized for better visual balance
- **Consistent Button Interactions**: Standardized hover, focus, and active states across all components:
  - CategoryPanel buttons with proper accessibility focus rings
  - HierarchicalCategoryFilter expand/collapse buttons
  - Modal close buttons with unified interaction patterns
  - Enhanced keyboard navigation and screen reader support

### Previous UI/UX Improvements
- Added click-to-copy functionality for coordinate display
- Implemented position marker for location button clicks
- Fixed chevron toggle behavior for all sidebar interaction methods
- Enhanced keyboard navigation with progressive Ctrl+K behavior
- Improved mobile responsiveness and touch interactions

### Technical Improvements
- **TypeScript Enhancement**: Fixed `any` type warnings in MapLibre event handlers with proper type definitions
- **CI/CD Pipeline**: Achieved zero ESLint warnings for clean GitHub Actions builds
- Fixed MapLibre marker visibility issues (removed conflicting CSS)
- Corrected POI category colors (caves now properly purple in "På eventyr")
- Enhanced error handling and loading states
- Improved TypeScript export patterns for better build compatibility
- Comprehensive accessibility improvements with WCAG-compliant focus states

## 🥾 Trail Implementation Status (ON HOLD - September 15, 2025)

### ✅ **COMPLETED Implementation**:

**Technical Components**:
- **Trail Service**: `kartverketTrailService.ts` fully implemented with WMS integration
- **Map Layer System**: Trail layers dynamically added/removed in `MapLibreMap.tsx`
- **Category Integration**: Fotrute, Skiløype, Sykkelrute, Andre turruter connected to map display
- **Error Handling**: Comprehensive logging and graceful degradation for service issues

**Working Features**:
- ✅ Trail categories display in CategoryPanel sidebar
- ✅ Category selection/deselection triggers trail layer management
- ✅ Console logging shows trail layers being added: `🥾 Adding trail layers for types: ['hiking']`
- ✅ WMS sources and layers properly configured in MapLibre GL JS
- ✅ Build and lint passing without errors

### ❌ **BLOCKED by External Service Issue**:

**Root Cause**: Kartverket WMS services returning HTTP 500 Internal Server Error
- **Endpoint**: `https://wms.geonorge.no/skwms1/wms.friluftsruter`
- **Error**: All GetMap requests return 500 status
- **Known Issue**: WMS infrastructure updates at Kartverket (September 2025)
- **Impact**: Trail layers added to map but tiles don't load/display

**Console Error Pattern**:
```
wms.geonorge.no/skwms1/wms.friluftsruter?service=WMS&request=GetMap&version=1.3.0&layers=fotrute&...
Failed to load resource: the server responded with a status of 500 ()
```

### 🔧 **Implementation Details**:

**WMS Configuration**:
```javascript
// Working endpoint (returns 200 for GetCapabilities)
KARTVERKET_WMS_BASE = 'https://wms.geonorge.no/skwms1/wms.friluftsruter'

// Layer mappings
KARTVERKET_TRAIL_LAYERS = {
  hiking: 'fotrute',      // Fotrute - hiking trails
  skiing: 'skiloype',     // Skiløype - ski trails
  cycling: 'sykkelrute',  // Sykkelrute - bicycle routes
  all: 'friluftsruter'    // All trail types combined
}
```

**Trail Layer Management** (MapLibreMap.tsx:603-684):
- Dynamic layer addition based on `categoryState.checked`
- Proper source/layer cleanup when categories deselected
- Error monitoring and user feedback
- Semi-transparent overlay (opacity 0.8)

### 📋 **Next Steps for Resuming**:

1. **Monitor Service Recovery**:
   - Check `https://status.kartverket.no` for WMS service updates
   - Test endpoint: `curl -I "https://wms.geonorge.no/skwms1/wms.friluftsruter?request=GetCapabilities&service=WMS"`

2. **Alternative Approaches to Investigate**:
   - Research if Kartverket has released new WMS endpoints
   - Check for WFS (vector) alternatives to WMS (raster)
   - Investigate WMTS cache services for trail data
   - Consider using OpenStreetMap trail data as interim solution

3. **Testing When Service Restored**:
   - Select Turløype categories in sidebar
   - Verify trail overlays appear on map
   - Test all trail types (hiking, skiing, cycling)
   - Confirm performance and visual appearance

4. **Enhancement Opportunities**:
   - Add trail-specific popups with route information
   - Implement trail search functionality
   - Add trail difficulty indicators
   - Connect to trail metadata (length, elevation, etc.)

### 🎯 **Current User Experience**:
- Trail categories work perfectly in UI
- Users can select/deselect without errors
- Clear console messages about service status
- App remains stable and functional
- **Visual trails will appear automatically when WMS service is restored**

**Last Updated**: September 15, 2025 - Implementation complete, awaiting external service recovery.

## 🔧 Troubleshooting & Solutions Guide

This section documents proven solutions to recurring problems in the Trakke project.

### MapLibre Marker Visibility Issues

**Problem**: POI markers created but invisible on map, popups not working
**Symptoms**: Console logs show markers being created, but nothing appears on map
**Root Cause**: Aggressive CSS overrides hiding MapLibre marker content

**Investigation Method**:
1. Check browser DevTools for markers in DOM (they exist but invisible)
2. Inspect CSS computed styles on `.maplibregl-marker` elements
3. Look for conflicting CSS rules with `!important` declarations

**Solution**: In `MapLibreMap.tsx`, comment out aggressive CSS overrides:
```typescript
// PROBLEMATIC CODE (causes invisible markers):
// .maplibregl-marker {
//   background: none !important;
//   border: none !important;
//   cursor: pointer !important;
//   ...
// }

// WORKING CODE: Let MapLibre handle default marker styles
```

**Prevention**: Avoid CSS overrides on `.maplibregl-marker` class. Use specific marker element styling instead.

### TypeScript Export Issues (isolatedModules)

**Problem**: Build fails with "Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'"
**Symptoms**: `npm run build` fails, `npm run dev` works fine

**Investigation Method**:
1. Check build error message for specific file and export
2. Look for mixed type/value exports in index files

**Solution**: Separate type and value exports:
```typescript
// PROBLEMATIC:
export { SearchBox, SearchBoxRef } from './SearchBox'

// WORKING:
export { SearchBox } from './SearchBox'
export type { SearchBoxRef } from './SearchBox'
```

### TypeScript Any Types in CI/CD

**Problem**: GitHub Actions CI/CD fails with "Unexpected any. Specify a different type" ESLint warnings
**Symptoms**: Local development works, but remote builds fail with TypeScript/ESLint errors

**Investigation Method**:
1. Run `npm run lint` locally to reproduce the issue
2. Check specific line numbers mentioned in CI/CD error logs
3. Look for `any` types in MapLibre GL JS integrations

**Solution**: Replace `any` types with proper MapLibre type definitions:
```typescript
// PROBLEMATIC:
sources: {} as Record<string, any>,
layers: [] as any[]

// WORKING:
sources: {} as Record<string, maplibregl.SourceSpecification>,
layers: [] as maplibregl.LayerSpecification[]
```

**Prevention**: Always use proper type definitions from libraries, especially for MapLibre GL JS integrations.

### POI Category Color Mismatches

**Problem**: POI markers show wrong colors compared to category definitions
**Symptoms**: Visual inconsistency between sidebar categories and map markers

**Investigation Method**:
1. Check POI transform functions in `MapLibreTrakkeApp.tsx`
2. Verify category color assignments in `pois.ts`
3. Compare expected vs actual colors in browser

**Solution**: Ensure transform functions use correct category colors:
```typescript
// In transform functions, match category colors from pois.ts:
color: '#7c3aed' // Purple for "På eventyr" category (caves, war memorials)
color: '#059669' // Green for "Naturperle" category (waterfalls, viewpoints)
```

### Keyboard Shortcut State Management

**Problem**: Chevron icon doesn't flip when using keyboard shortcuts
**Symptoms**: Manual clicks work, Ctrl+K/Ctrl+B don't update UI state

**Investigation Method**:
1. Check if keyboard handlers update the same state as click handlers
2. Verify state is properly connected to UI components
3. Test all interaction methods (click, Ctrl+K, Ctrl+B)

**Solution**: Ensure all interaction methods use consistent state updates:
```typescript
// Progressive Ctrl+K behavior:
if (sidebarCollapsed) {
  setSidebarCollapsed(false) // Open
} else if (isSearchFocused) {
  setSidebarCollapsed(true)  // Close if search focused
} else {
  searchInputRef.current?.focusInput() // Focus if open
}
```

### Search API Integration Issues

**Problem**: Norwegian place names not found or poor search results
**Symptoms**: Empty results for valid Norwegian locations

**Investigation Method**:
1. Test API endpoints directly in browser/Postman
2. Check API response format and data structure
3. Verify query parameters and encoding

**Solution**: Use Kartverket's official APIs with proper parameters:
```typescript
// Primary: Place name search
const placeUrl = `https://ws.geonorge.no/stedsnavn/v1/navn?...`

// Secondary: Address search
const addressUrl = `https://ws.geonorge.no/adresser/v1/sok?...`

// Combine results and prioritize places over addresses
```

### Kartverket WMTS Configuration Issues

**Problem**: Grey tiles, checkerboard patterns, or complete map failure
**Symptoms**: Map doesn't load, shows grey squares, or displays mixed grey/map tiles

**Root Cause**: Incorrect WMTS endpoint, deprecated services, or invalid zoom limits

**Investigation Method**:
1. Verify official Kartverket service status at `status.kartverket.no`
2. Check GetCapabilities: `https://cache.kartverket.no/v1/wmts/1.0.0/WMTSCapabilities.xml`
3. Test tile URLs directly: `curl -I "https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/10/500/300.png"`
4. Monitor browser network tab for 404/CORS errors

**Solution**: Use official 2025 Kartverket WMTS configuration:
```javascript
// CORRECT Configuration (September 15, 2025)
sources: {
  'kartverket-topo': {
    type: 'raster',
    tiles: [
      'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'
    ],
    tileSize: 256,
    attribution: '© Kartverket',
    minzoom: 0,
    maxzoom: 20 // Official Geonorge specification: 21 levels (0-20)
  }
}

// Map limits (conservative within official range)
minZoom: 3, maxZoom: 19

// AVOID These Deprecated/Problematic URLs:
❌ opencache.statkart.no (phased out 2024)
❌ Custom headers that cause CORS issues
❌ Zoom limits beyond official 0-20 range
```

**Service Migration Notes**:
- Kartverket migrated from statkart.no to cache.kartverket.no in 2024
- opencache endpoints are deprecated and unreliable
- Always use the official v1 WMTS API path structure

### ESLint Unused Variables in CI/CD

**Problem**: GitHub Actions build fails with unused variable errors
**Symptoms**: Local development works, CI/CD pipeline fails

**Investigation Method**:
1. Run `npm run lint` locally to reproduce
2. Check which variables are flagged as unused
3. Determine if variables are actually needed or can be prefixed

**Solution**: Prefix unused variables with underscore:
```typescript
// Instead of: const mapRect = ...
const _mapRect = mapContainer.getBoundingClientRect()

// Or remove if truly unused
```

### General Debugging Approach

1. **Console Logging**: Add strategic console.logs to track data flow
2. **Browser DevTools**: Inspect DOM, CSS, and network requests
3. **Systematic Testing**: Test each interaction method separately
4. **Version Control**: Use git blame/history to find when issues were introduced
5. **Documentation**: Update CLAUDE.md after solving complex issues

## 🚧 Future Development Considerations

### Planned Enhancements
- **Trail Enhancement**: Complete trail system implemented but blocked by Kartverket WMS 500 errors (see Trail Implementation Status above)
- **Testing Framework**: Consider adding Jest + React Testing Library for component testing
- **Performance Optimization**: Code splitting for larger POI datasets
- **Offline Support**: PWA capabilities and service worker integration
- **Advanced Search**: Fuzzy search, search history, and search filters

### Technical Debt & Improvements
- **Bundle Optimization**: Current ~1.2MB could be reduced with dynamic imports
- **API Response Caching**: Implement proper caching for POI and search data
- **Error Boundaries**: Add React error boundaries for better error handling
- **Telemetry**: Consider adding privacy-friendly usage analytics
- **Internationalization**: Currently Norwegian-only, could expand to other languages

### Architecture Evolution
- **State Management**: Consider upgrading to Zustand or Redux Toolkit for complex state
- **Component Library**: Extract reusable components for design system consistency
- **API Layer**: Centralize API calls with proper error handling and retries
- **Type Safety**: Enhance TypeScript coverage and add runtime type validation
- Status
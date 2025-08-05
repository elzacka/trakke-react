# Task: Fix Leaflet Map Popup Functionality

## Problem Description
POI markers appear on the map after selecting categories, but **clicking on markers does not show popups**. The markers are clickable but no popup appears when clicked.

## Root Cause Analysis
The application is **mixing two incompatible Leaflet implementations**:

1. **Manual Leaflet API** in `src/WorkingTrakkeApp.tsx` (lines 200-350)
2. **React-Leaflet components** in `src/components/Map.tsx`

This creates **conflicting map instances** that interfere with popup functionality.

## Required Fix Strategy

### Option 1: Pure Manual Leaflet (Recommended)
1. **Remove all React-Leaflet dependencies** from the project
2. **Update `src/main.tsx`** to use only the working manual implementation
3. **Delete or rename** `src/components/Map.tsx` to avoid conflicts
4. **Focus all marker/popup logic** in `WorkingTrakkeApp.tsx`

### Option 2: Pure React-Leaflet 
1. **Remove manual Leaflet code** from `WorkingTrakkeApp.tsx`
2. **Fix React-Leaflet implementation** in `Map.tsx`
3. **Ensure single map instance** throughout the application

## Specific Technical Issues to Address

### 1. Popup Event Handling
```typescript
// WRONG: Mixed approach causes event conflicts
marker.on('click', (e) => {
  marker.openPopup() // Manual Leaflet
})
// While also having React-Leaflet <Popup> components

// CORRECT: Choose one approach consistently
```

### 2. Map Instance Conflicts
```typescript
// PROBLEM: Multiple map initializations
// WorkingTrakkeApp.tsx: L.map(mapRef.current)
// Map.tsx: <MapContainer>

// SOLUTION: Use only ONE map initialization method
```

### 3. Icon and Popup Creation
```typescript
// ISSUE: Mixing React components in HTML strings
const popupContent = `<div>${reactComponent}</div>` // Won't work

// FIX: Use plain HTML strings for manual Leaflet
const popupContent = `<div>Pure HTML content</div>`
```

## Implementation Steps

### Step 1: Choose Implementation Strategy
Decide between manual Leaflet or React-Leaflet and stick to it consistently.

### Step 2: Clean Up Conflicts
- Remove unused imports (`react-leaflet` if going manual)
- Ensure single map container reference
- Consolidate all marker logic in one place

### Step 3: Fix Popup Content
- Use plain HTML strings (no JSX) for manual Leaflet popups
- Ensure proper event propagation (`L.DomEvent.stopPropagation`)

### Step 4: Test Popup Functionality
```typescript
// Add debugging to verify popup binding
marker.on('click', function(e) {
  console.log('Marker clicked:', poi.name)
  this.openPopup()
  L.DomEvent.stopPropagation(e)
})

marker.on('popupopen', () => {
  console.log('Popup opened successfully')
})
```

## Files to Modify

### Priority 1 (Required):
- `src/main.tsx` - Choose single entry point
- `src/WorkingTrakkeApp.tsx` - Fix marker/popup logic
- `package.json` - Remove conflicting dependencies if needed

### Priority 2 (Conditional):
- `src/components/Map.tsx` - Delete if using manual Leaflet
- `src/App.css` - Ensure proper popup z-index styling

## Success Criteria
✅ Clicking POI markers opens popups with content  
✅ Console shows "Popup opened successfully" messages  
✅ No JavaScript errors in browser console  
✅ Only one Leaflet implementation used throughout app  

## Debug Commands
Add this to browser console for testing:
```javascript
// Test if markers are properly bound
setTimeout(() => {
  const markers = document.querySelectorAll('.poi-marker')
  console.log(`Found ${markers.length} markers`)
  if (markers.length > 0) {
    markers[0].click() // Should open popup
  }
}, 2000)
```

The core issue is **architectural inconsistency** - fix by choosing one Leaflet approach and implementing it completely.
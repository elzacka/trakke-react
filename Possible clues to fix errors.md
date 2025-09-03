Feilen skyldes kanskje ikke at API-et ikke svarer, men at koden  prøver å konvertere GeoJSON-data til POIs og feiler på geometri-typen.

I loggen står det mange ganger:

`pois.ts:793 ⚠️ Unsupported geometry type: LineString convertKrigsminnerGeoJSONToPOIs @ pois.ts:773`

Det betyr at funksjonen `convertKrigsminnerGeoJSONToPOIs` forventer `Point`-geometri (slik de fleste POI-er er), men i `krigsminner1.geojson` finnes det også `LineString` (f.eks. veier, stier eller minnelinjer). Når funksjonen møter en `LineString`, klarer den ikke å konvertere det, og da stopper lasting/visning.

🔧 **Løsninger?:**

1. **Filtrer bort LineString i koden**  
    Hvis du egentlig bare vil vise punkter (POI-er), kan du legge til en sjekk i `convertKrigsminnerGeoJSONToPOIs`:
    
    `function convertKrigsminnerGeoJSONToPOIs(feature: any) {   if (feature.geometry.type !== "Point") {     console.warn("Unsupported geometry type:", feature.geometry.type);     return null; // hopp over alt som ikke er punkt   }    return {     id: feature.properties.id,     name: feature.properties.name,     coordinates: feature.geometry.coordinates,     // ...andre felt du trenger   }; }`
    
    Og i `loadKrigsminnerPOIs`, filtrer bort `null`:
    
    `const pois = geojson.features   .map(convertKrigsminnerGeoJSONToPOIs)   .filter(poi => poi !== null);`
    
2. **Håndtere LineString eksplisitt**  
    Hvis du faktisk vil vise linjer (for eksempel historiske ruter eller grenser), må du legge til støtte i koden for `LineString` – typisk ved å tegne dem som `Polyline` eller `Path` i kartbiblioteket ditt (Leaflet, Mapbox GL, osv.).
    
3. **Tilpasse GeoJSON-kilden**  
    Hvis du har kontroll på `krigsminner1.geojson`, kan du rense den så den kun inneholder punkter, hvis det er det appen din skal vise.
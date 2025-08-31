/// <reference types="vite/client" />

// GeoJSON module declaration
declare module '*.geojson' {
  interface GeoJSONFeature {
    type: 'Feature'
    properties: Record<string, string | number | undefined>
    geometry: {
      type: 'Point' | 'Polygon' | 'MultiPolygon'
      coordinates: number[] | number[][] | number[][][]
    }
  }
  
  interface GeoJSONFeatureCollection {
    type: 'FeatureCollection'
    features: GeoJSONFeature[]
  }
  
  const content: GeoJSONFeatureCollection
  export default content
}

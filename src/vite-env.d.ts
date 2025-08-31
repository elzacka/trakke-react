/// <reference types="vite/client" />

// GeoJSON module declaration
declare module '*.geojson' {
  const content: any
  export default content
}

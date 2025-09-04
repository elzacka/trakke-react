import React, { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { POI, CategoryState, CategoryNode } from '../data/pois'
import { SearchResult } from '../services/searchService'

interface MapLibreMapProps {
  pois: POI[]
  categoryState: CategoryState
  categoryTree: CategoryNode[]
  onCategoryToggle: (nodeId: string) => void
  onExpandToggle: (nodeId: string) => void
  onViewportChange?: (bounds: { north: number; south: number; east: number; west: number; zoom: number }) => void
  searchResult?: SearchResult | null
}

export function MapLibreMap({
  pois,
  categoryState,
  categoryTree,
  onCategoryToggle,
  onExpandToggle,
  onViewportChange,
  searchResult
}: MapLibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    console.log('🗺️ Initializing MapLibre with Kartverket WMS tiles...')

    const map = new maplibregl.Map({
      container: mapContainer.current,
      // Kartverket WMS as raster source (reliable and official)
      style: {
        version: 8,
        sources: {
          'kartverket-topo': {
            type: 'raster',
            tiles: [
              'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png'
            ],
            tileSize: 256,
            attribution: '© Kartverket'
          }
        },
        layers: [
          {
            id: 'kartverket-topo',
            type: 'raster',
            source: 'kartverket-topo'
          }
        ]
      },
      // Start with center and zoom, then fit bounds after load
      center: [17.5, 64.5], // Center of Norway
      zoom: 4,
      bearing: 0, // Start north-up
      pitch: 0,
      // No maxBounds constraint to allow proper fitBounds behavior
      // Enable all interactions with centered zoom
      interactive: true,
      dragPan: true,
      dragRotate: true,
      scrollZoom: { around: 'center' }, // Always zoom to center
      boxZoom: true,
      doubleClickZoom: true,
      keyboard: true,
      touchZoomRotate: true
    })

    // Add navigation controls with compass enabled
    map.addControl(new maplibregl.NavigationControl({
      visualizePitch: true,
      showCompass: true,
      showZoom: true
    }), 'bottom-right')
    
    // Add geolocation control
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }),
      'bottom-right'
    )
    
    // Add native MapLibre scale control (accurate) with custom styling
    const scaleControl = new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    })
    map.addControl(scaleControl, 'bottom-left')

    map.on('load', () => {
      console.log('✅ MapLibre loaded with Kartverket WMS topographic tiles')
      
      // Fit bounds to show all of Norway after map is loaded
      map.fitBounds([
        [4.0, 57.8],   // Southwest corner (covers Lindesnes area)
        [31.5, 71.8]   // Northeast corner (covers all of Nordkapp/Finnmark)
      ], {
        padding: { top: 20, bottom: 40, left: 20, right: 20 }, // Minimal padding for maximum coverage
        duration: 1000
      })
      
      setMapLoaded(true)
      
      // Emit initial viewport bounds after fitting
      setTimeout(() => {
        if (onViewportChange) {
          const bounds = map.getBounds()
          onViewportChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
            zoom: map.getZoom()
          })
        }
      }, 1100)
    })

    map.on('error', (e) => {
      console.error('❌ MapLibre error:', e)
    })

    // Viewport change handlers
    const handleViewportChange = () => {
      if (onViewportChange) {
        const bounds = map.getBounds()
        onViewportChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          zoom: map.getZoom()
        })
      }
    }

    map.on('moveend', handleViewportChange)
    map.on('zoomend', handleViewportChange)

    // Track mouse coordinates and zoom for display
    map.on('mousemove', (e) => {
      setCoordinates({
        lat: e.lngLat.lat,
        lng: e.lngLat.lng
      })
    })

    // No custom zoom tracking needed - using native scale control

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Add POI layers when map is loaded and POIs are available
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || pois.length === 0) return

    const map = mapRef.current
    console.log(`🎯 Adding ${pois.length} POIs to map`)

    // Create GeoJSON source from POIs
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: pois.map(poi => ({
        type: 'Feature' as const,
        properties: {
          id: poi.id,
          name: poi.name,
          description: poi.description,
          type: poi.type
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [poi.lng, poi.lat]
        }
      }))
    }

    // Add POI source
    if (map.getSource('pois')) {
      (map.getSource('pois') as maplibregl.GeoJSONSource).setData(geojsonData)
    } else {
      map.addSource('pois', {
        type: 'geojson',
        data: geojsonData
      })

      // Add POI layer
      map.addLayer({
        id: 'poi-points',
        type: 'circle',
        source: 'pois',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6, 4,    // Small at country level
            10, 8,   // Medium at regional level
            14, 12   // Large at local level
          ],
          'circle-color': '#2563eb',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })

      // Add POI labels
      map.addLayer({
        id: 'poi-labels',
        type: 'symbol',
        source: 'pois',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 10,
            14, 14
          ],
          'text-offset': [0, 2],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#374151',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      })

      // Add click handlers for POIs
      map.on('click', 'poi-points', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0]
          const { name, description, type } = feature.properties || {}
          
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 6px 0; color: #2c5530; font-size: 15px;">
                  ${name || 'Ukjent sted'}
                </h3>
                <p style="margin: 0 0 6px 0; color: #555; font-size: 13px;">
                  ${description || 'Ingen beskrivelse tilgjengelig'}
                </p>
                <div style="color: #777; font-size: 11px;">
                  Type: ${type}
                </div>
              </div>
            `)
            .addTo(map)
        }
      })

      // Change cursor on hover
      map.on('mouseenter', 'poi-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'poi-points', () => {
        map.getCanvas().style.cursor = ''
      })
    }
  }, [mapLoaded, pois])

  // Handle search result centering
  useEffect(() => {
    if (!mapRef.current || !searchResult) return

    const map = mapRef.current
    console.log(`🔍 Centering map on search result: ${searchResult.name} at [${searchResult.lng}, ${searchResult.lat}]`)
    
    // Center map on search result with appropriate zoom
    map.easeTo({
      center: [searchResult.lng, searchResult.lat],
      zoom: 12, // Zoom in to show local details
      duration: 1000 // Smooth animation
    })
  }, [searchResult])

  return (
    <div className="map-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Loading indicator */}
      {!mapLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666',
          textAlign: 'center'
        }}>
          <div>Kobler til Kartverket...</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#888' }}>
            Laster norske vektorkart
          </div>
        </div>
      )}
      
      {/* Coordinate display positioned next to native scale control */}
      {coordinates && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '120px', // Position after the native scale control
          padding: '2px 6px',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '3px',
          fontSize: '11px',
          color: 'rgba(0, 0, 0, 0.8)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: '400',
          border: 'none',
          boxShadow: 'none',
          zIndex: 1000,
          backdropFilter: 'blur(2px)'
        }}>
          {coordinates.lat.toFixed(5)}°N, {coordinates.lng.toFixed(5)}°E
        </div>
      )}
    </div>
  )
}
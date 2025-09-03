import React, { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { POI, CategoryState, CategoryNode } from '../data/pois'

interface MapLibreMapProps {
  pois: POI[]
  categoryState: CategoryState
  categoryTree: CategoryNode[]
  onCategoryToggle: (nodeId: string) => void
  onExpandToggle: (nodeId: string) => void
  onViewportChange?: (bounds: { north: number; south: number; east: number; west: number; zoom: number }) => void
}

export function MapLibreMap({
  pois,
  categoryState,
  categoryTree,
  onCategoryToggle,
  onExpandToggle,
  onViewportChange
}: MapLibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    console.log('🗺️ Initializing MapLibre with OpenStreetMap raster tiles...')

    const map = new maplibregl.Map({
      container: mapContainer.current,
      // Reliable OpenStreetMap style with Norwegian focus
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      // Center on Norway
      center: [11.0, 64.5], // Central Norway
      zoom: 6,
      // Constrain to Norway region
      maxBounds: [
        [4.0, 57.5],   // Southwest (Lindesnes area)
        [31.5, 71.5]   // Northeast (Nordkapp and Finnmark)
      ]
    })

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right')
    
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

    map.on('load', () => {
      console.log('✅ MapLibre loaded with OpenStreetMap raster tiles')
      setMapLoaded(true)
      
      // Emit initial viewport bounds
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
          color: '#666'
        }}>
          Laster norsk topografisk kart...
        </div>
      )}
    </div>
  )
}
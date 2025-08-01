// src/components/Map.tsx - Kart med søkemarkør-funksjonalitet
import React, { useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import * as L from 'leaflet'
import { POI, categoryConfig } from '../data/pois'
import { SearchResult } from '../services/searchService'
import { MapRef } from '../App'
import './Map.css'

interface MapProps {
  pois: POI[]
  sidebarCollapsed: boolean
  loading: boolean
}

// Custom hook for handling map resize when sidebar toggles
function MapResizer({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 300) // Match sidebar transition duration
    
    return () => clearTimeout(timer)
  }, [sidebarCollapsed, map])
  
  return null
}

// Hook for controlling map from outside
function MapController({ 
  onMapReady, 
  searchResult, 
  clearSearchResult 
}: { 
  onMapReady: (map: L.Map) => void
  searchResult: SearchResult | null
  clearSearchResult: () => void
}) {
  const map = useMap()
  const [searchMarker, setSearchMarker] = useState<L.Marker | null>(null)

  useEffect(() => {
    onMapReady(map)
  }, [map, onMapReady])

  useEffect(() => {
    if (searchResult) {
      // Fjern forrige søkemarkør
      if (searchMarker) {
        map.removeLayer(searchMarker)
      }

      // Opprett ny søkemarkør
      const marker = L.marker([searchResult.lat, searchResult.lng], {
        icon: createSearchIcon(searchResult.type)
      }).addTo(map)

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #2c5530; display: flex; align-items: center; gap: 5px;">
            <span style="font-family: 'Material Symbols Outlined'; fontSize: '18px';">search</span>
            ${searchResult.displayName}
          </h3>
          ${searchResult.description ? `<p style="margin: 4px 0;">${searchResult.description}</p>` : ''}
          <p style="margin: 4px 0; font-size: 0.9rem;">
            <strong>Koordinater:</strong> ${searchResult.lat.toFixed(5)}, ${searchResult.lng.toFixed(5)}
          </p>
          <p style="margin: 4px 0; font-size: 0.9rem;">
            <strong>Type:</strong> ${getSearchTypeDisplayName(searchResult.type)}
          </p>
          ${searchResult.source ? `<p style="margin: 4px 0; font-size: 0.8rem; color: #666;">Kilde: ${searchResult.source.toUpperCase()}</p>` : ''}
        </div>
      `)

      // Åpne popup umiddelbart
      marker.openPopup()

      setSearchMarker(marker)

      // Auto-fjern markør etter 30 sekunder
      const timer = setTimeout(() => {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker)
          setSearchMarker(null)
          clearSearchResult()
        }
      }, 30000)

      return () => clearTimeout(timer)
    }
  }, [searchResult, map, searchMarker, clearSearchResult])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchMarker && map.hasLayer(searchMarker)) {
        map.removeLayer(searchMarker)
      }
    }
  }, [searchMarker, map])

  return null
}

// Create custom icons matching the HTML version
const createCustomIcon = (type: string) => {
  const config = categoryConfig[type as keyof typeof categoryConfig]
  if (!config) {
    return L.divIcon({
      html: `
        <div style="
          background-color: #666;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ">
          ?
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
  }

  return L.divIcon({
    html: `
      <div style="
        background-color: ${config.color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        font-family: 'Material Symbols Outlined';
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      ">
        ${config.icon}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

// Create search result icon
const createSearchIcon = (type: string) => {
  const colors = {
    coordinates: '#E91E63',
    poi: '#2c5530', 
    place: '#FF9800',
    address: '#2196F3'
  }

  const icons = {
    coordinates: 'my_location',
    poi: 'place',
    place: 'location_city', 
    address: 'home'
  }

  return L.divIcon({
    html: `
      <div style="
        background-color: ${colors[type as keyof typeof colors] || '#666'};
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        font-family: 'Material Symbols Outlined';
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        animation: pulse 2s infinite;
      ">
        ${icons[type as keyof typeof icons] || 'search'}
      </div>
    `,
    className: 'custom-div-icon search-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 17],
  })
}

const getSearchTypeDisplayName = (type: string): string => {
  const typeNames = {
    coordinates: 'Koordinater',
    poi: 'POI',
    place: 'Sted',
    address: 'Adresse'
  }
  return typeNames[type as keyof typeof typeNames] || 'Ukjent'
}

export const Map = forwardRef<MapRef, MapProps>(({ pois, sidebarCollapsed, loading }, ref) => {
  const [map, setMap] = useState<L.Map | null>(null)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number, zoom = 15) => {
      if (map) {
        map.flyTo([lat, lng], zoom, {
          duration: 1.5,
          easeLinearity: 0.25
        })
      }
    },
    addSearchMarker: (result: SearchResult) => {
      setSearchResult(result)
    },
    clearSearchMarker: () => {
      setSearchResult(null)
    }
  }), [map])

  return (
    <div className="map-container">
      <MapContainer
        center={[59.4, 7.4]}
        zoom={10}
        className="leaflet-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />
        
        <MapResizer sidebarCollapsed={sidebarCollapsed} />
        
        <MapController 
          onMapReady={setMap}
          searchResult={searchResult}
          clearSearchResult={() => setSearchResult(null)}
        />
        
        {!loading && pois.map(poi => {
          const config = categoryConfig[poi.type]
          
          return (
            <Marker 
              key={poi.id} 
              position={[poi.lat, poi.lng]}
              icon={createCustomIcon(poi.type)}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span style={{ 
                      fontFamily: 'Material Symbols Outlined',
                      fontSize: '20px'
                    }}>
                      {config.icon}
                    </span>
                    {poi.name}
                  </h3>
                  <p style={{ margin: '5px 0' }}>{poi.description}</p>
                  
                  {poi.metadata && Object.entries(poi.metadata).map(([key, value]) => (
                    <p key={key} style={{ margin: '3px 0', fontSize: '0.9rem' }}>
                      <strong>{key}:</strong> {String(value)}
                    </p>
                  ))}
                  
                  {poi.api_source && (
                    <p style={{ margin: '3px 0', fontSize: '0.8rem', color: '#666' }}>
                      Kilde: {poi.api_source.toUpperCase()}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
        
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '1rem',
            borderRadius: '8px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '20px' }}>
              refresh
            </span>
            Laster kartdata...
          </div>
        )}
      </MapContainer>
    </div>
  )
})
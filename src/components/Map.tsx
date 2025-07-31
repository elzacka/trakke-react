import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import * as L from 'leaflet'
import { POI, categoryConfig } from '../data/pois'
import './Map.css'

interface MapProps {
  pois: POI[]
  sidebarCollapsed: boolean
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

export function Map({ pois, sidebarCollapsed }: MapProps) {
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
        
        {pois.map(poi => {
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
                      <strong>{key}:</strong> {value}
                    </p>
                  ))}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

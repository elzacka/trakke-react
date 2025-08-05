// src/WeatherTestApp.tsx - Test app for weather integration

import React, { useState, useEffect } from 'react'
import { usePOIDataWithWeather } from './hooks/usePOIDataWithWeather'
import { WeatherIcon } from './components/Weather/WeatherIcon'
import { Map } from './components/Map'
import './App.css'

export function WeatherTestApp() {
  const [weatherEnabled, setWeatherEnabled] = useState(true)
  const [_sidebarCollapsed, _setSidebarCollapsed] = useState(false)
  
  const {
    pois,
    loading,
    weatherLoading,
    error,
    weatherError,
    lastUpdated,
    weatherLastUpdated,
    poisWithWeather,
    hasWeatherData,
    refreshData,
    refreshWeatherData,
    getGoodWeatherPOIs
  } = usePOIDataWithWeather(weatherEnabled)

  const goodWeatherPOIs = getGoodWeatherPOIs()

  useEffect(() => {
    console.log('🏔️ Tråkke Weather Test App loaded')
    console.log(`📍 ${pois.length} POIs loaded`)
    console.log(`🌤️ ${poisWithWeather} POIs with weather data`)
  }, [pois.length, poisWithWeather])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🏔️ Tråkke - Weather Integration Test</h1>
          <div className="header-controls">
            <button
              onClick={() => setWeatherEnabled(!weatherEnabled)}
              className={`toggle-btn ${weatherEnabled ? 'active' : ''}`}
            >
              {weatherEnabled ? '🌤️ Vær På' : '☁️ Vær Av'}
            </button>
            <button onClick={refreshData} disabled={loading}>
              {loading ? '⏳ Laster...' : '🔄 Oppdater Alt'}
            </button>
            <button onClick={refreshWeatherData} disabled={weatherLoading || !hasWeatherData}>
              {weatherLoading ? '⏳ Laster vær...' : '🌤️ Oppdater Vær'}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>📊 Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">POI-er:</span>
                <span className="status-value">{pois.length}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Med værdata:</span>
                <span className="status-value">{poisWithWeather}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Bra vær:</span>
                <span className="status-value">{goodWeatherPOIs.length}</span>
              </div>
            </div>
          </div>

          {lastUpdated && (
            <div className="sidebar-section">
              <h4>🕒 Sist oppdatert</h4>
              <p>POI-er: {lastUpdated.toLocaleTimeString('nb-NO')}</p>
              {weatherLastUpdated && (
                <p>Vær: {weatherLastUpdated.toLocaleTimeString('nb-NO')}</p>
              )}
            </div>
          )}

          {(loading || weatherLoading) && (
            <div className="sidebar-section">
              <div className="loading-indicator">
                {loading && <p>⏳ Laster POI-data...</p>}
                {weatherLoading && <p>🌤️ Laster værdata...</p>}
              </div>
            </div>
          )}

          {(error || weatherError) && (
            <div className="sidebar-section error">
              <h4>⚠️ Feil</h4>
              {error && <p>POI: {error}</p>}
              {weatherError && <p>Vær: {weatherError}</p>}
            </div>
          )}

          {goodWeatherPOIs.length > 0 && (
            <div className="sidebar-section">
              <h4>☀️ Bra vær nå</h4>
              <div className="good-weather-list">
                {goodWeatherPOIs.slice(0, 5).map(poi => (
                  <div key={poi.id} className="good-weather-item">
                    <div className="poi-info">
                      <span className="poi-name">{poi.name}</span>
                      <span className="poi-type">{poi.type}</span>
                    </div>
                    {poi.weather && (
                      <div className="weather-info">
                        <WeatherIcon 
                          symbolCode={poi.weather.symbolCode} 
                          size="small" 
                        />
                        <span>{poi.weather.temperature}°</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <h4>🧪 Test Console</h4>
            <p>Åpne utviklerverktøy og kjør:</p>
            <code>runWeatherTests()</code>
          </div>
        </div>

        <div className="map-container">
          <Map 
            pois={pois}
            sidebarCollapsed={false}
            loading={loading}
          />
        </div>
      </main>
    </div>
  )
}

export default WeatherTestApp
// src/components/Weather/WeatherSummary.tsx - Weather summary display component

import React from 'react'
import { WeatherSummary as WeatherSummaryType } from '../../types/weather'
import { WeatherIcon } from './WeatherIcon'
import './WeatherSummary.css'

interface WeatherSummaryProps {
  weather: WeatherSummaryType
  compact?: boolean
  showRecommendation?: boolean
  className?: string
}

export const WeatherSummary: React.FC<WeatherSummaryProps> = ({ 
  weather,
  compact = false,
  showRecommendation = false,
  className = ''
}) => {
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('nb-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return ''
    }
  }

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SW', 'W', 'NW']
    return directions[Math.round(degrees / 45) % 8]
  }

  if (compact) {
    return (
      <div className={`weather-summary weather-summary--compact ${className}`}>
        <WeatherIcon symbolCode={weather.symbolCode} size="small" />
        <span className="weather-temperature">{weather.temperature}°</span>
        {weather.precipitation > 0 && (
          <span className="weather-precipitation">
            <span className="material-symbols-outlined">water_drop</span>
            {weather.precipitation}mm
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`weather-summary ${className}`}>
      <div className="weather-summary__header">
        <WeatherIcon symbolCode={weather.symbolCode} size="large" />
        <div className="weather-summary__main">
          <div className="weather-temperature--large">{weather.temperature}°C</div>
          <div className="weather-description">{weather.description}</div>
          {formatTime(weather.time) && (
            <div className="weather-time">{formatTime(weather.time)}</div>
          )}
        </div>
      </div>

      <div className="weather-summary__details">
        {weather.precipitation > 0 && (
          <div className="weather-detail">
            <span className="material-symbols-outlined">water_drop</span>
            <span>Nedbør: {weather.precipitation}mm</span>
          </div>
        )}
        
        <div className="weather-detail">
          <span className="material-symbols-outlined">air</span>
          <span>Vind: {weather.windSpeed} km/t {getWindDirection(weather.windDirection)}</span>
        </div>
        
        <div className="weather-detail">
          <span className="material-symbols-outlined">humidity_percentage</span>
          <span>Luftfuktighet: {weather.humidity}%</span>
        </div>
      </div>

      {showRecommendation && (
        <div className="weather-summary__recommendation">
          <div className="weather-recommendation">
            <span className="material-symbols-outlined">lightbulb</span>
            <span>Anbefaling for utendørsaktiviteter kommer snart</span>
          </div>
        </div>
      )}
    </div>
  )
}
// src/components/Weather/WeatherIcon.tsx - Weather icon component

import React from 'react'
import { WEATHER_SYMBOLS, DEFAULT_WEATHER_SYMBOL } from '../../types/weather'
import './WeatherIcon.css'

interface WeatherIconProps {
  symbolCode: string
  size?: 'small' | 'medium' | 'large'
  showMaterialIcon?: boolean
  className?: string
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ 
  symbolCode, 
  size = 'medium',
  showMaterialIcon = false,
  className = ''
}) => {
  const symbol = WEATHER_SYMBOLS[symbolCode] || DEFAULT_WEATHER_SYMBOL

  if (showMaterialIcon) {
    return (
      <span 
        className={`weather-icon material-symbols-outlined weather-icon--${size} ${className}`}
        title={symbol.description}
      >
        {symbol.materialIcon}
      </span>
    )
  }

  return (
    <span 
      className={`weather-icon weather-emoji weather-icon--${size} ${className}`}
      title={symbol.description}
      role="img" 
      aria-label={symbol.description}
    >
      {symbol.icon}
    </span>
  )
}
// src/types/weather.ts - Weather data types for YR.no API integration

export interface WeatherData {
  location: {
    lat: number
    lng: number
    altitude?: number
  }
  current?: WeatherTimeseries
  forecast: WeatherTimeseries[]
  lastUpdated: string
  source: 'yr_no'
}

export interface WeatherTimeseries {
  time: string
  data: {
    instant: {
      details: WeatherDetails
    }
    next_1_hours?: {
      summary: {
        symbol_code: string
      }
      details: {
        precipitation_amount: number
      }
    }
    next_6_hours?: {
      summary: {
        symbol_code: string
      }
      details: {
        precipitation_amount: number
      }
    }
  }
}

export interface WeatherDetails {
  air_pressure_at_sea_level: number
  air_temperature: number
  cloud_area_fraction: number
  relative_humidity: number
  wind_from_direction: number
  wind_speed: number
  wind_speed_of_gust?: number
}

// Simplified weather summary for UI display
export interface WeatherSummary {
  temperature: number
  symbol: string
  symbolCode: string
  precipitation: number
  windSpeed: number
  windDirection: number
  humidity: number
  description: string
  time: string
}

// Weather symbol mapping for Norwegian descriptions
export const WEATHER_SYMBOLS: Record<string, { 
  icon: string, 
  description: string,
  materialIcon: string 
}> = {
  'clearsky_day': { 
    icon: '☀️', 
    description: 'Klarvær', 
    materialIcon: 'wb_sunny' 
  },
  'clearsky_night': { 
    icon: '🌙', 
    description: 'Klarvær', 
    materialIcon: 'nightlight' 
  },
  'fair_day': { 
    icon: '🌤️', 
    description: 'Lettskyet', 
    materialIcon: 'wb_sunny' 
  },
  'fair_night': { 
    icon: '☁️', 
    description: 'Lettskyet', 
    materialIcon: 'cloud' 
  },
  'partlycloudy_day': { 
    icon: '⛅', 
    description: 'Delvis skyet', 
    materialIcon: 'partly_cloudy_day' 
  },
  'partlycloudy_night': { 
    icon: '☁️', 
    description: 'Delvis skyet', 
    materialIcon: 'partly_cloudy_night' 
  },
  'cloudy': { 
    icon: '☁️', 
    description: 'Skyet', 
    materialIcon: 'cloud' 
  },
  'lightrainshowers_day': { 
    icon: '🌦️', 
    description: 'Lette regnbyger', 
    materialIcon: 'light_mode' 
  },
  'lightrainshowers_night': { 
    icon: '🌧️', 
    description: 'Lette regnbyger', 
    materialIcon: 'rainy' 
  },
  'rainshowers_day': { 
    icon: '🌦️', 
    description: 'Regnbyger', 
    materialIcon: 'rainy' 
  },
  'rainshowers_night': { 
    icon: '🌧️', 
    description: 'Regnbyger', 
    materialIcon: 'rainy' 
  },
  'heavyrainshowers_day': { 
    icon: '⛈️', 
    description: 'Kraftige regnbyger', 
    materialIcon: 'thunderstorm' 
  },
  'heavyrainshowers_night': { 
    icon: '⛈️', 
    description: 'Kraftige regnbyger', 
    materialIcon: 'thunderstorm' 
  },
  'lightrain': { 
    icon: '🌧️', 
    description: 'Lett regn', 
    materialIcon: 'rainy' 
  },
  'rain': { 
    icon: '🌧️', 
    description: 'Regn', 
    materialIcon: 'rainy' 
  },
  'heavyrain': { 
    icon: '🌧️', 
    description: 'Kraftig regn', 
    materialIcon: 'rainy' 
  },
  'lightrainandthunder': { 
    icon: '⛈️', 
    description: 'Lett regn og torden', 
    materialIcon: 'thunderstorm' 
  },
  'rainandthunder': { 
    icon: '⛈️', 
    description: 'Regn og torden', 
    materialIcon: 'thunderstorm' 
  },
  'heavyrainandthunder': { 
    icon: '⛈️', 
    description: 'Kraftig regn og torden', 
    materialIcon: 'thunderstorm' 
  },
  'lightsnowshowers_day': { 
    icon: '🌨️', 
    description: 'Lette snøbyger', 
    materialIcon: 'ac_unit' 
  },
  'lightsnowshowers_night': { 
    icon: '🌨️', 
    description: 'Lette snøbyger', 
    materialIcon: 'ac_unit' 
  },
  'snowshowers_day': { 
    icon: '❄️', 
    description: 'Snøbyger', 
    materialIcon: 'ac_unit' 
  },
  'snowshowers_night': { 
    icon: '❄️', 
    description: 'Snøbyger', 
    materialIcon: 'ac_unit' 
  },
  'heavysnowshowers_day': { 
    icon: '❄️', 
    description: 'Kraftige snøbyger', 
    materialIcon: 'ac_unit' 
  },
  'heavysnowshowers_night': { 
    icon: '❄️', 
    description: 'Kraftige snøbyger', 
    materialIcon: 'ac_unit' 
  },
  'lightsnow': { 
    icon: '🌨️', 
    description: 'Lett snø', 
    materialIcon: 'ac_unit' 
  },
  'snow': { 
    icon: '❄️', 
    description: 'Snø', 
    materialIcon: 'ac_unit' 
  },
  'heavysnow': { 
    icon: '❄️', 
    description: 'Kraftig snø', 
    materialIcon: 'ac_unit' 
  },
  'fog': { 
    icon: '🌫️', 
    description: 'Tåke', 
    materialIcon: 'foggy' 
  }
}

// Default fallback for unknown symbols
export const DEFAULT_WEATHER_SYMBOL = {
  icon: '❓',
  description: 'Ukjent vær',
  materialIcon: 'help'
}
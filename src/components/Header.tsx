// src/components/Header.tsx - Header med integrert søkefelt

import React from 'react'
import { SearchBox } from './SearchBox/SearchBox'
import { SearchResult } from '../services/searchService'
import { POI } from '../data/pois'
import './Header.css'

interface HeaderProps {
  pois: POI[]
  onLocationSelect: (result: SearchResult) => void
}

export function Header({ pois, onLocationSelect }: HeaderProps) {
  return (
    <div className="header">
      <div className="header-content">
        <div className="title-wrapper">
          <h1>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              height="24px" 
              viewBox="0 -960 960 960" 
              width="24px" 
              fill="#FFFFFF"
            >
              <path d="M280-80v-160H0l154-240H80l280-400 120 172 120-172 280 400h-74l154 240H680v160H520v-160h-80v160H280Zm389-240h145L659-560h67L600-740l-71 101 111 159h-74l103 160Zm-523 0h428L419-560h67L360-740 234-560h67L146-320Zm0 0h155-67 252-67 155-428Zm523 0H566h74-111 197-67 155-145Zm-149 80h160-160Zm201 0Z"/>
            </svg>
            Tråkke
          </h1>
          <p className="tagline">Oppdag Bykle og Valle med turskoa på (app under utvikling)</p>
        </div>
        
        <div className="search-wrapper">
          <SearchBox 
            pois={pois}
            onLocationSelect={onLocationSelect}
            placeholder="Søk utgangspunkt, koordinater eller sted..."
            className="header-search"
          />
        </div>
      </div>
    </div>
  )
}
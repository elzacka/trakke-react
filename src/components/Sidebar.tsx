import React from 'react'
import { POI, categoryTree, CategoryState } from '../data/pois'
import { SearchBox } from './SearchBox/SearchBox'
import { SearchResult } from '../services/searchService'
import { HierarchicalCategoryFilter } from './HierarchicalCategoryFilter'
import './Sidebar.css'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  categoryState: CategoryState
  onCategoryToggle: (nodeId: string) => void
  onExpandToggle: (nodeId: string) => void
  filteredPOIs: POI[]
  totalPOIs: number
  loading: boolean
  error: string | null
  onRefresh: () => void
  lastUpdated: Date | null
  // Weather props (optional for backward compatibility)
  weatherEnabled?: boolean
  onToggleWeather?: () => void
  poisWithWeather?: number
  goodWeatherPOIs?: POI[]
  hasWeatherData?: boolean
  onRefreshWeather?: () => void
  weatherLastUpdated?: Date | null
  // Heritage props
  heritageEnabled?: boolean
  onToggleHeritage?: () => void
  heritageTotal?: number
  // Search props
  pois: POI[]
  onLocationSelect: (result: SearchResult) => void
}

export function Sidebar({ 
  collapsed, 
  onToggle, 
  categoryState,
  onCategoryToggle,
  onExpandToggle,
  filteredPOIs: _filteredPOIs,
  totalPOIs: _totalPOIs,
  loading: _loading,
  error: _error,
  onRefresh: _onRefresh,
  lastUpdated: _lastUpdated,
  weatherEnabled = false,
  onToggleWeather,
  poisWithWeather: _poisWithWeather = 0,
  goodWeatherPOIs: _goodWeatherPOIs = [],
  hasWeatherData: _hasWeatherData = false,
  onRefreshWeather,
  weatherLastUpdated,
  heritageEnabled = false,
  onToggleHeritage,
  heritageTotal = 0,
  pois,
  onLocationSelect
}: SidebarProps) {

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button 
        className="sidebar-toggle"
        onClick={onToggle}
        title={collapsed ? 'Vis panel' : 'Skjul panel'}
      >
        <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '20px' }}>
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {!collapsed && (
        <div className="sidebar-content">
          <div className="title-section">
            <h1 className="sidebar-title">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                height="28px" 
                viewBox="0 -960 960 960" 
                width="28px" 
                fill="#2c5530"
              >
                <path d="M280-80v-160H0l154-240H80l280-400 120 172 120-172 280 400h-74l154 240H680v160H520v-160h-80v160H280Zm389-240h145L659-560h67L600-740l-71 101 111 159h-74l103 160Zm-523 0h428L419-560h67L360-740 234-560h67L146-320Zm0 0h155-67 252-67 155-428Zm523 0H566h74-111 197-67 155-145Zm-149 80h160-160Zm201 0Z"/>
              </svg>
              Tråkke
            </h1>
            <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
              Oppdag Norge med turskoa på
            </p>
          </div>

          <div className="search-section">
            <SearchBox 
              pois={pois}
              onLocationSelect={onLocationSelect}
              placeholder="Søk etter sted, koordinater etc."
            />
          </div>

          <div className="filter-section">
            <HierarchicalCategoryFilter
              categoryTree={categoryTree}
              categoryState={categoryState}
              onCategoryToggle={onCategoryToggle}
              onExpandToggle={onExpandToggle}
            />
          </div>

          {/* Weather Controls */}
          {onToggleWeather && (
            <div className="weather-section">
              <button
                onClick={onToggleWeather}
                className={`weather-toggle ${weatherEnabled ? 'active' : ''}`}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: weatherEnabled ? '#2c5530' : '#e0e0e0',
                  color: weatherEnabled ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '8px',
                  width: '100%'
                }}
              >
                {weatherEnabled ? '☁️ Vær på' : '☁️ Vær av'}
              </button>

              {weatherEnabled && onRefreshWeather && (
                <button
                  onClick={onRefreshWeather}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginTop: '4px',
                    width: '100%'
                  }}
                >
                  🔄 Oppdater vær
                </button>
              )}
              
              {weatherEnabled && weatherLastUpdated && (
                <>
                  <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
                    Vær oppdatert: {weatherLastUpdated.toLocaleTimeString('nb-NO')}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
                    Status 5/8-25: Appen er under utvikling. Suss, Lene.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Heritage Controls */}
          {onToggleHeritage && (
            <div className="heritage-section">
              <button
                onClick={onToggleHeritage}
                className={`heritage-toggle ${heritageEnabled ? 'active' : ''}`}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: heritageEnabled ? '#8B4B8B' : '#e0e0e0',
                  color: heritageEnabled ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '8px',
                  width: '100%'
                }}
              >
                {heritageEnabled ? '🏛️ Kulturarv på' : '🏛️ Kulturarv av'}
              </button>

              {heritageEnabled && heritageTotal > 0 && (
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
                  Kulturminner: {heritageTotal}
                </p>
              )}
            </div>
          )}

        </div>
      )}
    </aside>
  )
}

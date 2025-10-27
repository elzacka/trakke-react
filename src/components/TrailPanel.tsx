import React, { useState, useCallback } from 'react'
import type { TrailType } from '../data/trails'

interface TrailPanelProps {
  onTrailTypesChange: (activeTypes: TrailType[]) => void
}

export function TrailPanel({ onTrailTypesChange }: TrailPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [_activeTrailTypes, _setActiveTrailTypes] = useState<TrailType[]>([])

  const availableTrailTypes: Array<{ type: TrailType; name: string; icon: string; description: string }> = [
    {
      type: 'hiking',
      name: 'Fottur',
      icon: 'hiking',
      description: 'Vandreruter og fotturer'
    },
    {
      type: 'skiing',
      name: 'Skiløype',
      icon: 'downhill_skiing',
      description: 'Langrennsløyper og skiturer'
    },
    {
      type: 'cycling',
      name: 'Sykkelrute',
      icon: 'directions_bike',
      description: 'Sykkelruter og sykkeltråkk'
    },
    {
      type: 'other',
      name: 'Annen rute',
      icon: 'alt_route',
      description: 'Andre typer ruter og stier'
    }
  ]

  const handleTrailTypeToggle = useCallback((trailType: TrailType) => {
    const newActiveTrailTypes = _activeTrailTypes.includes(trailType)
      ? _activeTrailTypes.filter(t => t !== trailType)
      : [..._activeTrailTypes, trailType]

    _setActiveTrailTypes(newActiveTrailTypes)
    onTrailTypesChange(newActiveTrailTypes)
  }, [_activeTrailTypes, onTrailTypesChange])

  const _clearAllTrails = useCallback(() => {
    _setActiveTrailTypes([])
    onTrailTypesChange([])
  }, [onTrailTypesChange])

  return (
    <div className="trail-panel" style={{ marginBottom: '16px' }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: isExpanded ? '#f1f5f9' : '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '500',
          color: _activeTrailTypes.length > 0 ? '#3e4533' : '#64748b',
          transition: 'all 0.2s ease',
          marginBottom: isExpanded ? '8px' : '0'
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#f8fafc'
            e.currentTarget.style.borderColor = '#cbd5e1'
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#ffffff'
            e.currentTarget.style.borderColor = '#e2e8f0'
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '16px',
            color: _activeTrailTypes.length > 0 ? '#3e4533' : '#64748b'
          }}>
            route
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: _activeTrailTypes.length > 0 ? '#3e4533' : '#334155',
            letterSpacing: '0.2px'
          }}>
            Turløyper
          </span>
          {_activeTrailTypes.length > 0 && (
            <span style={{
              fontSize: '11px',
              backgroundColor: '#3e4533',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontWeight: '600',
              minWidth: '16px',
              textAlign: 'center'
            }}>
              {_activeTrailTypes.length}
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '16px',
            color: '#64748b',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          keyboard_arrow_down
        </span>
      </button>

      {/* Expanded Content - Dropdown with options */}
      {isExpanded && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Trail Type Toggle Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {availableTrailTypes.map(({ type, name, icon, description }) => {
              const isActive = _activeTrailTypes.includes(type)
              return (
                <button
                  key={type}
                  onClick={() => handleTrailTypeToggle(type)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                    border: isActive ? '1px solid #3e4533' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f8fafc'
                      e.currentTarget.style.borderColor = '#cbd5e1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }
                  }}
                >
                  {/* Icon */}
                  <span style={{
                    fontFamily: 'Material Symbols Outlined',
                    fontSize: '20px',
                    color: isActive ? '#3e4533' : '#9ca3af'
                  }}>
                    {icon}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: isActive ? '#3e4533' : '#374151',
                      marginBottom: '2px'
                    }}>
                      {name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280'
                    }}>
                      {description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Clear All Button - Disabled while service is unavailable */}
        </div>
      )}
    </div>
  )
}

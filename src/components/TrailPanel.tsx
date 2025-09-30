import React, { useState, useCallback } from 'react'
import type { TrailType } from '../data/trails'

interface TrailPanelProps {
  onTrailTypesChange: (activeTypes: TrailType[]) => void
}

export function TrailPanel({ onTrailTypesChange }: TrailPanelProps) {
  const [isTrailsExpanded, setIsTrailsExpanded] = useState(false)
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

    console.log(`🥾 Trail type ${trailType} ${newActiveTrailTypes.includes(trailType) ? 'enabled' : 'disabled'}`)
  }, [_activeTrailTypes, onTrailTypesChange])

  const _clearAllTrails = useCallback(() => {
    _setActiveTrailTypes([])
    onTrailTypesChange([])
    console.log('🥾 All trail types cleared')
  }, [onTrailTypesChange])

  return (
    <div className="trail-panel" style={{ marginBottom: '16px' }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsTrailsExpanded(!isTrailsExpanded)}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: isTrailsExpanded ? '#f1f5f9' : '#ffffff',
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
          marginBottom: isTrailsExpanded ? '8px' : '0'
        }}
        onMouseEnter={(e) => {
          if (!isTrailsExpanded) {
            e.currentTarget.style.backgroundColor = '#f8fafc'
            e.currentTarget.style.borderColor = '#cbd5e1'
          }
        }}
        onMouseLeave={(e) => {
          if (!isTrailsExpanded) {
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
            transform: isTrailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          keyboard_arrow_down
        </span>
      </button>

      {/* Expanded Content - Trail Type Toggles */}
      {isTrailsExpanded && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ padding: '12px' }}>

            {/* Info Text */}
            <div style={{
              marginBottom: '12px',
              padding: '8px',
              backgroundColor: '#f0f9ff',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#075985',
              lineHeight: '1.4'
            }}>
              <strong>Turløyper:</strong> Stier og løyper fra Turrutebasen. Viser fire hovedtyper av ruter i Norge.
            </div>

            {/* Trail Type Toggles */}
            <div style={{ marginBottom: '12px' }}>
              {availableTrailTypes.map(({ type, name, icon, description }) => (
                <div
                  key={type}
                  style={{
                    marginBottom: '8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <button
                    onClick={() => handleTrailTypeToggle(type)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: _activeTrailTypes.includes(type) ? '#f0f9ff' : '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!_activeTrailTypes.includes(type)) {
                        e.currentTarget.style.backgroundColor = '#f8fafc'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!_activeTrailTypes.includes(type)) {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      border: `2px solid ${_activeTrailTypes.includes(type) ? '#3e4533' : '#d1d5db'}`,
                      backgroundColor: _activeTrailTypes.includes(type) ? '#3e4533' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      {_activeTrailTypes.includes(type) && (
                        <span style={{
                          color: 'white',
                          fontSize: '10px',
                          lineHeight: '1'
                        }}>
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Icon */}
                    <span style={{
                      fontFamily: 'Material Symbols Outlined',
                      fontSize: '18px',
                      color: _activeTrailTypes.includes(type) ? '#3e4533' : '#64748b'
                    }}>
                      {icon}
                    </span>

                    {/* Content */}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: _activeTrailTypes.includes(type) ? '#3e4533' : '#334155',
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
                </div>
              ))}
            </div>

            {/* Clear All Button - Disabled while service is unavailable */}
          </div>
        </div>
      )}
    </div>
  )
}
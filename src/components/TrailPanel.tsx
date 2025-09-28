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
      name: 'Fotturer',
      icon: 'hiking',
      description: 'Vandreruter og fotturer'
    },
    {
      type: 'skiing',
      name: 'Skiløyper',
      icon: 'downhill_skiing',
      description: 'Langrennsløyper og skiturer'
    },
    {
      type: 'cycling',
      name: 'Sykkelruter',
      icon: 'directions_bike',
      description: 'Sykkelruter og sykkeltråkk'
    },
    {
      type: 'mixed',
      name: 'Flerfunksjonsløyper',
      icon: 'sports',
      description: 'Løyper for flere aktiviteter'
    }
  ]

  const handleTrailTypeToggle = useCallback((trailType: TrailType) => {
    // Temporarily disabled - trail data fetching is paused
    console.log(`🚫 Trail type ${trailType} toggle disabled - service temporarily unavailable`)
    return
  }, [])

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
          color: '#64748b',
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
            color: '#9ca3af'
          }}>
            route
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#9ca3af',
            letterSpacing: '0.2px'
          }}>
            Turløyper
          </span>
          <span style={{
            fontSize: '12px',
            color: '#9ca3af',
            fontStyle: 'italic',
            fontWeight: '400'
          }}>
            (Kommer)
          </span>
        </div>
        <span
          style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '16px',
            color: '#9ca3af',
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

            {/* Help Text */}
            <div style={{
              marginBottom: '12px',
              padding: '8px',
              backgroundColor: '#f8fafc',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              Turløype-funksjonen er midlertidig utilgjengelig
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
                    disabled={true}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'not-allowed',
                      transition: 'all 0.2s ease',
                      opacity: 0.6
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      border: '2px solid #d1d5db',
                      backgroundColor: '#f9fafb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                    </div>

                    {/* Icon */}
                    <span style={{
                      fontFamily: 'Material Symbols Outlined',
                      fontSize: '18px',
                      color: '#9ca3af'
                    }}>
                      {icon}
                    </span>

                    {/* Content */}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#9ca3af',
                        marginBottom: '2px'
                      }}>
                        {name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#9ca3af'
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
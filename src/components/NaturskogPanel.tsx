import React, { useState, useCallback } from 'react'
import { NaturskogLayerType, NATURSKOG_LAYERS } from '../services/naturskogService'

interface NaturskogPanelProps {
  onLayerToggle: (layerType: NaturskogLayerType, enabled: boolean) => void
}

export function NaturskogPanel({ onLayerToggle }: NaturskogPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeLayers, setActiveLayers] = useState<Set<NaturskogLayerType>>(new Set())

  const handleLayerToggle = useCallback((layerType: NaturskogLayerType) => {
    const newActiveLayers = new Set(activeLayers)
    const isCurrentlyActive = activeLayers.has(layerType)

    if (isCurrentlyActive) {
      newActiveLayers.delete(layerType)
    } else {
      newActiveLayers.add(layerType)
    }

    setActiveLayers(newActiveLayers)
    onLayerToggle(layerType, !isCurrentlyActive)

    console.log(`🌲 Naturskog layer ${layerType} ${!isCurrentlyActive ? 'enabled' : 'disabled'}`)
  }, [activeLayers, onLayerToggle])

  const clearAllLayers = useCallback(() => {
    activeLayers.forEach(layerType => {
      onLayerToggle(layerType, false)
    })
    setActiveLayers(new Set())
    console.log('🌲 All Naturskog layers cleared')
  }, [activeLayers, onLayerToggle])

  return (
    <div className="naturskog-panel" style={{ marginBottom: '16px' }}>
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
          color: activeLayers.size > 0 ? '#3e4533' : '#64748b',
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
            color: activeLayers.size > 0 ? '#3e4533' : '#64748b'
          }}>
            forest
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: activeLayers.size > 0 ? '#3e4533' : '#334155',
            letterSpacing: '0.2px'
          }}>
            Naturskog
          </span>
          {activeLayers.size > 0 && (
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
              {activeLayers.size}
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

      {/* Expanded Content - Layer Toggles */}
      {isExpanded && (
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
              <strong>Naturskog:</strong> Kart over naturskog i Norge fra Miljødirektoratet. Viser tre ulike tilnærminger til kartlegging av gammel skog.
            </div>

            {/* Layer Toggles */}
            <div style={{ marginBottom: '12px' }}>
              {NATURSKOG_LAYERS.map((layer) => {
                const isActive = activeLayers.has(layer.type)
                return (
                  <div
                    key={layer.type}
                    style={{
                      marginBottom: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <button
                      onClick={() => handleLayerToggle(layer.type)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: isActive ? '#f0f9ff' : '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#f8fafc'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#ffffff'
                        }
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        border: `2px solid ${isActive ? '#3e4533' : '#d1d5db'}`,
                        backgroundColor: isActive ? '#3e4533' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}>
                        {isActive && (
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
                        color: isActive ? layer.color : '#9ca3af'
                      }}>
                        {layer.icon}
                      </span>

                      {/* Content */}
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: isActive ? '#075985' : '#374151',
                          marginBottom: '2px'
                        }}>
                          {layer.name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          lineHeight: '1.3'
                        }}>
                          {layer.description}
                        </div>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Clear All Button */}
            {activeLayers.size > 0 && (
              <button
                onClick={clearAllLayers}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fee2e2'
                  e.currentTarget.style.borderColor = '#fca5a5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2'
                  e.currentTarget.style.borderColor = '#fecaca'
                }}
              >
                Fjern alle kartlag
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
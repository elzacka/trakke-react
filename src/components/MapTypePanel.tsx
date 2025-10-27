import React, { useState } from 'react'

interface MapTypePanelProps {
  mapType: 'topo' | 'satellite'
  onMapTypeChange: (mapType: 'topo' | 'satellite') => void
}

/**
 * MapTypePanel - Collapsible panel for selecting map type (Topo/Satellite)
 * Follows the same design pattern as other collapsible panels
 */
export function MapTypePanel({ mapType, onMapTypeChange }: MapTypePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="map-type-panel" style={{ marginBottom: '16px' }}>
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
          color: '#64748b',
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
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#94a3b8'
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(148, 163, 184, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '16px',
            color: '#64748b'
          }}>
            map
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#334155',
            letterSpacing: '0.2px'
          }}>
            Type kart
          </span>
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

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: '#f1f5f9',
            borderRadius: '6px',
            padding: '4px'
          }}>
            <button
              onClick={() => onMapTypeChange('topo')}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: mapType === 'topo' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '500',
                color: mapType === 'topo' ? '#334155' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: mapType === 'topo' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              Topo
            </button>
            <button
              onClick={() => onMapTypeChange('satellite')}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: mapType === 'satellite' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '500',
                color: mapType === 'satellite' ? '#334155' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: mapType === 'satellite' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              Satellitt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

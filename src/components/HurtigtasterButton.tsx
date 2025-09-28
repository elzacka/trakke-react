import React from 'react'
import { useUIStore } from '../state/uiStore'

export function HurtigtasterButton() {
  const { openHurtigtaster } = useUIStore()

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={openHurtigtaster}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#334155',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc'
          e.currentTarget.style.borderColor = '#cbd5e1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff'
          e.currentTarget.style.borderColor = '#e2e8f0'
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
        <span style={{
          fontFamily: 'Material Symbols Outlined',
          fontSize: '16px',
          color: '#64748b'
        }}>
          keyboard
        </span>
        <span>Hurtigtaster og handlinger</span>
      </button>
    </div>
  )
}
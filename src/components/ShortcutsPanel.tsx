import React, { useState } from 'react'

interface ShortcutsPanelProps {
  className?: string
}

export function ShortcutsPanel({ className = '' }: ShortcutsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const shortcuts = {
    app: [
      { action: 'Søk', method: 'Ctrl+K' },
      { action: 'Meny', method: 'Ctrl+B' },
      { action: 'Lukk', method: 'Esc' }
    ],
    map: [
      { action: 'Panorér', method: 'Dra' },
      { action: 'Zoom', method: 'Rull / pinch' },
      { action: 'Roter', method: 'To fingre' }
    ]
  }

  return (
    <div className={`shortcuts-panel ${className}`}>
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
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#ffffff'
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '16px',
            color: '#64748b'
          }}>
            keyboard
          </span>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#334155',
            letterSpacing: '0.2px' 
          }}>
            Hurtigtaster
          </span>
        </div>
        <span 
          style={{ 
            fontFamily: 'Material Symbols Outlined',
            fontSize: '16px',
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
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(8px)'
        }}>
          {/* Single clean grid layout */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{
              display: 'grid',
              gap: '8px'
            }}>
              {/* App shortcuts */}
              {shortcuts.app.map((shortcut, index) => (
                <div key={`app-${index}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '6px 0',
                  borderBottom: (index === shortcuts.app.length - 1 && shortcuts.map.length > 0) ? '1px solid rgba(241, 245, 249, 0.8)' : 'none',
                  paddingBottom: (index === shortcuts.app.length - 1 && shortcuts.map.length > 0) ? '10px' : '6px',
                  marginBottom: (index === shortcuts.app.length - 1 && shortcuts.map.length > 0) ? '4px' : '0'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#1f2937', 
                    fontWeight: '400',
                    letterSpacing: '0.1px'
                  }}>
                    {shortcut.action}
                  </span>
                  <kbd style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    backgroundColor: '#f3f4f6', // Specified background
                    padding: '4px 6px', // Specified padding
                    borderRadius: '6px', // Specified border-radius
                    border: '1px solid rgba(229, 231, 235, 0.6)',
                    fontFamily: 'SF Mono, Monaco, "Cascadia Code", monospace'
                  }}>
                    {shortcut.method}
                  </kbd>
                </div>
              ))}
              
              {/* Map shortcuts */}
              {shortcuts.map.map((shortcut, index) => (
                <div key={`map-${index}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '6px 0'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#1f2937', 
                    fontWeight: '400',
                    letterSpacing: '0.1px'
                  }}>
                    {shortcut.action}
                  </span>
                  <kbd style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    backgroundColor: '#f3f4f6', // Specified background
                    padding: '4px 6px', // Specified padding
                    borderRadius: '6px', // Specified border-radius
                    border: '1px solid rgba(229, 231, 235, 0.6)',
                    fontFamily: 'SF Mono, Monaco, "Cascadia Code", monospace'
                  }}>
                    {shortcut.method}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
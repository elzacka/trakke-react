import React, { useState } from 'react'

interface ShortcutsPanelProps {
  className?: string
}

export function ShortcutsPanel({ className = '' }: ShortcutsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const shortcuts = {
    map: [
      { action: 'Panorer', method: 'Dra med en finger' },
      { action: 'Zoom inn', method: 'Pinch ut / scroll opp' },
      { action: 'Zoom ut', method: 'Pinch inn / scroll ned' },
      { action: 'Roter', method: 'To fingre + roter' },
      { action: 'Tilt', method: 'Ctrl + dra' }
    ],
    app: [
      { action: 'Søk', method: 'Ctrl+K / ⌘+K' },
      { action: 'Vis/skjul sidepanel', method: 'Klikk på pil' },
      { action: 'Skjul søkeresultater', method: 'Escape' }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#475569', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px' 
          }}>
            App- og kartnavigasjon
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
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          {/* App Controls Section */}
          <div style={{ padding: '8px 12px' }}>
            {shortcuts.app.map((shortcut, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '3px 0',
                borderBottom: index < shortcuts.app.length - 1 ? '1px solid #f1f5f9' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                    {shortcut.action}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    color: '#64748b',
                    backgroundColor: '#f8fafc',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {shortcut.method}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />

          {/* Map Navigation Section */}
          <div style={{ padding: '8px 12px' }}>
            {shortcuts.map.map((shortcut, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '3px 0',
                borderBottom: index < shortcuts.map.length - 1 ? '1px solid #f1f5f9' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                    {shortcut.action}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    color: '#64748b',
                    backgroundColor: '#f8fafc',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {shortcut.method}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer tip */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #f1f5f9'
          }}>
            <p style={{
              margin: '0',
              fontSize: '10px',
              color: '#64748b',
              fontStyle: 'italic',
              textAlign: 'left'
            }}>
              💡 Tips: Hold Shift mens du zoomer for mer kontroll
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
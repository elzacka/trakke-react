import React, { useState } from 'react'
import { CategoryNode, CategoryState, POI } from '../data/pois'
import { HierarchicalCategoryFilter } from './HierarchicalCategoryFilter'
import { useUIStore } from '../state/uiStore'
import { useAdminStore } from '../state/adminStore'

interface CategoryPanelProps {
  categoryTree: CategoryNode[]
  categoryState: CategoryState
  onCategoryToggle: (nodeId: string) => void
  onExpandToggle: (nodeId: string) => void
  pois: POI[]
  loading: boolean
  error: string | null
  mapType: 'topo' | 'satellite'
  onMapTypeChange: (mapType: 'topo' | 'satellite') => void
}

export function CategoryPanel({
  categoryTree,
  categoryState,
  onCategoryToggle,
  onExpandToggle,
  pois,
  loading,
  error,
  mapType,
  onMapTypeChange
}: CategoryPanelProps) {
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false) // Start collapsed
  const { openHurtigtaster } = useUIStore()
  const {
    isAuthenticated,
    setShowAdminLogin,
    setShowAdminPanel,
    session
  } = useAdminStore()

  return (
    <div>
      {loading && (
        <div style={{
          padding: '8px',
          backgroundColor: '#f0f9ff',
          borderRadius: '4px',
          marginBottom: '8px',
          fontSize: '12px',
          color: '#0284c7'
        }}>
          Laster POI data...
        </div>
      )}

      {error && (
        <div style={{
          padding: '8px',
          backgroundColor: '#fef2f2',
          borderRadius: '4px',
          marginBottom: '8px',
          fontSize: '12px',
          color: '#dc2626'
        }}>
          Feil: {error}
        </div>
      )}

      {/* Map Type Selector */}
      <div className="map-type-panel" style={{ marginBottom: '16px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
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
      </div>

      {/* Categories panel */}
      <div className="categories-panel" style={{ marginBottom: '16px' }}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: isCategoriesExpanded ? '#f1f5f9' : '#ffffff',
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
            marginBottom: isCategoriesExpanded ? '8px' : '0'
          }}
          onMouseEnter={(e) => {
            if (!isCategoriesExpanded) {
              e.currentTarget.style.backgroundColor = '#f8fafc'
              e.currentTarget.style.borderColor = '#cbd5e1'
            }
          }}
          onMouseLeave={(e) => {
            if (!isCategoriesExpanded) {
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
              layers
            </span>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#334155',
              letterSpacing: '0.2px' 
            }}>
              Kategorier
            </span>
          </div>
          <span 
            style={{ 
              fontFamily: 'Material Symbols Outlined',
              fontSize: '16px',
              transform: isCategoriesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            keyboard_arrow_down
          </span>
        </button>

        {/* Expanded Content */}
        {isCategoriesExpanded && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ padding: '12px' }}>
              <HierarchicalCategoryFilter
                categoryTree={categoryTree}
                categoryState={categoryState}
                onCategoryToggle={onCategoryToggle}
                onExpandToggle={onExpandToggle}
                pois={pois}
              />
            </div>
          </div>
        )}
      </div>

      {/* Meta info entries */}
      <div style={{ marginBottom: '16px' }}>
        {/* Hurtigtaster */}
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

        {/* Admin Controls */}
        {isAuthenticated ? (
          /* Admin Panel Button - when logged in */
          <button
            onClick={() => setShowAdminPanel(true)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#15803d',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dcfce7'
              e.currentTarget.style.borderColor = '#86efac'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0fdf4'
              e.currentTarget.style.borderColor = '#bbf7d0'
            }}
          >
            <span style={{
              fontFamily: 'Material Symbols Outlined',
              fontSize: '16px',
              color: '#15803d'
            }}>
              admin_panel_settings
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span>Admin</span>
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '400' }}>
                {session ? `Login utløper ${new Date(session.expiresAt).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}` : 'Aktiv økt'}
              </span>
            </div>
          </button>
        ) : (
          /* Admin Login Button - when not logged in */
          <button
            onClick={() => setShowAdminLogin(true)}
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
              login
            </span>
            <span>Admin</span>
          </button>
        )}
      </div>
    </div>
  )
}
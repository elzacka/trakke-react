import React, { useState } from 'react'
import { CategoryNode, CategoryState, POI } from '../data/pois'
import { HierarchicalCategoryFilter } from './HierarchicalCategoryFilter'

interface CategoryPanelProps {
  categoryTree: CategoryNode[]
  categoryState: CategoryState
  onCategoryToggle: (nodeId: string) => void
  onExpandToggle: (nodeId: string) => void
  pois: POI[]
  loading: boolean
  error: string | null
}

export function CategoryPanel({
  categoryTree,
  categoryState,
  onCategoryToggle,
  onExpandToggle,
  pois,
  loading,
  error
}: CategoryPanelProps) {
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false) // Start collapsed

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

    </div>
  )
}
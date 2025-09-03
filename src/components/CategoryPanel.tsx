import React from 'react'
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
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151'
        }}>
          POI Kategorier
        </h3>
        <p style={{
          margin: '0',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          Velg kategorier for å vise POIs på kartet
        </p>
      </div>

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

      <div style={{
        marginBottom: '12px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        {pois.length} POIs lastet
      </div>

      <HierarchicalCategoryFilter
        categoryTree={categoryTree}
        categoryState={categoryState}
        onCategoryToggle={onCategoryToggle}
        onExpandToggle={onExpandToggle}
        pois={pois}
      />
    </div>
  )
}
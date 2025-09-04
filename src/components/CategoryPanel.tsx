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
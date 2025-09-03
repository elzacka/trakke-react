import React from 'react'
import { CategoryNode, CategoryState, POI } from '../data/pois'

interface HierarchicalCategoryFilterProps {
  categoryTree: CategoryNode[]
  categoryState: CategoryState
  onCategoryToggle: (nodeId: string) => void
  onExpandToggle: (nodeId: string) => void
  pois: POI[] // Add POI data to determine which categories have actual data
}

export function HierarchicalCategoryFilter({
  categoryTree,
  categoryState,
  onCategoryToggle,
  onExpandToggle,
  pois
}: HierarchicalCategoryFilterProps) {
  
  // All categories are always available with viewport-based loading
  // POI data loads on-demand when user selects categories
  const categoryHasData = (_node: CategoryNode): boolean => {
    return true // All categories are available - data loads when selected
  }
  
  const renderCategoryNode = (node: CategoryNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = categoryState.expanded[node.id] || false
    const isChecked = categoryState.checked[node.id] || false
    const indentLevel = level * 20
    const hasData = categoryHasData(node)
    const isDisabled = false // All categories are always enabled with viewport-based loading

    return (
      <div key={node.id} style={{ marginLeft: `${indentLevel}px` }}>
        <div className="category-item">
          {hasChildren && (
            <button
              className="expand-button"
              onClick={() => onExpandToggle(node.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                marginRight: '4px',
                fontSize: '12px',
                color: '#666'
              }}
            >
              <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px' }}>
                {isExpanded ? 'expand_more' : 'chevron_right'}
              </span>
            </button>
          )}
          
          {!hasChildren && <div style={{ width: '24px', display: 'inline-block' }} />}
          
          <input
            type="checkbox"
            id={node.id}
            checked={isChecked}
            onChange={() => !isDisabled && onCategoryToggle(node.id)}
            disabled={isDisabled}
            style={{ 
              marginRight: '8px',
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer'
            }}
          />
          
          {node.icon && (
            <div 
              className="icon-preview" 
              style={{ 
                backgroundColor: isDisabled ? '#ccc' : (node.color || '#ccc'),
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '8px',
                opacity: isDisabled ? 0.4 : 1
              }}
            >
              <span style={{ 
                fontFamily: 'Material Symbols Outlined', 
                fontSize: '14px', 
                color: 'white',
                opacity: isDisabled ? 0.6 : 1
              }}>
                {node.icon}
              </span>
            </div>
          )}
          
          <label 
            htmlFor={node.id}
            style={{ 
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: isDisabled ? '#999' : 'inherit',
              opacity: isDisabled ? 0.6 : 1
            }}
          >
            {node.name}
          </label>
        </div>
        
        {hasChildren && isExpanded && node.children && (
          <div className="subcategories">
            {node.children.map(child => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="hierarchical-category-filter">
      {categoryTree.map(node => renderCategoryNode(node))}
    </div>
  )
}
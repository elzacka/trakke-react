import React from 'react'
import { CategoryNode, CategoryState } from '../data/pois'

interface HierarchicalCategoryFilterProps {
  categoryTree: CategoryNode[]
  categoryState: CategoryState
  onCategoryToggle: (nodeId: string) => void
  onExpandToggle: (nodeId: string) => void
}

export function HierarchicalCategoryFilter({
  categoryTree,
  categoryState,
  onCategoryToggle,
  onExpandToggle
}: HierarchicalCategoryFilterProps) {
  
  const renderCategoryNode = (node: CategoryNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = categoryState.expanded[node.id] || false
    const isChecked = categoryState.checked[node.id] || false
    const indentLevel = level * 20

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
            onChange={() => onCategoryToggle(node.id)}
            style={{ marginRight: '8px' }}
          />
          
          {node.icon && (
            <div 
              className="icon-preview" 
              style={{ 
                backgroundColor: node.color || '#ccc',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '8px'
              }}
            >
              <span style={{ 
                fontFamily: 'Material Symbols Outlined', 
                fontSize: '14px', 
                color: 'white' 
              }}>
                {node.icon}
              </span>
            </div>
          )}
          
          <label 
            htmlFor={node.id}
            style={{ 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
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
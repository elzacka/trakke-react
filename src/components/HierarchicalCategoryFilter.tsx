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
  pois: _pois
}: HierarchicalCategoryFilterProps) {
  
  // Check if category has available data sources
  const categoryHasData = (node: CategoryNode): boolean => {
    // Categories with active data sources - ONLY Krigsminner POIs are actually available
    const activeCategoryMapping: Record<string, boolean> = {
      // Only parent category with actual data
      'cultural_heritage': true,  // Contains Krigsminner which has real POIs
      
      // Only active subcategory with real POI data from Overpass API
      'war_memorials': true,      // Krigsminner - the ONLY category with actual POIs
      
      // All other categories currently inactive (no real POI data available)
      'outdoor_activities': false,
      'water_activities': false, 
      'accommodation': false,
      'nature_experiences': false,
      'services_infrastructure': false,
      'transport': false,
      'water_activities_extended': false,
      
      // All subcategories inactive (no POI sources)
      'hiking': false,
      'mountain_peaks': false,
      'ski_trails': false,
      'swimming': false,
      'beach': false,
      'staffed_huts': false,
      'self_service_huts': false,
      'wilderness_shelter': false,
      'camping_site': false,
      'tent_area': false,
      'wild_camping': false,
      'hammock_spots': false,
      'nature_gems': false,
      'viewpoints': false,
      'parking': false,
      'rest_areas': false,
      'toilets': false,
      'drinking_water': false,
      'fire_places': false,
      'information_boards': false,
      'cable_cars': false,
      'public_transport': false,
      'train_stations': false,
      'fishing_spots': false,
      'canoeing': false,
      'churches': false,      // No actual church POI data
      'archaeological': false // No actual archaeological POI data
    }
    
    // Check if this category or any of its children have data
    const hasDirectData = activeCategoryMapping[node.id] || false
    
    if (hasDirectData) return true
    
    // Check if any children have data
    if (node.children) {
      return node.children.some(child => categoryHasData(child))
    }
    
    return false
  }
  
  const renderCategoryNode = (node: CategoryNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = categoryState.expanded[node.id] || false
    const isChecked = categoryState.checked[node.id] || false
    const indentLevel = level * 20
    const _hasData = categoryHasData(node)
    const isDisabled = !_hasData // Disable categories without available data

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
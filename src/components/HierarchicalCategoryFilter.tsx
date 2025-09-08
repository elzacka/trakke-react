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
    // Categories with active data sources - Multiple POI types now available
    const activeCategoryMapping: Record<string, boolean> = {
      // Only parent category with actual data
      'på_eventyr': true,         // Contains multiple subcategories with real POIs
      
      // Active subcategories with real POI data from Overpass API
      'krigsminne': true,         // War memorials and historic forts
      'hule': true,               // Cave entrances from natural=cave_entrance
      'observasjonstårn': true,   // Observation towers and watchtowers + hunting stands
      
      // Newly active categories with real POI data
      'aktivitet': true,          // Contains bålplass with firepit data
      'naturperle': false,
      'overnatte': true,          // Contains gapahuk_vindskjul with shelter data
      'service': false,
      'transport': false,
      'turløype': true,               // Official Norwegian hiking trails from Kartverket
      
      // Active Kartverket trail subcategories  
      'fotrute': true,                // Hiking trails - Kartverket fotrute
      'skiloype_trail': true,         // Ski trails - Kartverket skiløype  
      'sykkelrute': true,             // Bicycle routes - Kartverket sykkelrute
      'andre_turruter': true,         // Other trails - Kartverket andre turruter
      
      // Newly active subcategories with real POI data
      'bålplass': true,           // Fire pits from leisure=firepit
      'gapahuk_vindskjul': true,  // Shelters from amenity=shelter
      
      // All other subcategories inactive (no POI sources)
      'badeplass': false,
      'badeplass_med_strand': false,
      'fiskeplass': false,
      'kanopadling': false,
      'foss': false,
      'utsiktspunkt': false,
      'campingplass': false,
      'gapahuk_vindskjul': false,
      'fri_camping': false,
      'hengekøyeplass': false,
      'hytte_dagstur': false,
      'hytte_turisthytte_betjent': false,
      'hytte_turisthytte_selvbetjent': false,
      'hytte_turisthytte_ubetjent': false,
      'hytte_utleie': false,
      'teltplass': false,
      'vandrerhjem': false,
      'kulturminne': false,
      'informasjon': false,
      'drikkevann': false,
      'spise_rasteplass': false,
      'toalett': false,
      'utfartparkering': false,
      'bussholdeplass': false,
      'taubane': false,
      'togstasjon': false,
      'tursti': false,
      'fjelltopp': false,
      'skiløype': false
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
          
          {node.icon && !node.parent && (
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
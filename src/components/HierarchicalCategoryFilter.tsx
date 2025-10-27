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
      'naturperle': true,         // Contains foss and utsiktspunkt with real POI data
      'overnatte': true,          // Contains gapahuk_vindskjul with shelter data
      'service': true,            // Contains tilfluktsrom with real WFS data
      'transport': true,          // Contains bus stops and train stations from Entur API

      // Newly active subcategories with real POI data
      'bålplass': true,           // Fire pits from leisure=firepit
      'gapahuk_vindskjul': true,  // Shelters from amenity=shelter
      'tilfluktsrom': true,       // Emergency shelters from Geonorge WFS

      // All other subcategories inactive (no POI sources)
      'badeplass': false,
      'badeplass_med_strand': false,
      'fiskeplass': false,
      'kanopadling': false,
      'foss': true,               // Waterfalls from waterway=waterfall
      'utsiktspunkt': true,       // Viewpoints from tourism=viewpoint
      'campingplass': false,
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
      'bussholdeplass': true,     // Bus stops from Entur API
      'taubane': true,            // Cable cars from aerialway=cable_car, gondola, goods
      'togstasjon': true,         // Train stations from Entur API
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
        <div
          className="category-item"
          onClick={() => !isDisabled && !hasChildren && onCategoryToggle(node.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 8px',
            minHeight: '32px',
            borderRadius: '6px',
            margin: '1px 0',
            backgroundColor: isChecked ? '#f0fdf4' : 'transparent',
            border: isChecked ? '1px solid #3e4533' : '1px solid transparent',
            cursor: !isDisabled && !hasChildren ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isDisabled && !hasChildren && !isChecked) {
              e.currentTarget.style.backgroundColor = '#f8fafc'
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled && !hasChildren && !isChecked) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          {hasChildren && (
            <button
              className="expand-button"
              onClick={(e) => {
                e.stopPropagation()
                onExpandToggle(node.id)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                marginRight: '6px',
                fontSize: '12px',
                color: '#6b7280',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                minHeight: '20px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc'
                e.currentTarget.style.color = '#334155'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px', transition: 'transform 0.2s ease' }}>
                {isExpanded ? 'expand_more' : 'chevron_right'}
              </span>
            </button>
          )}

          {!hasChildren && <div style={{ width: '32px', display: 'inline-block' }} />}

          {node.icon && !node.parent && (
            <div
              className="icon-preview"
              style={{
                backgroundColor: isDisabled ? '#e5e7eb' : (node.color ?? '#6b7280'),
                width: '22px',
                height: '22px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '10px',
                opacity: isDisabled ? 0.5 : 1,
                boxShadow: isDisabled ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{
                fontFamily: 'Material Symbols Outlined',
                fontSize: '13px',
                color: 'white',
                opacity: isDisabled ? 0.6 : 1,
                fontWeight: '400',
                fontVariationSettings: '"wght" 400'
              }}>
                {node.icon}
              </span>
            </div>
          )}

          <span
            style={{
              fontSize: '14px',
              fontWeight: isDisabled ? '400' : '500',
              color: isChecked ? '#3e4533' : (isDisabled ? '#9ca3af' : '#374151'),
              opacity: isDisabled ? 0.7 : 1,
              lineHeight: '1.4',
              letterSpacing: '0.1px',
              transition: 'color 0.2s ease',
              flex: 1
            }}
          >
            {node.name}
          </span>
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
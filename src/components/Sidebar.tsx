import React from 'react'
import { POI, POIType, categoryConfig } from '../data/pois'
import './Sidebar.css'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  activeCategories: Set<POIType>
  onToggleCategory: (categoryId: POIType) => void
  filteredPOIs: POI[]
  totalPOIs: number
}

export function Sidebar({ 
  collapsed, 
  onToggle, 
  activeCategories, 
  onToggleCategory,
  filteredPOIs,
  totalPOIs 
}: SidebarProps) {
  const categories: POIType[] = ['hiking', 'swimming', 'camping', 'waterfalls', 'viewpoints', 'history']

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button 
        className="sidebar-toggle"
        onClick={onToggle}
        title={collapsed ? 'Vis panel' : 'Skjul panel'}
      >
        <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '20px' }}>
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {!collapsed && (
        <div className="sidebar-content">
          <div className="filter-section">
            <h3>
              <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '18px', marginRight: '8px' }}>
                map
              </span>
              Se/ta bort på kart
            </h3>
            
            <div className="filter-group">
              {categories.map(categoryId => {
                const config = categoryConfig[categoryId]
                return (
                  <div key={categoryId} className="filter-item">
                    <input 
                      type="checkbox" 
                      id={categoryId}
                      checked={activeCategories.has(categoryId)}
                      onChange={() => onToggleCategory(categoryId)}
                    />
                    <div 
                      className="icon-preview" 
                      style={{ backgroundColor: config.color }}
                    >
                      <span style={{ 
                        fontFamily: 'Material Symbols Outlined', 
                        fontSize: '16px', 
                        color: 'white' 
                      }}>
                        {config.icon}
                      </span>
                    </div>
                    <label htmlFor={categoryId}>{config.name}</label>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="legend">
            <h4>
              <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '18px', marginRight: '8px' }}>
                info
              </span>
              Veiledning
            </h4>
            <p>Klikk på ikonene i kartet for mer info om hvert punkt. Du kan zoome og dra kartet for å utforske området.</p>
          </div>

          <div className="stats">
            <p><strong>Synlige punkter:</strong> {filteredPOIs.length}</p>
            <p><strong>Totalt i området:</strong> {totalPOIs}</p>
          </div>
        </div>
      )}
    </aside>
  )
}

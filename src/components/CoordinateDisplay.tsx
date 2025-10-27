import React from 'react'

interface CoordinateDisplayProps {
  coordinates: { lat: number; lng: number } | null
}

/**
 * CoordinateDisplay - Shows current map coordinates for mobile devices
 * Displays between search box and category panel
 * Updates as user touches/navigates the map
 */
export const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ coordinates }) => {
  // Only show on mobile (< 768px)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (!isMobile || !coordinates) {
    return null
  }

  // Format coordinates to 5 decimal places (≈1.1m precision)
  const formatCoordinate = (value: number, decimals: number = 5): string => {
    return value.toFixed(decimals)
  }

  return (
    <div
      style={{
        padding: '12px 20px',
        fontSize: '13px',
        color: '#6b7280',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb'
      }}
    >
      <div style={{ display: 'flex', gap: '16px' }}>
        <span>
          <span style={{ fontWeight: '500', color: '#374151' }}>Lat:</span>{' '}
          {formatCoordinate(coordinates.lat)}
        </span>
        <span>
          <span style={{ fontWeight: '500', color: '#374151' }}>Lng:</span>{' '}
          {formatCoordinate(coordinates.lng)}
        </span>
      </div>
    </div>
  )
}

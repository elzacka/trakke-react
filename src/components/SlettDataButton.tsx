import React, { useState } from 'react'

export function SlettDataButton() {
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleDeleteData = async () => {
    try {
      // Clear all localStorage
      localStorage.clear()

      // Clear all service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      }

      // Clear session storage as well
      sessionStorage.clear()

      // Show success message briefly before reload
      alert('✅ Alle dine data er slettet. Appen vil nå lastes på nytt.')

      // Reload the app to fresh state
      window.location.reload()
    } catch (error) {
      console.error('Error deleting data:', error)
      alert('⚠️ En feil oppstod ved sletting av data. Prøv igjen.')
    }
  }

  if (showConfirmation) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px'
        }}>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: '#991b1b'
          }}>
            Er du sikker?
          </p>
          <p style={{
            margin: '0 0 16px 0',
            fontSize: '13px',
            color: '#7f1d1d',
            lineHeight: '1.5'
          }}>
            Dette vil slette alle dine lokalt lagrede data, inkludert:
          </p>
          <ul style={{
            margin: '0 0 16px 0',
            paddingLeft: '20px',
            fontSize: '13px',
            color: '#7f1d1d'
          }}>
            <li>Kartvisningsinnstillinger</li>
            <li>Søkehistorikk</li>
            <li>Brukerpreferanser</li>
            <li>Cache-data (offline-kart)</li>
          </ul>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={handleDeleteData}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626'
              }}
            >
              Ja, slett alt
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={() => setShowConfirmation(true)}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#ffffff',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#dc2626',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2'
          e.currentTarget.style.borderColor = '#fca5a5'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff'
          e.currentTarget.style.borderColor = '#fecaca'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#f87171'
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(220, 38, 38, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#fecaca'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <span style={{
          fontFamily: 'Material Symbols Outlined',
          fontSize: '16px',
          color: '#dc2626'
        }}>
          delete_forever
        </span>
        <span>Slett mine data</span>
      </button>
    </div>
  )
}

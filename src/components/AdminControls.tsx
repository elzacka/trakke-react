import React from 'react'
import { useAdminStore } from '../state/adminStore'

export function AdminControls() {
  const {
    isAuthenticated,
    setShowAdminLogin,
    setShowAdminPanel,
    session
  } = useAdminStore()

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Admin Controls */}
      {isAuthenticated ? (
        /* Admin Panel Button - when logged in */
        <button
          onClick={() => setShowAdminPanel(true)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#15803d',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dcfce7'
            e.currentTarget.style.borderColor = '#86efac'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f0fdf4'
            e.currentTarget.style.borderColor = '#bbf7d0'
          }}
        >
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '16px',
            color: '#15803d'
          }}>
            admin_panel_settings
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span>Admin</span>
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '400' }}>
              {session ? `Login utløper ${new Date(session.expiresAt).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}` : 'Aktiv økt'}
            </span>
          </div>
        </button>
      ) : (
        /* Admin Login Button - when not logged in */
        <button
          onClick={() => setShowAdminLogin(true)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#334155',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc'
            e.currentTarget.style.borderColor = '#cbd5e1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff'
            e.currentTarget.style.borderColor = '#e2e8f0'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#94a3b8'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(148, 163, 184, 0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span style={{
            fontFamily: 'Material Symbols Outlined',
            fontSize: '16px',
            color: '#64748b'
          }}>
            login
          </span>
          <span>Admin</span>
        </button>
      )}
    </div>
  )
}
// Admin Login Modal - Redesigned for 2025 best practices
// Clean, modern, accessible authentication interface

import React, { useState, useEffect } from 'react'
import { useAdminStore } from '../../state/adminStore'
import { Modal } from './Modal'

export const AdminLoginModal: React.FC = () => {
  const {
    showAdminLogin,
    loginStatus,
    loginError,
    login,
    setShowAdminLogin,
    clearLoginError
  } = useAdminStore()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Reset form state when modal closes
  useEffect(() => {
    if (!showAdminLogin) {
      setPassword('')
      setShowPassword(false)
      clearLoginError()
    }
  }, [showAdminLogin, clearLoginError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      await login(password)
    }
  }

  const handleClose = () => setShowAdminLogin(false)
  const isLoading = loginStatus === 'loading'

  return (
    <Modal
      isOpen={showAdminLogin}
      onClose={handleClose}
      ariaLabelledBy="admin-login-heading"
      showHeader={false}
    >
      <div
        style={{
          maxWidth: '320px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '20px',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9'
            e.currentTarget.style.color = '#334155'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#64748b'
          }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9'
            e.currentTarget.style.color = '#334155'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(148, 163, 184, 0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#64748b'
            e.currentTarget.style.boxShadow = 'none'
          }}
          aria-label="Lukk"
        >
          <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px' }}>
            close
          </span>
        </button>

        {/* Heading */}
        <div style={{ marginBottom: '20px' }}>
          <h2
            id="admin-login-heading"
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#334155',
              marginBottom: '4px',
              textAlign: 'left'
            }}
          >
            Admin innlogging
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0',
            lineHeight: '1.4'
          }}>
            Skriv inn passordet for å få tilgang
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="admin-password"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#334155',
                marginBottom: '6px'
              }}
            >
              Passord
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Skriv inn passord"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 36px 0 12px',
                  fontSize: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#7a8471'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                disabled={isLoading}
                autoFocus
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9'
                  e.currentTarget.style.color = '#334155'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                }}
                disabled={isLoading}
                tabIndex={-1}
                aria-label={showPassword ? 'Skjul passord' : 'Vis passord'}
              >
                <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {loginError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#dc2626'
              }}
              role="alert"
            >
              <span style={{
                fontFamily: 'Material Symbols Outlined',
                fontSize: '16px',
                color: '#ef4444',
                marginTop: '1px',
                flexShrink: 0
              }}>
                error
              </span>
              <p style={{ margin: '0', lineHeight: '1.4' }}>{loginError}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: '1',
                height: '40px',
                padding: '0 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#334155',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
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
              disabled={isLoading}
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={!password.trim() || isLoading}
              style={{
                flex: '1',
                height: '40px',
                padding: '0 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                backgroundColor: '#7a8471',
                border: '1px solid #7a8471',
                borderRadius: '6px',
                cursor: password.trim() && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: !password.trim() || isLoading ? '0.6' : '1'
              }}
              onMouseEnter={(e) => {
                if (password.trim() && !isLoading) {
                  e.currentTarget.style.backgroundColor = '#6b7465'
                  e.currentTarget.style.borderColor = '#6b7465'
                }
              }}
              onMouseLeave={(e) => {
                if (password.trim() && !isLoading) {
                  e.currentTarget.style.backgroundColor = '#7a8471'
                  e.currentTarget.style.borderColor = '#7a8471'
                }
              }}
              onFocus={(e) => {
                if (password.trim() && !isLoading) {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(122, 132, 113, 0.2)'
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
              onMouseDown={(e) => {
                if (password.trim() && !isLoading) {
                  e.currentTarget.style.backgroundColor = '#0f595e'
                  e.currentTarget.style.borderColor = '#0f595e'
                  e.currentTarget.style.transform = 'translateY(1px)'
                }
              }}
              onMouseUp={(e) => {
                if (password.trim() && !isLoading) {
                  e.currentTarget.style.backgroundColor = '#6b7465'
                  e.currentTarget.style.borderColor = '#6b7465'
                  e.currentTarget.style.transform = 'none'
                }
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid transparent',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Logger inn...
                </>
              ) : (
                <>
                  <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: '16px' }}>
                    login
                  </span>
                  Logg inn
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

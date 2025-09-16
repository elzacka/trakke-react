import React, { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  ariaLabelledBy?: string
  className?: string
  showHeader?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  ariaLabelledBy,
  className,
  showHeader = true
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const internalTitleIdRef = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`)
  const titleId = ariaLabelledBy || internalTitleIdRef.current
  const labelledBy = ariaLabelledBy || (showHeader ? titleId : undefined)

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [isOpen, onClose])

  // Focus trap and body scroll lock
  useEffect(() => {
    if (!isOpen) return

    // Lock body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the dialog
    const dialog = dialogRef.current
    if (dialog) {
      dialog.focus()
    }

    // Cleanup
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return

    const dialog = dialogRef.current
    if (!dialog) return

    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    dialog.addEventListener('keydown', handleTabKey)
    return () => dialog.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={(e) => {
        // Only close on backdrop click for desktop
        if (e.target === e.currentTarget && window.innerWidth >= 768) {
          onClose()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={className}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 32px rgba(0, 0, 0, 0.15)',
          width: '100%',
          maxWidth: className ? undefined : '760px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
          // Mobile full-screen on small screens
          ...(window.innerWidth < 768 ? {
            width: '100vw',
            height: '100vh',
            maxWidth: 'none',
            maxHeight: 'none',
            borderRadius: '0'
          } : {})
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {showHeader && (
          <div style={{
            padding: window.innerWidth < 768 ? '16px 20px' : '24px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <h2
              id={titleId}
              style={{
                margin: 0,
                fontSize: window.innerWidth < 768 ? '20px' : '24px',
                fontWeight: 'bold',
                color: '#111827'
              }}
            >
              {title || ''}
            </h2>

            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#374151',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc'
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(148, 163, 184, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              aria-label="Lukk modal"
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{
          padding: window.innerWidth < 768 ? '16px 20px' : '24px 32px',
          overflow: 'auto',
          flex: 1
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

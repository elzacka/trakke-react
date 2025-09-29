import React from 'react'
import { Modal } from '../../components/modal/Modal'
import { HURTIGTASTER, ShortcutItem } from './data'

interface HurtigtasterModalProps {
  isOpen: boolean
  onClose: () => void
}

const TokenPill: React.FC<{ token: string; isGesture?: boolean }> = ({ token, isGesture }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 8px',
        borderRadius: '6px',
        fontSize: '13px',
        fontFamily: isGesture ? 'inherit' : 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
        fontWeight: isGesture ? 'normal' : '500',
        minWidth: '2ch',
        backgroundColor: isGesture ? 'transparent' : '#f3f4f6',
        border: isGesture ? '1px dashed #9ca3af' : '1px solid #e5e7eb',
        color: isGesture ? '#6b7280' : '#374151',
        whiteSpace: 'nowrap'
      }}
    >
      {token}
    </span>
  )
}

const ShortcutRow: React.FC<{ shortcut: ShortcutItem }> = ({ shortcut }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: window.innerWidth < 768 ? '12px 16px' : '14px 20px',
        borderBottom: '1px solid #f3f4f6'
      }}
    >
      <span
        style={{
          fontSize: window.innerWidth < 768 ? '14px' : '15px',
          fontWeight: '500',
          color: '#111827'
        }}
      >
        {shortcut.action}
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {shortcut.tokens.map((token, index) => (
          <TokenPill
            key={index}
            token={token}
            isGesture={shortcut.isGesture}
          />
        ))}
      </div>
    </div>
  )
}

export const HurtigtasterModal: React.FC<HurtigtasterModalProps> = ({ isOpen, onClose }) => {
  // Split shortcuts into Mobile and Desktop groups
  const mobileShortcuts = HURTIGTASTER.slice(0, 6)  // First 6 are mobile
  const desktopShortcuts = HURTIGTASTER.slice(6)    // Rest are desktop

  // Determine if we're on mobile
  const isMobile = window.innerWidth < 768

  const renderShortcutList = (shortcuts: ShortcutItem[]) => (
    <div
      style={{
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}
    >
      {shortcuts.map((shortcut, index) => (
        <div
          key={index}
          style={{
            backgroundColor: 'white',
            borderBottom: index < shortcuts.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}
        >
          <ShortcutRow shortcut={shortcut} />
        </div>
      ))}
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Handlinger og hurtigtaster"
      showHeader={false}
      ariaLabelledBy="hurtigtaster-title"
    >
      {/* Custom header without border */}
      <div style={{
        padding: isMobile ? '16px 20px 12px' : '20px 24px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: '600',
          color: '#111827'
        }}>
          Handlinger og hurtigtaster
        </h2>

        <button
          onClick={onClose}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#374151',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
          }}
          aria-label="Lukk modal"
        >
          ×
        </button>
      </div>

      {/* Content without additional wrapper */}
      <div style={{
        padding: isMobile ? '0 20px 20px' : '0 24px 24px'
      }}>
        {/* Show only relevant shortcuts based on device type - no section headers */}
        {isMobile
          ? renderShortcutList(mobileShortcuts)
          : renderShortcutList(desktopShortcuts)
        }
      </div>
    </Modal>
  )
}
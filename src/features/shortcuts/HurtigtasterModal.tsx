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
        padding: window.innerWidth < 768 ? '16px 20px' : '16px 24px',
        borderBottom: '1px solid #f3f4f6'
      }}
    >
      <span
        style={{
          fontSize: '15px',
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

  const renderShortcutGroup = (shortcuts: ShortcutItem[], title: string) => (
    <div style={{ flex: 1 }}>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center'
      }}>
        {title}
      </h3>
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
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Handlinger og hurtigtaster"
      ariaLabelledBy="hurtigtaster-title"
    >
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '800px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          gap: '0',
          flexDirection: 'column'
        }}>
          {/* Show only relevant shortcuts based on device type */}
          {isMobile
            ? renderShortcutGroup(mobileShortcuts, 'Mobil')
            : renderShortcutGroup(desktopShortcuts, 'Desktop')
          }
        </div>
      </div>
    </Modal>
  )
}
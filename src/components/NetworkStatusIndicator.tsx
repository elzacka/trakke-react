import React, { useState, useEffect, useCallback } from 'react'
import './NetworkStatusIndicator.css'

type ConnectionStatus = 'online' | 'offline' | 'reconnecting'

interface NetworkStatusIndicatorProps {
  onShowOfflineInfo?: () => void
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  onShowOfflineInfo
}) => {
  const [status, setStatus] = useState<ConnectionStatus>('online')
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  // Verify connection with actual ping
  const verifyConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small asset from our own domain
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('/favicon.svg', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }, [])

  // Handle going offline
  const handleOffline = useCallback(() => {
    setStatus('offline')
    setIsVisible(true)
    setIsDismissing(false)
  }, [])

  // Handle coming online
  const handleOnline = useCallback(async () => {
    setStatus('reconnecting')
    setIsVisible(true)
    setIsDismissing(false)

    // Verify connection
    const isConnected = await verifyConnection()

    if (isConnected) {
      setStatus('online')

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setIsDismissing(true)
        setTimeout(() => {
          setIsVisible(false)
          setIsDismissing(false)
        }, 500) // Match CSS animation duration
      }, 3000)
    } else {
      // Still offline, revert
      setStatus('offline')
    }
  }, [verifyConnection])

  // Listen for online/offline events
  useEffect(() => {
    // Check initial status
    if (!navigator.onLine) {
      handleOffline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Keyboard handling (Esc to dismiss online banner)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status === 'online' && isVisible) {
        setIsDismissing(true)
        setTimeout(() => {
          setIsVisible(false)
          setIsDismissing(false)
        }, 300)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status, isVisible])

  if (!isVisible) return null

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          bgColor: '#d1fae5',
          borderColor: '#059669',
          textColor: '#065f46',
          icon: '✓',
          message: 'Tilkoblet',
          showAction: false
        }
      case 'reconnecting':
        return {
          bgColor: '#dbeafe',
          borderColor: '#3b82f6',
          textColor: '#1e40af',
          icon: '⟳',
          message: 'Kobler til igjen...',
          showAction: false,
          spinning: true
        }
      case 'offline':
        return {
          bgColor: '#fef3c7',
          borderColor: '#f59e0b',
          textColor: '#92400e',
          icon: '📡',
          message: 'Frakoblet',
          subtitle: 'Noen funksjoner er utilgjengelige',
          showAction: true
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`network-status-indicator ${status} ${isDismissing ? 'dismissing' : ''}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.textColor
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="network-status-content">
        <div className="network-status-icon-wrapper">
          <span
            className={`network-status-icon ${config.spinning ? 'spinning' : ''}`}
            aria-hidden="true"
          >
            {config.icon}
          </span>
        </div>

        <div className="network-status-text">
          <div className="network-status-message">{config.message}</div>
          {config.subtitle && (
            <div className="network-status-subtitle">{config.subtitle}</div>
          )}
        </div>

        {config.showAction && onShowOfflineInfo && (
          <button
            className="network-status-action"
            onClick={onShowOfflineInfo}
            style={{ color: config.textColor, borderColor: config.borderColor }}
          >
            Hva kan jeg gjøre?
          </button>
        )}
      </div>
    </div>
  )
}

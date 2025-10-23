import React, { useEffect, useState } from 'react'
import './InstallPromptModal.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptModalProps {
  onClose: () => void
  onDismiss: () => void
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ onClose, onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')
  const [browser, setBrowser] = useState<'safari' | 'chrome' | 'firefox' | 'edge' | 'other'>('other')

  useEffect(() => {
    // Detect platform and browser
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
    const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent)
    const isFirefox = /firefox/.test(userAgent)
    const isEdge = /edge/.test(userAgent) || /edg\//.test(userAgent)

    if (isIOS) {
      setPlatform('ios')
      setBrowser(isSafari ? 'safari' : 'other')
    } else if (isAndroid) {
      setPlatform('android')
      if (isChrome) setBrowser('chrome')
      else if (isFirefox) setBrowser('firefox')
      else if (isEdge) setBrowser('edge')
    } else {
      setPlatform('desktop')
    }

    // Listen for beforeinstallprompt event (Android/Desktop Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show native install prompt (Android/Desktop Chrome/Edge)
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`PWA install outcome: ${outcome}`)
      setDeferredPrompt(null)
      onClose()
    }
  }

  const handleDontShowAgain = () => {
    onDismiss()
  }

  return (
    <div className="install-prompt-overlay" onClick={onClose}>
      <div className="install-prompt-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="install-prompt-header">
          <div className="install-prompt-icon">
            <span style={{ color: '#3e4533', fontSize: '32px' }}>
              🌲
            </span>
          </div>
          <button
            className="install-prompt-close"
            onClick={onClose}
            aria-label="Lukk"
          >
            ×
          </button>
        </div>

        {/* Title */}
        <h2 className="install-prompt-title">Bruke Tråkke som app?</h2>

        {/* Platform-specific instructions */}
        <div className="install-prompt-instructions">
          {platform === 'ios' && browser === 'safari' && (
            <>
              <p className="install-prompt-description">
                Følg disse stegene:
              </p>
              <ol className="install-prompt-steps">
                <li>
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <span className="step-text">
                      Trykk på <strong>de tre prikkene</strong> nederst til høyre
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <span className="step-text">
                      Trykk <strong>Del-ikonet</strong>
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <span className="step-text">
                      Sveip opp og velg <strong>«Legg til på Hjem-skjerm»</strong>
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <span className="step-text">
                      Velg <strong>«Åpne som nettapp»</strong>
                    </span>
                  </div>
		</li>
                <li>
                  <span className="step-number">5</span>
                  <div className="step-content">
                    <span className="step-text">
                      Trykk <strong>«Legg til»</strong> i høyre hjørne
                    </span>
                  </div>
                </li>
              </ol>
              <div className="install-prompt-note">
                <span style={{ fontSize: '18px' }}>ℹ️</span>
                <span>Dette fungerer kun i Safari på iOS</span>
              </div>
            </>
          )}

          {platform === 'ios' && browser !== 'safari' && (
            <>
              <p className="install-prompt-description">
                For å installere Tråkke på din iPhone må du åpne denne siden i <strong>Safari</strong>.
              </p>
              <div className="install-prompt-note">
                <span style={{ fontSize: '18px' }}>ℹ️</span>
                <span>Kopier lenken og åpne den i Safari-nettleseren</span>
              </div>
            </>
          )}

          {platform === 'android' && deferredPrompt && (
            <>
              <p className="install-prompt-description">
                Installer Tråkke for raskere tilgang og bedre ytelse
              </p>
              <button
                className="install-prompt-install-btn"
                onClick={handleInstallClick}
              >
                <span style={{ fontSize: '20px' }}>⬇️</span>
                Installer nå
              </button>
            </>
          )}

          {platform === 'android' && !deferredPrompt && (
            <>
              <p className="install-prompt-description">
                Følg disse stegene for å installere Tråkke:
              </p>
              <ol className="install-prompt-steps">
                <li>
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <span className="step-text">
                      Trykk på <strong>meny-ikonet</strong> (<span style={{ fontSize: '16px', verticalAlign: 'middle' }}>⋮</span>) øverst til høyre
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <span className="step-text">
                      Velg <strong>«Legg til på startsiden»</strong> eller <strong>«Installer app»</strong>
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <span className="step-text">
                      Bekreft installasjonen
                    </span>
                  </div>
                </li>
              </ol>
            </>
          )}

          {platform === 'desktop' && (
            <>
              <p className="install-prompt-description">
                Installer Tråkke for raskere tilgang og offline-støtte
              </p>
              {deferredPrompt && (
                <button
                  className="install-prompt-install-btn"
                  onClick={handleInstallClick}
                >
                  <span style={{ fontSize: '20px' }}>⬇️</span>
                  Installer nå
                </button>
              )}
              {!deferredPrompt && (
                <div className="install-prompt-note">
                  <span style={{ fontSize: '18px' }}>ℹ️</span>
                  <span>Installasjon er tilgjengelig i Chrome, Edge og andre Chromium-baserte nettlesere</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer buttons */}
        <div className="install-prompt-footer">
          <button
            className="install-prompt-dismiss-btn"
            onClick={handleDontShowAgain}
          >
            Ikke vis igjen
          </button>
          <button
            className="install-prompt-later-btn"
            onClick={onClose}
          >
            Kanskje senere
          </button>
        </div>
      </div>
    </div>
  )
}

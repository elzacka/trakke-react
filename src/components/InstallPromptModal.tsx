import React, { useEffect, useState } from 'react'
import './InstallPromptModal.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptModalProps {
  onClose: () => void
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ onClose }) => {
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

    // Listen for appinstalled event to track successful installations
    const handleAppInstalled = () => {
      console.log('[PWA] App successfully installed')
      // Store installation timestamp for analytics
      try {
        localStorage.setItem('trakke_installed_at', new Date().toISOString())
        localStorage.setItem('trakke_installed', 'true')
      } catch {
        // Silent fail if localStorage is unavailable
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show native install prompt (Android/Desktop Chrome/Edge)
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      // Track installation outcome
      if (outcome === 'accepted') {
        // User accepted the install prompt - installation is in progress
        console.log('[PWA] User accepted install prompt')
      } else {
        // User dismissed the install prompt
        console.log('[PWA] User dismissed install prompt')
      }

      setDeferredPrompt(null)
      onClose()
    }
  }

  return (
    <div className="install-prompt-overlay" onClick={onClose}>
      <div className="install-prompt-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with Title */}
        <div className="install-prompt-header">
          <h2 className="install-prompt-title">Bruke Tråkke som app?</h2>
          <button
            className="install-prompt-close"
            onClick={onClose}
            aria-label="Lukk"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Platform-specific instructions */}
        <div className="install-prompt-instructions">
          {platform === 'ios' && browser === 'safari' && (
            <>
              <ol className="install-prompt-steps">
                <li>
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <span className="step-text">
                      Trykk på <strong>de tre prikkene</strong> nederst
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <span className="step-text">
                      Trykk <strong>Del</strong>
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <span className="step-text">
                      Sveip <strong>opp</strong>
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <span className="step-text">
                      Trykk <strong>Legg til på Hjem-skjerm</strong>
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-number">5</span>
                  <div className="step-content">
                    <span className="step-text">
                      Velg <strong>Åpne som nettapp</strong>
                    </span>
                  </div>
		</li>
                <li>
                  <span className="step-number">6</span>
                  <div className="step-content">
                    <span className="step-text">
                      Trykk <strong>Legg til</strong>
                    </span>
                  </div>
                </li>
              </ol>
              <div className="install-prompt-note">
                Dette funker kun i Safari på iOS
              </div>
            </>
          )}

          {platform === 'ios' && browser !== 'safari' && (
            <>
              <p className="install-prompt-description">
                For å bruke Tråkke som app må du åpne denne siden i <strong>Safari</strong>.
              </p>
              <div className="install-prompt-note">
                <span className="material-symbols-outlined">info</span>
                <span>Kopier lenken og åpne den i Safari-nettleseren</span>
              </div>
            </>
          )}

          {platform === 'android' && deferredPrompt && (
            <>
              <p className="install-prompt-description">
                Bruke Tråkke som app?
              </p>
              <button
                className="install-prompt-install-btn"
                onClick={handleInstallClick}
              >
                <span className="material-symbols-outlined">download</span>
                Installer nå
              </button>
            </>
          )}

          {platform === 'android' && !deferredPrompt && (
            <>
              <p className="install-prompt-description">
                Følg disse stegene:
              </p>
              <ol className="install-prompt-steps">
                <li>
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <span className="step-text">
                      Trykk på <strong>meny-ikonet</strong> (<span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle' }}>more_vert</span>) øverst til høyre
                    </span>
                  </div>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <span className="step-text">
                      Velg <strong>Legg til på startsiden</strong> eller <strong>Installer app</strong>
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
                Bruke Tråkke som app?
              </p>
              {deferredPrompt && (
                <button
                  className="install-prompt-install-btn"
                  onClick={handleInstallClick}
                >
                  <span className="material-symbols-outlined">download</span>
                  Installer nå
                </button>
              )}
              {!deferredPrompt && (
                <div className="install-prompt-note">
                  <span className="material-symbols-outlined">info</span>
                  <span>Installasjon er tilgjengelig i Chrome, Edge og andre Chromium-baserte nettlesere</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer button */}
        <div className="install-prompt-footer">
          <button
            className="install-prompt-understand-btn"
            onClick={onClose}
          >
            Skjønner
          </button>
        </div>
      </div>
    </div>
  )
}

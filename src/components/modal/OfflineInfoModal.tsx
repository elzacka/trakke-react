import React from 'react'
import './OfflineInfoModal.css'

interface OfflineInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export const OfflineInfoModal: React.FC<OfflineInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="offline-info-overlay" onClick={onClose}>
      <div className="offline-info-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="offline-info-header">
          <h2 className="offline-info-title">📡 Frakoblet modus</h2>
          <button
            className="offline-info-close"
            onClick={onClose}
            aria-label="Lukk"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="offline-info-content">
          <p className="offline-info-intro">
            Du er for øyeblikket uten internettilkobling. Her er hva som funker og ikke funker:
          </p>

          {/* What Works */}
          <div className="offline-info-section">
            <h3 className="offline-info-section-title available">
              <span className="offline-info-section-icon">✓</span>
              Fungerer uten nett
            </h3>
            <ul className="offline-info-list">
              <li>
                <span className="list-icon">🗺️</span>
                <div>
                  <strong>Kart</strong>
                  <span className="list-detail">Tidligere besøkte områder er tilgjengelige</span>
                </div>
              </li>
              <li>
                <span className="list-icon">📍</span>
                <div>
                  <strong>Min posisjon</strong>
                  <span className="list-detail">GPS-posisjon virker fortsatt</span>
                </div>
              </li>
              <li>
                <span className="list-icon">📏</span>
                <div>
                  <strong>Avstandsmåling</strong>
                  <span className="list-detail">Kan måle avstander på kartet</span>
                </div>
              </li>
              <li>
                <span className="list-icon">🧭</span>
                <div>
                  <strong>Navigasjon</strong>
                  <span className="list-detail">Pan, zoom og roter kartet</span>
                </div>
              </li>
            </ul>
          </div>

          {/* What Doesn't Work */}
          <div className="offline-info-section">
            <h3 className="offline-info-section-title unavailable">
              <span className="offline-info-section-icon">✗</span>
              Krever internett
            </h3>
            <ul className="offline-info-list">
              <li>
                <span className="list-icon">🔍</span>
                <div>
                  <strong>Søk</strong>
                  <span className="list-detail">Stedssøk og koordinatsøk</span>
                </div>
              </li>
              <li>
                <span className="list-icon">📌</span>
                <div>
                  <strong>Interessepunkter (POI)</strong>
                  <span className="list-detail">Nye POI-er kan ikke lastes</span>
                </div>
              </li>
              <li>
                <span className="list-icon">🥾</span>
                <div>
                  <strong>Turløyper</strong>
                  <span className="list-detail">Turløype-data krever tilkobling</span>
                </div>
              </li>
              <li>
                <span className="list-icon">🌲</span>
                <div>
                  <strong>Naturskogslag</strong>
                  <span className="list-detail">Overlay-lag krever tilkobling</span>
                </div>
              </li>
              <li>
                <span className="list-icon">🗺️</span>
                <div>
                  <strong>Nye kartområder</strong>
                  <span className="list-detail">Kun allerede besøkte områder vises</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Tips Section */}
          <div className="offline-info-tips">
            <h3 className="offline-info-section-title tips">
              <span className="offline-info-section-icon">💡</span>
              Tips for offline bruk
            </h3>
            <div className="offline-info-tip-content">
              <p>
                <strong>Forbered deg:</strong> Besøk områdene du skal utforske mens du har nett.
                Kartet vil da bli lagret lokalt for offline bruk.
              </p>
              <p>
                <strong>Databruk:</strong> Kartflis lagres i 30 dager, så du kan utforske uten konstant tilkobling.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="offline-info-footer">
          <button
            className="offline-info-button"
            onClick={onClose}
          >
            Skjønner
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import type { Trail, ElevationPoint } from '../data/trails'
import { TurrutebasenService } from '../services/turrutebasenService'

interface TrailDetailsProps {
  trail: Trail | null
  onClose: () => void
}

export function TrailDetails({ trail, onClose }: TrailDetailsProps) {
  const [elevationProfile, setElevationProfile] = useState<ElevationPoint[]>([])
  const [loadingElevation, setLoadingElevation] = useState(false)

  // Load elevation profile when trail changes
  useEffect(() => {
    if (!trail) {
      setElevationProfile([])
      return
    }

    const loadElevationProfile = async () => {
      setLoadingElevation(true)
      try {
        const profile = await TurrutebasenService.getElevationProfile(trail, 30)
        setElevationProfile(profile)
      } catch (error) {
        console.error('Failed to load elevation profile:', error)
        setElevationProfile([])
      } finally {
        setLoadingElevation(false)
      }
    }

    void loadElevationProfile()
  }, [trail])

  if (!trail) return null

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  const formatDuration = (minutes: number | undefined): string => {
    if (!minutes) return 'Ukjent varighet'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}t ${mins}min`
    }
    return `${mins}min`
  }

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return '#22c55e'
      case 'medium': return '#f59e0b'
      case 'hard': return '#ef4444'
      case 'expert': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'hiking': return 'hiking'
      case 'skiing': return 'downhill_skiing'
      case 'cycling': return 'directions_bike'
      case 'mixed': return 'sports'
      default: return 'route'
    }
  }

  const getTypeName = (type: string): string => {
    switch (type) {
      case 'hiking': return 'Fottur'
      case 'skiing': return 'Ski'
      case 'cycling': return 'Sykkel'
      case 'mixed': return 'Blandet'
      default: return 'Annet'
    }
  }

  const getDifficultyName = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'Lett'
      case 'medium': return 'Middels'
      case 'hard': return 'Vanskelig'
      case 'expert': return 'Ekspert'
      default: return 'Ukjent'
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: window.innerWidth < 768 ? '20px' : '28px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              lineHeight: '1.3'
            }}>
              {trail.properties.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'Material Symbols Outlined',
                fontSize: '16px',
                color: getDifficultyColor(trail.properties.difficulty)
              }}>
                {getTypeIcon(trail.properties.type)}
              </span>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {getTypeName(trail.properties.type)}
              </span>
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#d1d5db'
              }} />
              <div style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: getDifficultyColor(trail.properties.difficulty),
                color: 'white',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {getDifficultyName(trail.properties.difficulty)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '16px'
            }}
          >
            <span style={{
              fontFamily: 'Material Symbols Outlined',
              fontSize: '24px',
              color: '#6b7280'
            }}>
              close
            </span>
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              {formatDistance(trail.properties.distance)}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Avstand</div>
          </div>

          {trail.properties.estimatedTime && (
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {formatDuration(trail.properties.estimatedTime)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Estimert tid</div>
            </div>
          )}

          {trail.properties.elevationGain && (
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {trail.properties.elevationGain}m
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Stigning</div>
            </div>
          )}
        </div>

        {/* Description */}
        {trail.properties.description && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Beskrivelse
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
              {trail.properties.description}
            </p>
          </div>
        )}

        {/* Location */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            Lokasjon
          </h3>
          <div style={{ fontSize: '14px', color: '#374151' }}>
            {trail.properties.municipality}
            {trail.properties.county && trail.properties.county !== trail.properties.municipality && (
              <span>, {trail.properties.county}</span>
            )}
          </div>
        </div>

        {/* Elevation Profile */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            Høydeprofil
          </h3>

          {loadingElevation ? (
            <div style={{
              height: '120px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Laster høydeprofil...
            </div>
          ) : elevationProfile.length > 0 ? (
            <div style={{
              height: '120px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              padding: '12px',
              position: 'relative'
            }}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 400 80"
                style={{ overflow: 'visible' }}
              >
                {/* Generate elevation path */}
                {(() => {
                  if (elevationProfile.length < 2) return null

                  const maxDistance = Math.max(...elevationProfile.map(p => p.distance))
                  const minElevation = Math.min(...elevationProfile.map(p => p.elevation))
                  const maxElevation = Math.max(...elevationProfile.map(p => p.elevation))
                  const elevationRange = maxElevation - minElevation || 1

                  const points = elevationProfile.map(point => {
                    const x = (point.distance / maxDistance) * 400
                    const y = 80 - ((point.elevation - minElevation) / elevationRange) * 80
                    return `${x},${y}`
                  }).join(' ')

                  return (
                    <>
                      {/* Fill area under curve */}
                      <polygon
                        points={`0,80 ${points} ${400},80`}
                        fill="#3e4533"
                        fillOpacity="0.1"
                      />
                      {/* Elevation line */}
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#3e4533"
                        strokeWidth="2"
                      />
                      {/* Labels */}
                      <text x="5" y="15" fontSize="10" fill="#6b7280">
                        {Math.round(maxElevation)}m
                      </text>
                      <text x="5" y="75" fontSize="10" fill="#6b7280">
                        {Math.round(minElevation)}m
                      </text>
                      <text x="350" y="75" fontSize="10" fill="#6b7280">
                        {formatDistance(maxDistance)}
                      </text>
                    </>
                  )
                })()}
              </svg>
            </div>
          ) : (
            <div style={{
              height: '120px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Ingen høydedata tilgjengelig
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            Detaljer
          </h3>
          <div style={{ fontSize: '14px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {trail.properties.surface && (
              <div>
                <strong>Underlag:</strong> {trail.properties.surface}
              </div>
            )}
            {trail.properties.maintainer && (
              <div>
                <strong>Vedlikeholder:</strong> {trail.properties.maintainer}
              </div>
            )}
            {trail.metadata.source && (
              <div>
                <strong>Datakilde:</strong> {trail.metadata.source}
              </div>
            )}
            <div>
              <strong>Sist oppdatert:</strong> {new Date(trail.metadata.lastUpdated).toLocaleDateString('no-NO')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
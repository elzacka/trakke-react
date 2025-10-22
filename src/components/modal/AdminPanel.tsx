// Admin Panel - POI Management Interface
// Provides secure admin functionality for adding and editing POIs

import React, { useState, useEffect } from 'react'
import { useAdminStore, ADMIN_PERMISSIONS } from '../../state/adminStore'
import { Modal } from './Modal'
import { getCategoryHierarchy, CategoryState, POIType } from '../../data/pois'
import { poiDataService } from '../../services/poiDataService'

interface AdminPanelProps {
  onCategoryToggle?: (nodeId: string) => void
  categoryState?: CategoryState
  onPOIAdded?: () => void
}

export interface POIFormData {
  name: string
  description: string
  lat: number
  lng: number
  type: string
  subcategory?: string
  source: string
  website?: string
  phone?: string
  address?: string
}

const initialFormData: POIFormData = {
  name: '',
  description: '',
  lat: 0,
  lng: 0,
  type: '',
  subcategory: '',
  source: 'admin',
  website: '',
  phone: '',
  address: ''
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onCategoryToggle, categoryState, onPOIAdded }) => {
  const {
    showAdminPanel,
    session,
    logout,
    setShowAdminPanel,
    hasPermission
  } = useAdminStore()

  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add')
  const [formData, setFormData] = useState<POIFormData>(initialFormData)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')

  // Initialize coordinates from map center if available
  useEffect(() => {
    if (showAdminPanel && formData.lat === 0 && formData.lng === 0) {
      // TODO: Get current map center coordinates
      // For now, default to Oslo coordinates
      setFormData(prev => ({
        ...prev,
        lat: 59.9139,
        lng: 10.7522
      }))
    }
  }, [showAdminPanel, formData.lat, formData.lng])

  const handleClose = () => {
    setShowAdminPanel(false)
    setFormData(initialFormData)
    setSaveStatus('idle')
    setSaveMessage('')
  }

  const handleInputChange = (field: keyof POIFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Navn er påkrevd'
    if (!formData.description.trim()) return 'Beskrivelse er påkrevd'
    if (!formData.type) return 'Kategori er påkrevd'
    if (formData.lat < -90 || formData.lat > 90) return 'Ugyldig breddegrad'
    if (formData.lng < -180 || formData.lng > 180) return 'Ugyldig lengdegrad'

    // Basic URL validation if website is provided
    if (formData.website?.trim()) {
      try {
        new URL(formData.website.startsWith('http') ? formData.website : `https://${formData.website}`)
      } catch {
        return 'Ugyldig nettside URL'
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setSaveStatus('error')
      setSaveMessage(validationError)
      return
    }

    if (!hasPermission(ADMIN_PERMISSIONS.POI_MANAGE)) {
      setSaveStatus('error')
      setSaveMessage('Ingen tilgang til POI-administrasjon')
      return
    }

    setSaveStatus('saving')
    setSaveMessage('')

    try {
      // Save POI using the data service
      const result = await poiDataService.addPOI({
        name: formData.name.trim(),
        description: formData.description.trim(),
        lat: formData.lat,
        lng: formData.lng,
        type: formData.type as POIType, // Cast to POI type
        subcategory: formData.subcategory ?? undefined,
        website: formData.website?.trim() ?? undefined,
        phone: formData.phone?.trim() ?? undefined,
        address: formData.address?.trim() ?? undefined,
        color: '#3b82f6' // Default color, will be overridden by category
      })

      if (result.success) {
        setSaveStatus('success')
        setSaveMessage('✅ POI lagret og kategorien er aktivert!')

        // Enable the subcategory that the POI was added to
        if (onCategoryToggle && categoryState && formData.type) {
          const isCurrentlyEnabled = categoryState.checked[formData.type]
          if (!isCurrentlyEnabled) {
            console.log(`🏷️ Auto-enabling category: ${formData.type}`)
            onCategoryToggle(formData.type)
          }
        }

        // Trigger POI data refresh
        if (onPOIAdded) {
          onPOIAdded()
        }

        // Reset form after successful save with longer delay for better UX
        setTimeout(() => {
          setFormData(initialFormData)
          setSaveStatus('idle')
          setSaveMessage('')
        }, 3000)
      } else {
        setSaveStatus('error')
        setSaveMessage(result.message)
      }

    } catch (error) {
      console.error('Error saving POI:', error)
      setSaveStatus('error')
      setSaveMessage('Feil ved lagring av POI')
    }
  }

  const categoryOptions = getCategoryHierarchy()

  if (!showAdminPanel) return null

  return (
    <Modal
      isOpen={showAdminPanel}
      onClose={handleClose}
      title=""
      className="max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl"
    >
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 mb-8 rounded-xl border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
              <span className="material-symbols-outlined text-white text-xl">
                admin_panel_settings
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Admin Panel</h3>
              <p className="text-sm text-gray-600 flex items-center">
                <span className="material-symbols-outlined text-green-500 text-sm mr-1">verified</span>
                Autentisert • Utløper {session ? new Date(session.expiresAt).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) : 'Ukjent'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center shadow-lg hover:shadow-xl"
          >
            <span className="material-symbols-outlined mr-2 text-lg">
              logout
            </span>
            Logg ut
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-8 bg-gray-100 rounded-xl p-1.5 shadow-inner">
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
            activeTab === 'add'
              ? 'bg-white text-blue-600 shadow-lg transform scale-[1.02]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span className="material-symbols-outlined text-lg mr-2">
            add_location
          </span>
          Legg til POI
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
            activeTab === 'manage'
              ? 'bg-white text-blue-600 shadow-lg transform scale-[1.02]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span className="material-symbols-outlined text-lg mr-2">
            edit_location
          </span>
          Administrer POI
        </button>
      </div>

      {/* Add POI Tab */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="material-symbols-outlined text-blue-600">
                  add_location
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Nytt interessepunkt</h3>
                <p className="text-sm text-gray-600">Fyll ut informasjonen under for å legge til et nytt POI</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Navn *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400 text-lg">
                        location_on
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="F.eks. Preikestolen, Geirangerfjord"
                    />
                  </div>
                </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Kategori *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-lg">
                    category
                  </span>
                </div>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-gray-900"
                >
                  <option value="" className="text-gray-500">Velg underkategori for POI</option>
                  {categoryOptions.map(option => (
                    <option
                      key={option.value}
                      value={option.isMainCategory ? '' : option.value}
                      disabled={option.isMainCategory}
                      className={option.isMainCategory
                        ? 'font-semibold text-gray-900 bg-gray-100'
                        : 'text-gray-700 pl-4'
                      }
                    >
                      {option.isMainCategory ? `── ${option.label.toUpperCase()} ──` : option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-lg">
                    expand_more
                  </span>
                </div>
              </div>
              {formData.type && (
                <div className="mt-2 text-xs text-gray-600 flex items-center">
                  <span className="material-symbols-outlined text-green-500 text-sm mr-1">
                    check_circle
                  </span>
                  {categoryOptions.find(opt => opt.value === formData.type)?.mainCategoryName} kategori valgt
                </div>
              )}
            </div>
          </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Beskrivelse *
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 text-lg">
                      description
                    </span>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                    placeholder="Beskriv stedet, aktiviteter, fasiliteter og andre relevante detaljer..."
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-3">
                    <span className="material-symbols-outlined text-blue-600 mr-2">
                      my_location
                    </span>
                    <h4 className="text-sm font-semibold text-blue-900">Koordinater</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Breddegrad (Latitude) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.lat}
                        onChange={(e) => handleInputChange('lat', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-mono"
                        placeholder="59.9139"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lengdegrad (Longitude) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.lng}
                        onChange={(e) => handleInputChange('lng', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-mono"
                        placeholder="10.7522"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2 flex items-center">
                    <span className="material-symbols-outlined text-xs mr-1">info</span>
                    Koordinater brukes for å plassere POI-et på kartet
                  </p>
                </div>
              </div>

              {/* Optional fields */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-gray-600">
                    tune
                  </span>
                  Tilleggsinformasjon (valgfritt)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nettside
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400 text-lg">
                          language
                        </span>
                      </div>
                      <input
                        type="url"
                        value={formData.website ?? ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400 text-lg">
                          phone
                        </span>
                      </div>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="+47 12 34 56 78"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400 text-lg">
                          home
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="Gateadresse, postnummer, sted"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {saveMessage && (
                <div className={`p-4 rounded-lg animate-in slide-in-from-top-2 duration-300 ${
                  saveStatus === 'success' ? 'bg-green-50 border border-green-200' :
                  saveStatus === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-start">
                    <span className={`material-symbols-outlined mr-3 flex-shrink-0 mt-0.5 ${
                      saveStatus === 'success' ? 'text-green-500' :
                      saveStatus === 'error' ? 'text-red-500' :
                      'text-blue-500'
                    }`}>
                      {saveStatus === 'success' ? 'check_circle' :
                       saveStatus === 'error' ? 'error' : 'info'}
                    </span>
                    <div>
                      <h4 className={`text-sm font-semibold mb-1 ${
                        saveStatus === 'success' ? 'text-green-800' :
                        saveStatus === 'error' ? 'text-red-800' :
                        'text-blue-800'
                      }`}>
                        {saveStatus === 'success' ? '🎉 Suksess!' :
                         saveStatus === 'error' ? 'Feil oppstod' : 'Informasjon'}
                      </h4>
                      <p className={`text-sm ${
                        saveStatus === 'success' ? 'text-green-700' :
                        saveStatus === 'error' ? 'text-red-700' :
                        'text-blue-700'
                      }`}>
                        {saveMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-4 pt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-gray-500/20 transition-all duration-200"
                >
                  <span className="material-symbols-outlined mr-2 text-lg">
                    close
                  </span>
                  Lukk
                </button>
                <button
                  type="submit"
                  disabled={saveStatus === 'saving'}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-3 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Lagrer POI...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined mr-2 text-lg">
                        save
                      </span>
                      Lagre POI
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage POI Tab */}
      {activeTab === 'manage' && (
        <div className="max-h-96 overflow-y-auto">
          <div className="text-center py-8 text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2">construction</span>
            <p>POI-administrasjon kommer snart</p>
            <p className="text-sm mt-1">Funksjoner for redigering og sletting av eksisterende POI-er</p>
          </div>
        </div>
      )}
    </Modal>
  )
}
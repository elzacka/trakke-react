// Admin Login Modal - Secure authentication interface
// Provides user-friendly login form with security feedback

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

  // Clear form when modal opens/closes
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

  const handleClose = () => {
    setShowAdminLogin(false)
  }

  const isLoading = loginStatus === 'loading'

  return (
    <Modal
      isOpen={showAdminLogin}
      onClose={handleClose}
      title=""
      className="max-w-md shadow-2xl"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
          <span className="material-symbols-outlined text-white text-2xl">
            admin_panel_settings
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin innlogging</h2>
        <p className="text-gray-600">Logg inn for å administrere POI-er</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-700 mb-3">
            Passord
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-lg">
                lock
              </span>
            </div>
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Skriv inn ditt passord"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200 text-gray-900 placeholder-gray-500"
              disabled={isLoading}
              autoFocus
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded transition-colors duration-200"
              disabled={isLoading}
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {loginError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start">
              <span className="material-symbols-outlined text-red-500 mr-3 flex-shrink-0 mt-0.5">
                error
              </span>
              <div>
                <h4 className="text-sm font-semibold text-red-800 mb-1">Innlogging feilet</h4>
                <p className="text-sm text-red-700">{loginError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-gray-500/20 disabled:opacity-50 transition-all duration-200"
            disabled={isLoading}
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={!password.trim() || isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-3 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Logger inn...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2 text-lg">
                  login
                </span>
                Logg inn
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <span className="material-symbols-outlined text-blue-500 mr-3 flex-shrink-0 mt-0.5">
            shield
          </span>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Sikkerhetsinformasjon</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li className="flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                Maksimalt 5 innloggingsforsøk
              </li>
              <li className="flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                Automatisk utlogging etter 30 minutter
              </li>
              <li className="flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                Krypterte sesjoner og sikker lagring
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  )
}
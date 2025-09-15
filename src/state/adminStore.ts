// Admin State Management - Centralized admin authentication and permissions
// Integrates with AdminService for secure session management

import { create } from 'zustand'
import { adminService, AdminSession } from '../services/adminService'

export interface AdminState {
  // Authentication state
  isAuthenticated: boolean
  session: AdminSession | null
  loginStatus: 'idle' | 'loading' | 'success' | 'error'
  loginError: string | null

  // UI state
  showAdminLogin: boolean
  showAdminPanel: boolean

  // Admin actions
  login: (password: string) => Promise<void>
  logout: () => void
  checkAuthentication: () => void
  extendSession: () => void

  // UI actions
  setShowAdminLogin: (show: boolean) => void
  setShowAdminPanel: (show: boolean) => void
  clearLoginError: () => void

  // Permissions
  hasPermission: (permission: string) => boolean
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  session: null,
  loginStatus: 'idle',
  loginError: null,
  showAdminLogin: false,
  showAdminPanel: false,

  // Authentication actions
  login: async (password: string) => {
    set({ loginStatus: 'loading', loginError: null })

    try {
      const result = await adminService.login(password)

      if (result.success) {
        const session = adminService.getCurrentSession()
        set({
          isAuthenticated: true,
          session,
          loginStatus: 'success',
          loginError: null,
          showAdminLogin: false,
          showAdminPanel: true
        })

        console.log('✅ Admin login successful - session established')
      } else {
        set({
          isAuthenticated: false,
          session: null,
          loginStatus: 'error',
          loginError: result.message
        })
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      set({
        isAuthenticated: false,
        session: null,
        loginStatus: 'error',
        loginError: 'Login failed due to system error'
      })
    }
  },

  logout: () => {
    adminService.logout()
    set({
      isAuthenticated: false,
      session: null,
      loginStatus: 'idle',
      loginError: null,
      showAdminLogin: false,
      showAdminPanel: false
    })
    console.log('🔓 Admin logged out - session cleared')
  },

  checkAuthentication: () => {
    const isValid = adminService.isAuthenticated()
    const session = adminService.getCurrentSession()

    set({
      isAuthenticated: isValid,
      session: isValid ? session : null
    })

    // If session expired, ensure UI is updated
    if (!isValid && get().showAdminPanel) {
      set({ showAdminPanel: false })
    }
  },

  extendSession: () => {
    if (get().isAuthenticated) {
      adminService.extendSession()
      const session = adminService.getCurrentSession()
      set({ session })
    }
  },

  // UI actions
  setShowAdminLogin: (show: boolean) => {
    set({ showAdminLogin: show })
    if (show) {
      set({ loginError: null, loginStatus: 'idle' })
    }
  },

  setShowAdminPanel: (show: boolean) => {
    // Only allow showing admin panel if authenticated
    if (show && !get().isAuthenticated) {
      set({ showAdminLogin: true })
      return
    }
    set({ showAdminPanel: show })
  },

  clearLoginError: () => {
    set({ loginError: null, loginStatus: 'idle' })
  },

  // Permissions
  hasPermission: (permission: string) => {
    return adminService.hasPermission(permission)
  }
}))

// Session monitoring utilities - to be used in components
export const createSessionMonitoring = () => {
  const checkAuthentication = useAdminStore.getState().checkAuthentication
  const extendSession = useAdminStore.getState().extendSession

  // Session check interval
  const startSessionMonitoring = () => {
    const interval = setInterval(() => {
      checkAuthentication()
    }, 30000)
    return interval
  }

  // Activity-based session extension
  const startActivityMonitoring = () => {
    const handleActivity = () => {
      extendSession()
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }

  return { startSessionMonitoring, startActivityMonitoring }
}

// Admin permission constants
export const ADMIN_PERMISSIONS = {
  POI_MANAGE: 'poi_manage',
  DATA_EXPORT: 'data_export',
  DATA_IMPORT: 'data_import'
} as const

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS]
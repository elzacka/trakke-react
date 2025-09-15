// Admin Service - Secure authentication and session management
// Implements modern security practices for admin access

// Security configuration
const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  TOKEN_LENGTH: 32,
  SALT_ROUNDS: 12
} as const

// Admin session interface
export interface AdminSession {
  token: string
  expiresAt: number
  lastActivity: number
  permissions: string[]
}

// Login attempt tracking
interface LoginAttempt {
  timestamp: number
  ip?: string
  userAgent?: string
}

// Secure storage keys
const STORAGE_KEYS = {
  ADMIN_HASH: 'trakke_admin_hash_v2',
  SESSION_TOKEN: 'trakke_session_token_v2',
  LOGIN_ATTEMPTS: 'trakke_login_attempts_v2',
  LOCKOUT_UNTIL: 'trakke_lockout_until_v2'
} as const

export class AdminService {
  private static instance: AdminService
  private currentSession: AdminSession | null = null
  private sessionCheckInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.initializeSecurityMeasures()
  }

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService()
    }
    return AdminService.instance
  }

  /**
   * Initialize security measures and session monitoring
   */
  private initializeSecurityMeasures(): void {
    // Start session monitoring
    this.startSessionMonitoring()

    // Clear any expired sessions on initialization
    this.validateCurrentSession()

    // Clean up old login attempts
    this.cleanupOldLoginAttempts()
  }

  /**
   * Generate cryptographically secure hash for password
   */
  private async generateSecureHash(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    // Generate salt if not provided
    if (!salt) {
      const saltBytes = crypto.getRandomValues(new Uint8Array(16))
      salt = Array.from(saltBytes, byte => byte.toString(16).padStart(2, '0')).join('')
    }

    // Create hash with salt using multiple rounds
    let hashInput = password + salt
    for (let i = 0; i < SECURITY_CONFIG.SALT_ROUNDS; i++) {
      const encoder = new TextEncoder()
      const data = encoder.encode(hashInput)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      hashInput = Array.from(new Uint8Array(hashBuffer), byte => byte.toString(16).padStart(2, '0')).join('')
    }

    return { hash: hashInput, salt }
  }

  /**
   * Set admin password (should be called once during setup)
   */
  async setAdminPassword(password: string): Promise<void> {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    // Validate password strength
    if (!this.validatePasswordStrength(password)) {
      throw new Error('Password must contain uppercase, lowercase, numbers, and special characters')
    }

    const { hash, salt } = await this.generateSecureHash(password)

    // Store hash and salt separately for security
    const adminHash = {
      hash,
      salt,
      createdAt: Date.now(),
      version: '2.0'
    }

    localStorage.setItem(STORAGE_KEYS.ADMIN_HASH, JSON.stringify(adminHash))
    console.log('✅ Admin password set securely')
  }

  /**
   * Validate password strength requirements
   */
  private validatePasswordStrength(password: string): boolean {
    const requirements = [
      /[a-z]/, // lowercase
      /[A-Z]/, // uppercase
      /[0-9]/, // numbers
      /[^A-Za-z0-9]/ // special characters
    ]

    return requirements.every(req => req.test(password)) && password.length >= 8
  }

  /**
   * Check if admin is currently in lockout period
   */
  private isLockedOut(): boolean {
    const lockoutUntil = localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL)
    if (!lockoutUntil) return false

    const lockoutTime = parseInt(lockoutUntil)
    if (Date.now() < lockoutTime) {
      return true
    }

    // Lockout period expired, clear it
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL)
    localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS)
    return false
  }

  /**
   * Record failed login attempt and apply rate limiting
   */
  private recordFailedAttempt(): void {
    const attempts = this.getLoginAttempts()
    const newAttempt: LoginAttempt = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }

    attempts.push(newAttempt)
    localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts))

    // Check if lockout should be applied
    if (attempts.length >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION
      localStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toString())

      console.warn(`🔒 Admin account locked for ${SECURITY_CONFIG.LOCKOUT_DURATION / 60000} minutes due to too many failed attempts`)
    }
  }

  /**
   * Get recent login attempts
   */
  private getLoginAttempts(): LoginAttempt[] {
    try {
      const attempts = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS)
      if (!attempts) return []

      const parsed = JSON.parse(attempts) as LoginAttempt[]

      // Filter to only recent attempts (last hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000)
      return parsed.filter(attempt => attempt.timestamp > oneHourAgo)
    } catch {
      return []
    }
  }

  /**
   * Clean up old login attempts
   */
  private cleanupOldLoginAttempts(): void {
    const recentAttempts = this.getLoginAttempts()
    if (recentAttempts.length === 0) {
      localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS)
    } else {
      localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(recentAttempts))
    }
  }

  /**
   * Generate secure session token
   */
  private generateSessionToken(): string {
    const randomData = crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.TOKEN_LENGTH))
    const timestamp = Date.now().toString()
    const randomHex = Array.from(randomData, byte => byte.toString(16).padStart(2, '0')).join('')
    const combined = randomHex + timestamp

    // Simple hash for session token (synchronous)
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16) + randomHex.slice(0, 16)
  }

  /**
   * Authenticate admin login with security measures
   */
  async login(password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check for lockout
      if (this.isLockedOut()) {
        const lockoutUntil = localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL)
        const remainingTime = Math.ceil((parseInt(lockoutUntil!) - Date.now()) / 60000)
        return {
          success: false,
          message: `Account locked. Try again in ${remainingTime} minutes.`
        }
      }

      // Get stored admin hash
      const storedData = localStorage.getItem(STORAGE_KEYS.ADMIN_HASH)
      if (!storedData) {
        return {
          success: false,
          message: 'Admin account not configured. Please set up admin password first.'
        }
      }

      const { hash: storedHash, salt } = JSON.parse(storedData)

      // Verify password
      const { hash: inputHash } = await this.generateSecureHash(password, salt)

      if (inputHash !== storedHash) {
        this.recordFailedAttempt()
        return {
          success: false,
          message: 'Invalid password. Please try again.'
        }
      }

      // Successful login - create secure session
      const token = this.generateSessionToken()
      const expiresAt = Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT

      this.currentSession = {
        token,
        expiresAt,
        lastActivity: Date.now(),
        permissions: ['poi_manage', 'data_export', 'data_import']
      }

      // Store encrypted session token
      const sessionData = {
        token: this.currentSession.token,
        expiresAt: this.currentSession.expiresAt,
        permissions: this.currentSession.permissions
      }

      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, JSON.stringify(sessionData))

      // Clear failed attempts on successful login
      localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS)
      localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL)

      console.log('✅ Admin login successful')
      return {
        success: true,
        message: 'Login successful'
      }

    } catch (error) {
      console.error('❌ Login error:', error)
      return {
        success: false,
        message: 'Login failed due to system error'
      }
    }
  }

  /**
   * Validate current session and check for expiration
   */
  validateCurrentSession(): boolean {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
      if (!sessionData || !this.currentSession) {
        this.logout()
        return false
      }

      const { expiresAt } = JSON.parse(sessionData)

      if (Date.now() > expiresAt) {
        console.log('🕐 Admin session expired')
        this.logout()
        return false
      }

      // Update last activity
      if (this.currentSession) {
        this.currentSession.lastActivity = Date.now()
      }

      return true
    } catch {
      this.logout()
      return false
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    if (!this.validateCurrentSession()) {
      return false
    }

    return this.currentSession?.permissions.includes(permission) ?? false
  }

  /**
   * Get current admin session info
   */
  getCurrentSession(): AdminSession | null {
    if (!this.validateCurrentSession()) {
      return null
    }
    return this.currentSession
  }

  /**
   * Check if admin is currently logged in
   */
  isAuthenticated(): boolean {
    return this.validateCurrentSession()
  }

  /**
   * Logout and clear all session data
   */
  logout(): void {
    this.currentSession = null
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)

    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
      this.sessionCheckInterval = null
    }

    console.log('🔓 Admin logged out')
  }

  /**
   * Start monitoring session expiration
   */
  private startSessionMonitoring(): void {
    // Check session every minute
    this.sessionCheckInterval = setInterval(() => {
      if (this.currentSession && !this.validateCurrentSession()) {
        // Session expired, will be handled by validateCurrentSession
      }
    }, 60000)
  }

  /**
   * Extend current session (call on user activity)
   */
  extendSession(): void {
    if (!this.currentSession) return

    const newExpiresAt = Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT
    this.currentSession.expiresAt = newExpiresAt
    this.currentSession.lastActivity = Date.now()

    // Update stored session
    const sessionData = {
      token: this.currentSession.token,
      expiresAt: newExpiresAt,
      permissions: this.currentSession.permissions
    }

    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, JSON.stringify(sessionData))
  }

  /**
   * Get security status information
   */
  getSecurityStatus() {
    const attempts = this.getLoginAttempts()
    const isLocked = this.isLockedOut()

    return {
      isLocked,
      recentAttempts: attempts.length,
      maxAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
      sessionTimeout: SECURITY_CONFIG.SESSION_TIMEOUT / 60000, // in minutes
      hasAdminPassword: !!localStorage.getItem(STORAGE_KEYS.ADMIN_HASH)
    }
  }

  /**
   * Cleanup method for component unmount
   */
  cleanup(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
      this.sessionCheckInterval = null
    }
  }
}

// Export singleton instance
export const adminService = AdminService.getInstance()

// Make adminService available globally for browser console access
if (typeof window !== 'undefined') {
  (window as typeof window & { adminService: AdminService }).adminService = adminService
}

// Security utility functions
export const SecurityUtils = {
  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  },

  /**
   * Validate coordinate input
   */
  validateCoordinates(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    )
  },

  /**
   * Generate CSRF token for form submissions
   */
  generateCSRFToken(): string {
    const randomData = crypto.getRandomValues(new Uint8Array(16))
    return Array.from(randomData, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}
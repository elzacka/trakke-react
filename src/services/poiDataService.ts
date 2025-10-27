// POI Data Service - JSON-based persistence for admin-added POIs
// Provides secure CRUD operations for custom POI management

import { POI, POIType } from '../data/pois'
import { SecurityUtils } from './adminService'

export interface CustomPOI extends Omit<POI, 'api_source'> {
  createdAt: number
  updatedAt: number
  createdBy: 'admin'
  source: 'admin'
  // Additional admin fields
  website?: string
  phone?: string
  address?: string
  subcategory?: string
}

export interface POIDataStore {
  version: string
  lastUpdated: number
  pois: CustomPOI[]
}

// Storage configuration
const STORAGE_KEYS = {
  POI_DATA: 'trakke_admin_pois_v1',
  POI_BACKUP: 'trakke_admin_pois_backup_v1'
} as const

export class POIDataService {
  private static instance: POIDataService

  private constructor() {}

  static getInstance(): POIDataService {
    if (!POIDataService.instance) {
      POIDataService.instance = new POIDataService()
    }
    return POIDataService.instance
  }

  /**
   * Initialize POI data store if it doesn't exist
   */
  private initializeStore(): POIDataStore {
    const defaultStore: POIDataStore = {
      version: '1.0',
      lastUpdated: Date.now(),
      pois: []
    }

    localStorage.setItem(STORAGE_KEYS.POI_DATA, JSON.stringify(defaultStore))
    return defaultStore
  }

  /**
   * Get current POI data store
   */
  private getStore(): POIDataStore {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POI_DATA)
      if (!data) {
        return this.initializeStore()
      }

      const store = JSON.parse(data) as POIDataStore

      // Validate store structure
      if (!store.version || !Array.isArray(store.pois)) {
        console.warn('⚠️ Invalid POI store structure, reinitializing')
        return this.initializeStore()
      }

      return store
    } catch (error) {
      console.error('❌ Error reading POI store:', error)
      return this.initializeStore()
    }
  }

  /**
   * Save POI data store with backup
   */
  private saveStore(store: POIDataStore): void {
    try {
      // Create backup of current data
      const currentData = localStorage.getItem(STORAGE_KEYS.POI_DATA)
      if (currentData) {
        localStorage.setItem(STORAGE_KEYS.POI_BACKUP, currentData)
      }

      // Save new data
      store.lastUpdated = Date.now()
      localStorage.setItem(STORAGE_KEYS.POI_DATA, JSON.stringify(store))

    } catch (error) {
      console.error('❌ Error saving POI store:', error)
      throw new Error('Failed to save POI data')
    }
  }

  /**
   * Generate unique ID for new POI
   */
  private generatePOIId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)
    return `admin_${timestamp}_${random}`
  }

  /**
   * Validate POI data before saving
   */
  private validatePOI(poi: Partial<CustomPOI>): string[] {
    const errors: string[] = []

    if (!poi.name || typeof poi.name !== 'string' || !poi.name.trim()) {
      errors.push('Name is required')
    }

    if (!poi.description || typeof poi.description !== 'string' || !poi.description.trim()) {
      errors.push('Description is required')
    }

    if (!poi.type || typeof poi.type !== 'string') {
      errors.push('Category is required')
    }

    if (typeof poi.lat !== 'number' || !SecurityUtils.validateCoordinates(poi.lat, poi.lng || 0)) {
      errors.push('Valid coordinates are required')
    }

    if (typeof poi.lng !== 'number' || !SecurityUtils.validateCoordinates(poi.lat || 0, poi.lng)) {
      errors.push('Valid coordinates are required')
    }

    // Validate optional URL if provided
    if (poi.website && typeof poi.website === 'string' && poi.website.trim()) {
      try {
        new URL(poi.website.startsWith('http') ? poi.website : `https://${poi.website}`)
      } catch {
        errors.push('Invalid website URL')
      }
    }

    return errors
  }

  /**
   * Sanitize POI data for security
   */
  private sanitizePOI(poi: Partial<CustomPOI>): Partial<CustomPOI> {
    return {
      ...poi,
      name: poi.name ? SecurityUtils.sanitizeInput(poi.name) : '',
      description: poi.description ? SecurityUtils.sanitizeInput(poi.description) : '',
      type: poi.type ? SecurityUtils.sanitizeInput(poi.type) as POIType : undefined,
      subcategory: poi.subcategory ? SecurityUtils.sanitizeInput(poi.subcategory) : undefined,
      website: poi.website ? SecurityUtils.sanitizeInput(poi.website) : undefined,
      phone: poi.phone ? SecurityUtils.sanitizeInput(poi.phone) : undefined,
      address: poi.address ? SecurityUtils.sanitizeInput(poi.address) : undefined
    }
  }

  /**
   * Get all admin POIs
   */
  getAllPOIs(): CustomPOI[] {
    const store = this.getStore()
    return store.pois
  }

  /**
   * Get POI by ID
   */
  getPOIById(id: string): CustomPOI | null {
    const store = this.getStore()
    return store.pois.find(poi => poi.id === id) || null
  }

  /**
   * Add new POI
   */
  async addPOI(poiData: Omit<CustomPOI, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'source'>): Promise<{ success: boolean; id?: string; message: string }> {
    try {
      // Validate input
      const validationErrors = this.validatePOI(poiData)
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: `Validation errors: ${validationErrors.join(', ')}`
        }
      }

      // Sanitize input
      const sanitizedData = this.sanitizePOI(poiData) as Omit<CustomPOI, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'source'>

      // Create POI with metadata
      const newPOI: CustomPOI = {
        ...sanitizedData,
        id: this.generatePOIId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'admin',
        source: 'admin'
      }

      // Add to store
      const store = this.getStore()
      store.pois.push(newPOI)
      this.saveStore(store)

      return {
        success: true,
        id: newPOI.id,
        message: 'POI added successfully'
      }

    } catch (error) {
      console.error('❌ Error adding POI:', error)
      return {
        success: false,
        message: 'Failed to add POI due to system error'
      }
    }
  }

  /**
   * Update existing POI
   */
  async updatePOI(id: string, updates: Partial<Omit<CustomPOI, 'id' | 'createdAt' | 'createdBy' | 'source'>>): Promise<{ success: boolean; message: string }> {
    try {
      const store = this.getStore()
      const poiIndex = store.pois.findIndex(poi => poi.id === id)

      if (poiIndex === -1) {
        return {
          success: false,
          message: 'POI not found'
        }
      }

      // Validate updates
      const mergedData = { ...store.pois[poiIndex], ...updates }
      const validationErrors = this.validatePOI(mergedData)
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: `Validation errors: ${validationErrors.join(', ')}`
        }
      }

      // Sanitize updates
      const sanitizedUpdates = this.sanitizePOI(updates)

      // Apply updates
      store.pois[poiIndex] = {
        ...store.pois[poiIndex],
        ...sanitizedUpdates,
        updatedAt: Date.now()
      }

      this.saveStore(store)

      return {
        success: true,
        message: 'POI updated successfully'
      }

    } catch (error) {
      console.error('❌ Error updating POI:', error)
      return {
        success: false,
        message: 'Failed to update POI due to system error'
      }
    }
  }

  /**
   * Delete POI
   */
  async deletePOI(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const store = this.getStore()
      const poiIndex = store.pois.findIndex(poi => poi.id === id)

      if (poiIndex === -1) {
        return {
          success: false,
          message: 'POI not found'
        }
      }

      const deletedPOI = store.pois[poiIndex]
      store.pois.splice(poiIndex, 1)
      this.saveStore(store)

      return {
        success: true,
        message: 'POI deleted successfully'
      }

    } catch (error) {
      console.error('❌ Error deleting POI:', error)
      return {
        success: false,
        message: 'Failed to delete POI due to system error'
      }
    }
  }

  /**
   * Get POIs by category
   */
  getPOIsByCategory(category: string): CustomPOI[] {
    const store = this.getStore()
    return store.pois.filter(poi => poi.type === category)
  }

  /**
   * Get POIs by multiple categories
   */
  getPOIsByCategories(categories: string[]): CustomPOI[] {
    if (categories.length === 0) return []

    const store = this.getStore()
    return store.pois.filter(poi => categories.includes(poi.type))
  }

  /**
   * Search POIs by name or description
   */
  searchPOIs(query: string): CustomPOI[] {
    if (!query.trim()) return []

    const store = this.getStore()
    const searchTerm = query.toLowerCase().trim()

    return store.pois.filter(poi =>
      poi.name.toLowerCase().includes(searchTerm) ||
      poi.description.toLowerCase().includes(searchTerm)
    )
  }

  /**
   * Export POIs as JSON
   */
  exportPOIs(): string {
    const store = this.getStore()
    return JSON.stringify({
      ...store,
      exportedAt: Date.now(),
      exportedBy: 'admin'
    }, null, 2)
  }

  /**
   * Import POIs from JSON (with validation)
   */
  async importPOIs(jsonData: string): Promise<{ success: boolean; imported: number; message: string }> {
    try {
      const data = JSON.parse(jsonData)

      if (!data.pois || !Array.isArray(data.pois)) {
        return {
          success: false,
          imported: 0,
          message: 'Invalid import format - missing POIs array'
        }
      }

      let importedCount = 0
      const store = this.getStore()

      for (const poiData of data.pois) {
        // Validate each POI
        const validationErrors = this.validatePOI(poiData)
        if (validationErrors.length === 0) {
          const sanitizedPOI = this.sanitizePOI(poiData) as CustomPOI
          sanitizedPOI.id = this.generatePOIId()
          sanitizedPOI.createdAt = Date.now()
          sanitizedPOI.updatedAt = Date.now()
          sanitizedPOI.createdBy = 'admin'
          sanitizedPOI.source = 'admin'

          store.pois.push(sanitizedPOI)
          importedCount++
        }
      }

      if (importedCount > 0) {
        this.saveStore(store)
      }

      return {
        success: true,
        imported: importedCount,
        message: `Successfully imported ${importedCount} POIs`
      }

    } catch (error) {
      console.error('❌ Error importing POIs:', error)
      return {
        success: false,
        imported: 0,
        message: 'Failed to import POIs - invalid JSON format'
      }
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    const store = this.getStore()
    const dataSize = JSON.stringify(store).length

    return {
      totalPOIs: store.pois.length,
      lastUpdated: new Date(store.lastUpdated),
      dataSize: `${(dataSize / 1024).toFixed(2)} KB`,
      version: store.version
    }
  }
}

// Export singleton instance
export const poiDataService = POIDataService.getInstance()
/**
 * Detection Sync Service
 * 
 * Provides instant editor updates by:
 * 1. Storing changes in IndexedDB (browser database)
 * 2. Updating UI immediately (optimistic updates)
 * 3. Syncing to backend silently in background
 * 4. Handling conflicts and retries automatically
 */

const DB_NAME = "InTakeOffDB"
const DB_VERSION = 1
const STORE_NAME = "detections"
const SYNC_DELAY = 1000 // 1 second debounce
const MAX_RETRY = 3

class DetectionSyncService {
  constructor() {
    this.db = null
    this.syncQueue = new Map() // Map of detection IDs to their pending operations
    this.syncTimers = new Map() // Debounce timers
    this.listeners = new Set() // For state change notifications
    this.syncStatus = { syncing: false, lastSync: null, pendingCount: 0 }
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Create detections store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
          store.createIndex("page_id", "page_id", { unique: false })
          store.createIndex("syncStatus", "syncStatus", { unique: false })
          store.createIndex("updatedAt", "updatedAt", { unique: false })
        }
      }
    })
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.syncStatus))
  }

  /**
   * Get all detections for a page (from local storage)
   */
  async getDetections(pageId) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("page_id")
      const request = index.getAll(pageId)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Add a new detection (instant local save + background sync)
   */
  async addDetection(detection) {
    if (!this.db) await this.init()

    // Generate temporary ID if not present
    const id = detection.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const localDetection = {
      ...detection,
      id,
      syncStatus: "pending", // pending, synced, error
      createdAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 0,
    }

    // Save to IndexedDB immediately
    await this.saveToLocal(localDetection)

    // Schedule background sync
    this.scheduleSyncDetection(id)

    return localDetection
  }

  /**
   * Update an existing detection (instant local save + background sync)
   */
  async updateDetection(id, updates) {
    if (!this.db) await this.init()

    const existing = await this.getDetectionById(id)
    if (!existing) throw new Error("Detection not found")

    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
      syncStatus: "pending",
    }

    await this.saveToLocal(updated)
    this.scheduleSyncDetection(id)

    return updated
  }

  /**
   * Delete a detection (instant local delete + background sync)
   */
  async deleteDetection(id) {
    if (!this.db) await this.init()

    const detection = await this.getDetectionById(id)
    if (!detection) return

    // Mark as deleted (don't remove yet, in case sync fails)
    const deleted = {
      ...detection,
      syncStatus: "pending_delete",
      updatedAt: Date.now(),
    }

    await this.saveToLocal(deleted)
    this.scheduleSyncDetection(id)
  }

  /**
   * Get a single detection by ID
   */
  async getDetectionById(id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Save detection to local IndexedDB
   */
  async saveToLocal(detection) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(detection)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove from local storage
   */
  async removeFromLocal(id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Schedule a background sync (debounced)
   */
  scheduleSyncDetection(id) {
    // Clear existing timer
    if (this.syncTimers.has(id)) {
      clearTimeout(this.syncTimers.get(id))
    }

    // Schedule new sync after delay
    const timer = setTimeout(() => {
      this.syncDetection(id)
      this.syncTimers.delete(id)
    }, SYNC_DELAY)

    this.syncTimers.set(id, timer)
    this.updateSyncStatus()
  }

  /**
   * Sync a single detection to backend
   */
  async syncDetection(id) {
    const detection = await this.getDetectionById(id)
    if (!detection) return

    // Already synced
    if (detection.syncStatus === "synced") return

    this.syncStatus.syncing = true
    this.notifyListeners()

    try {
      if (detection.syncStatus === "pending_delete") {
        // Only delete if it has a real ID (not temp)
        if (!id.startsWith("temp_")) {
          await this.syncDeleteToBackend(id)
        }
        await this.removeFromLocal(id)
      } else if (id.startsWith("temp_")) {
        // Create new detection
        const serverDetection = await this.syncCreateToBackend(detection)
        
        // Remove temp and add real one
        await this.removeFromLocal(id)
        await this.saveToLocal({
          ...serverDetection,
          syncStatus: "synced",
          updatedAt: Date.now(),
        })
      } else {
        // Update existing detection
        const serverDetection = await this.syncUpdateToBackend(id, detection)
        await this.saveToLocal({
          ...serverDetection,
          syncStatus: "synced",
          updatedAt: Date.now(),
        })
      }

      this.syncStatus.lastSync = Date.now()
    } catch (error) {
      console.error("Sync failed:", error)
      
      // Retry logic
      if (detection.retryCount < MAX_RETRY) {
        await this.saveToLocal({
          ...detection,
          retryCount: detection.retryCount + 1,
          syncStatus: "pending",
        })
        
        // Retry after exponential backoff
        setTimeout(() => this.scheduleSyncDetection(id), 2000 * Math.pow(2, detection.retryCount))
      } else {
        // Mark as error after max retries
        await this.saveToLocal({
          ...detection,
          syncStatus: "error",
        })
      }
    } finally {
      this.syncStatus.syncing = false
      this.updateSyncStatus()
      this.notifyListeners()
    }
  }

  /**
   * Sync all pending changes
   */
  async syncAll() {
    if (!this.db) await this.init()

    const transaction = this.db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("syncStatus")
    
    // Get all pending detections
    const request = index.getAll("pending")
    
    return new Promise((resolve) => {
      request.onsuccess = async () => {
        const pending = request.result || []
        
        // Also check for pending deletes
        const deleteRequest = index.getAll("pending_delete")
        deleteRequest.onsuccess = async () => {
          const pendingDeletes = deleteRequest.result || []
          const allPending = [...pending, ...pendingDeletes]
          
          // Sync all in parallel
          await Promise.all(allPending.map(d => this.syncDetection(d.id)))
          resolve()
        }
      }
    })
  }

  /**
   * API Calls to backend
   */
  async syncCreateToBackend(detection) {
    const { createDetection } = await import("./api.js")
    
    // Remove local-only fields
    const { id, syncStatus, createdAt, updatedAt, retryCount, ...cleanData } = detection
    
    return await createDetection(detection.page_id, cleanData)
  }

  async syncUpdateToBackend(id, detection) {
    const { updateDetection } = await import("./api.js")
    
    // Remove local-only fields
    const { syncStatus, createdAt, updatedAt, retryCount, ...cleanData } = detection
    
    return await updateDetection(id, cleanData)
  }

  async syncDeleteToBackend(id) {
    const { deleteDetection } = await import("./api.js")
    await deleteDetection(id)
  }

  /**
   * Update sync status
   */
  updateSyncStatus() {
    this.syncStatus.pendingCount = this.syncTimers.size
  }

  /**
   * Load from server and merge with local changes
   */
  async loadAndMerge(pageId) {
    if (!this.db) await this.init()

    // Get from server
    const { getPageDetections } = await import("./api.js")
    const serverDetections = await getPageDetections(pageId)

    // Get local detections
    const localDetections = await this.getDetections(pageId)

    // Create a map for quick lookup
    const localMap = new Map(localDetections.map(d => [d.id, d]))

    // Merge: Server data takes precedence for synced items
    const merged = []

    for (const serverDet of serverDetections) {
      const local = localMap.get(serverDet.id)
      
      if (!local || local.syncStatus === "synced") {
        // Use server version
        merged.push({
          ...serverDet,
          syncStatus: "synced",
          updatedAt: Date.now(),
        })
        
        // Update local storage
        await this.saveToLocal({
          ...serverDet,
          syncStatus: "synced",
          updatedAt: Date.now(),
        })
      } else {
        // Keep local pending changes
        merged.push(local)
      }
      
      localMap.delete(serverDet.id)
    }

    // Add any local-only items (new or pending)
    for (const [id, local] of localMap) {
      if (local.syncStatus !== "pending_delete") {
        merged.push(local)
      }
    }

    return merged
  }

  /**
   * Clear all data for a page
   */
  async clearPage(pageId) {
    if (!this.db) await this.init()

    const detections = await this.getDetections(pageId)
    await Promise.all(detections.map(d => this.removeFromLocal(d.id)))
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return { ...this.syncStatus }
  }
}

// Export singleton instance
export default new DetectionSyncService()

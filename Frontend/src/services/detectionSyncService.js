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
    this.tempIdMap = new Map() // Map of temp_id -> real_id after create sync
  }

  isPreviewPageId(pageId) {
    return typeof pageId === "string" && pageId.startsWith("preview_")
  }

  async getDetectionByClientTempId(tempId) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.openCursor()

      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) {
          resolve(null)
          return
        }

        if (cursor.value?.client_temp_id === tempId) {
          resolve(cursor.value)
          return
        }

        cursor.continue()
      }

      request.onerror = () => reject(request.error)
    })
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
    const snapshot = { ...this.syncStatus }
    this.listeners.forEach(callback => callback(snapshot))
  }

  /**
   * Recalculate pending count from IndexedDB
   */
  async recalculatePendingCount() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("syncStatus")

      const pendingRequest = index.count("pending")
      const deleteRequest = index.count("pending_delete")

      let pending = 0
      let pendingDelete = 0

      pendingRequest.onsuccess = () => {
        pending = pendingRequest.result || 0
        if (deleteRequest.readyState === "done") {
          this.syncStatus.pendingCount = pending + pendingDelete
          resolve(this.syncStatus.pendingCount)
        }
      }
      deleteRequest.onsuccess = () => {
        pendingDelete = deleteRequest.result || 0
        if (pendingRequest.readyState === "done") {
          this.syncStatus.pendingCount = pending + pendingDelete
          resolve(this.syncStatus.pendingCount)
        }
      }

      pendingRequest.onerror = () => reject(pendingRequest.error)
      deleteRequest.onerror = () => reject(deleteRequest.error)
    })
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

    // Schedule background sync (skip preview pages until real IDs exist)
    if (!this.isPreviewPageId(localDetection.page_id)) {
      this.scheduleSyncDetection(id)
    }

    return localDetection
  }

  /**
   * Update an existing detection (instant local save + background sync)
   */
  async updateDetection(id, updates) {
    if (!this.db) await this.init()

    let actualId = id
    let existing = await this.getDetectionById(actualId)

    if (!existing && this.tempIdMap.has(id)) {
      actualId = this.tempIdMap.get(id)
      existing = await this.getDetectionById(actualId)
    }

    if (!existing && id.startsWith("temp_")) {
      const mapped = await this.getDetectionByClientTempId(id)
      if (mapped) {
        actualId = mapped.id
        existing = mapped
      }
    }

    if (!existing) throw new Error("Detection not found")

    const updated = {
      ...existing,
      ...updates,
      id: actualId,
      updatedAt: Date.now(),
      syncStatus: "pending",
    }

    await this.saveToLocal(updated)
    this.scheduleSyncDetection(actualId)

    return updated
  }

  /**
   * Delete a detection (instant local delete + background sync)
   */
  async deleteDetection(id) {
    if (!this.db) await this.init()

    let actualId = id
    let detection = await this.getDetectionById(actualId)

    if (!detection && this.tempIdMap.has(id)) {
      actualId = this.tempIdMap.get(id)
      detection = await this.getDetectionById(actualId)
    }

    if (!detection && id.startsWith("temp_")) {
      const mapped = await this.getDetectionByClientTempId(id)
      if (mapped) {
        actualId = mapped.id
        detection = mapped
      }
    }

    if (!detection) return

    // Mark as deleted (don't remove yet, in case sync fails)
    const deleted = {
      ...detection,
      id: actualId,
      syncStatus: "pending_delete",
      updatedAt: Date.now(),
    }

    await this.saveToLocal(deleted)
    this.scheduleSyncDetection(actualId)
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
      this.syncTimers.delete(id)
      this.syncDetection(id)
    }, SYNC_DELAY)

    this.syncTimers.set(id, timer)
    this.updateSyncStatus()
    this.notifyListeners()
  }

  /**
   * Sync a single detection to backend
   */
  async syncDetection(id) {
    const detection = await this.getDetectionById(id)
    if (!detection) {
      await this.recalculatePendingCount()
      this.notifyListeners()
      return
    }

    // Skip syncing for preview-only pages; these will be migrated later
    if (this.isPreviewPageId(detection.page_id)) {
      await this.recalculatePendingCount()
      this.notifyListeners()
      return
    }

    // Already synced
    if (detection.syncStatus === "synced") {
      await this.recalculatePendingCount()
      this.notifyListeners()
      return
    }

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
        
        this.tempIdMap.set(id, serverDetection.id)

        // Remove temp and add real one
        await this.removeFromLocal(id)
        await this.saveToLocal({
          ...serverDetection,
          client_temp_id: id,
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
      await this.recalculatePendingCount()
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
          await this.recalculatePendingCount()
          this.notifyListeners()
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
    const { id, syncStatus, createdAt, updatedAt, retryCount, client_temp_id, ...cleanData } = detection
    
    return await createDetection(detection.page_id, cleanData)
  }

  async syncUpdateToBackend(id, detection) {
    const { updateDetection } = await import("./api.js")
    
    // Remove local-only fields
    const { syncStatus, createdAt, updatedAt, retryCount, client_temp_id, ...cleanData } = detection
    
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

    // Ensure pending local changes keep syncing (e.g., after refresh/reopen)
    for (const local of localDetections) {
      if (local.syncStatus && local.syncStatus !== "synced") {
        if (local.syncStatus === "error") {
          await this.saveToLocal({
            ...local,
            syncStatus: "pending",
            retryCount: 0,
            updatedAt: Date.now(),
          })
        }
        if (!this.isPreviewPageId(local.page_id)) {
          this.scheduleSyncDetection(local.id)
        }
      }
    }

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

  /**
   * Cancel all pending sync operations (used when leaving project)
   */
  cancelAllPendingSyncs() {
    // Clear all debounce timers
    for (const [id, timer] of this.syncTimers) {
      clearTimeout(timer)
    }
    this.syncTimers.clear()
    
    // Reset sync status
    this.syncStatus = { syncing: false, lastSync: null, pendingCount: 0 }
    this.notifyListeners()
    
    console.log("All pending syncs cancelled")
  }

  /**
   * Force sync and wait (for when user confirms they want to save before leaving)
   */
  async forceSyncAllAndWait() {
    // Cancel any debounced syncs
    for (const [id, timer] of this.syncTimers) {
      clearTimeout(timer)
    }
    this.syncTimers.clear()
    
    // Sync all pending items immediately
    await this.syncAll()
    
    return true
  }

  /**
   * Cleanup for a specific project (call when switching projects)
   */
  async cleanupForProject(projectId) {
    // Cancel any pending syncs
    this.cancelAllPendingSyncs()
    
    // Note: We don't clear local storage here because 
    // the user might come back to the same project
    // and we want to preserve their offline changes
    console.log(`Cleanup completed for project ${projectId}`)
  }

  /**
   * Hard reset - clear everything (for critical bugs or logout)
   */
  async hardReset() {
    this.cancelAllPendingSyncs()
    
    if (this.db) {
      // Clear all detections from IndexedDB
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => {
          console.log("Hard reset completed - all local detections cleared")
          resolve()
        }
        request.onerror = () => reject(request.error)
      })
    }
  }

  /**
   * Migrate preview detections to real page IDs after upload completes
   */
  async migratePreviewDetections(previewPages, realPages) {
    if (!this.db) await this.init()

    if (!Array.isArray(previewPages) || !Array.isArray(realPages)) {
      return { migrated: 0 }
    }

    const realByPageNumber = new Map(
      realPages.map(p => [p.page_number, p.page_id])
    )

    let migrated = 0

    for (const preview of previewPages) {
      const realPageId = realByPageNumber.get(preview.page_number)
      if (!realPageId) continue

      const localDetections = await this.getDetections(preview.page_id)
      for (const det of localDetections) {
        if (det.syncStatus === "pending_delete") {
          await this.removeFromLocal(det.id)
          continue
        }

        const updated = {
          ...det,
          page_id: realPageId,
          syncStatus: "pending",
          retryCount: 0,
          updatedAt: Date.now(),
        }

        await this.saveToLocal(updated)
        this.scheduleSyncDetection(updated.id)
        migrated += 1
      }
    }

    return { migrated }
  }
}

// Export singleton instance
export default new DetectionSyncService()

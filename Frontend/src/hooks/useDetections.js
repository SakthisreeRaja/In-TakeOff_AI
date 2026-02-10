import { useEffect, useState, useRef } from "react"
import detectionSyncService from "../services/detectionSyncService"

/**
 * useDetections Hook - Optimized for Instant Updates
 * 
 * Uses local IndexedDB storage for instant UI updates
 * and background syncing for server persistence.
 * 
 * This makes the editor feel like a native app!
 */
export default function useDetections(pageId) {
  const [detections, setDetections] = useState([])
  const [syncStatus, setSyncStatus] = useState({ syncing: false, pendingCount: 0 })
  const previousPageIdRef = useRef(null)
  const isMountedRef = useRef(true)

  const fetchDetections = async () => {
    if (!pageId || !isMountedRef.current) return
    
    try {
      // Load from local storage first (instant)
      const localData = await detectionSyncService.getDetections(pageId)
      if (!isMountedRef.current) return
      setDetections(localData.filter(d => d.syncStatus !== "pending_delete"))

      // Then merge with server data in background
      const mergedData = await detectionSyncService.loadAndMerge(pageId)
      if (!isMountedRef.current) return
      setDetections(mergedData.filter(d => d.syncStatus !== "pending_delete"))
    } catch (error) {
      console.error("Failed to fetch detections:", error)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Handle page changes - clear and reload
  useEffect(() => {
    if (previousPageIdRef.current !== pageId) {
      // Clear detections when switching pages for isolation
      setDetections([])
      previousPageIdRef.current = pageId
    }
    
    if (pageId) {
      fetchDetections()
    }
  }, [pageId])

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = detectionSyncService.subscribe((status) => {
      setSyncStatus(status)
    })
    
    return unsubscribe
  }, [])

  /**
   * Add detection - INSTANT update, syncs in background
   */
  async function add(box) {
    try {
      // Optimistic update - instant UI feedback
      const tempDetection = await detectionSyncService.addDetection(box)
      setDetections(v => [...v, tempDetection])
      
      // Background sync happens automatically via the service
      return tempDetection
    } catch (error) {
      console.error("Failed to add detection:", error)
      throw error
    }
  }

  /**
   * Update detection - INSTANT update, syncs in background
   */
  async function update(id, data) {
    try {
      // Optimistic update - instant UI feedback
      const updatedDetection = await detectionSyncService.updateDetection(id, data)
      setDetections(v => {
        const filtered = v.filter(x => x.id !== id && x.id !== updatedDetection.id)
        return [...filtered, updatedDetection]
      })
      
      // Background sync happens automatically via the service
      return updatedDetection
    } catch (error) {
      console.error("Failed to update detection:", error)
      throw error
    }
  }

  /**
   * Remove detection - INSTANT update, syncs in background
   */
  async function remove(id) {
    try {
      // Optimistic update - instant UI feedback
      setDetections(v => v.filter(x => x.id !== id))
      
      // Mark for deletion (will sync in background)
      await detectionSyncService.deleteDetection(id)
    } catch (error) {
      console.error("Failed to remove detection:", error)
      throw error
    }
  }

  /**
   * Force refresh from server
   */
  async function refresh() {
    await fetchDetections()
  }

  /**
   * Force sync all pending changes
   */
  async function syncNow() {
    await detectionSyncService.syncAll()
    await fetchDetections()
  }

  /**
   * Cancel all pending syncs (for when leaving without saving)
   */
  function cancelSync() {
    detectionSyncService.cancelAllPendingSyncs()
  }

  /**
   * Force sync and wait (for when user wants to save before leaving)
   */
  async function forceSyncBeforeLeave() {
    return await detectionSyncService.forceSyncAllAndWait()
  }

  return { 
    detections, 
    add, 
    update, 
    remove, 
    refresh,
    syncNow,
    cancelSync,
    forceSyncBeforeLeave,
    syncStatus
  }
}

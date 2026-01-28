import { useEffect, useState } from "react"
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

  const fetchDetections = async () => {
    if (!pageId) return
    
    try {
      // Load from local storage first (instant)
      const localData = await detectionSyncService.getDetections(pageId)
      setDetections(localData.filter(d => d.syncStatus !== "pending_delete"))

      // Then merge with server data in background
      const mergedData = await detectionSyncService.loadAndMerge(pageId)
      setDetections(mergedData.filter(d => d.syncStatus !== "pending_delete"))
    } catch (error) {
      console.error("Failed to fetch detections:", error)
    }
  }

  useEffect(() => {
    fetchDetections()
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
      setDetections(v => v.map(x => (x.id === id ? updatedDetection : x)))
      
      // Background sync happens automatically via the service
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

  return { 
    detections, 
    add, 
    update, 
    remove, 
    refresh,
    syncNow,
    syncStatus
  }
}

import { useEffect, useState } from "react"
import detectionSyncService from "../../services/detectionSyncService"

/**
 * SyncStatusIndicator - Shows real-time sync status for detections AND PDF uploads
 * 
 * Displays:
 * - 📄 Converting PDF... (PDF being converted)
 * - ☁️ Uploading PDF... (PDF being uploaded to cloud)
 * - ✓ PDF Uploaded (PDF upload complete)
 * - ↻ Syncing... (detection changes being saved)
 * - ⏱ Pending (N detection changes waiting to sync)
 * - ✓ Synced (all changes saved)
 * - ! Error (sync failed)
 */
export default function SyncStatusIndicator({ uploadStatus }) {
  const [status, setStatus] = useState({ 
    syncing: false, 
    lastSync: null, 
    pendingCount: 0 
  })

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = detectionSyncService.subscribe((newStatus) => {
      setStatus(newStatus)
    })

    // Get initial status
    setStatus(detectionSyncService.getSyncStatus())

    return unsubscribe
  }, [])

  // Priority: PDF upload status > Detection sync status
  let icon = "✓"
  let text = "Synced"
  let color = "text-green-500"
  let bgColor = "bg-green-500/10"
  let shouldSpin = false

  // Check PDF upload status first (higher priority)
  if (uploadStatus?.isUploading) {
    if (uploadStatus.stage === 'converting') {
      icon = "📄"
      text = "Converting PDF..."
      color = "text-blue-500"
      bgColor = "bg-blue-500/10"
      shouldSpin = false
    } else if (uploadStatus.stage === 'uploading') {
      icon = "☁️"
      text = "Uploading PDF..."
      color = "text-blue-500"
      bgColor = "bg-blue-500/10"
      shouldSpin = false
    } else if (uploadStatus.stage === 'complete') {
      icon = "✓"
      text = "PDF Uploaded"
      color = "text-green-500"
      bgColor = "bg-green-500/10"
      shouldSpin = false
    } else if (uploadStatus.stage === 'error') {
      icon = "!"
      text = "Upload Failed"
      color = "text-red-500"
      bgColor = "bg-red-500/10"
      shouldSpin = false
    }
  }
  // Then check detection sync status
  else if (status.syncing) {
    icon = "↻"
    text = "Syncing..."
    color = "text-blue-500"
    bgColor = "bg-blue-500/10"
    shouldSpin = true
  } else if (status.pendingCount > 0) {
    icon = "⏱"
    text = `${status.pendingCount} pending`
    color = "text-yellow-500"
    bgColor = "bg-yellow-500/10"
    shouldSpin = false
  }

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor} border border-zinc-800`}
      title={status.lastSync ? `Last synced: ${new Date(status.lastSync).toLocaleTimeString()}` : "No recent sync"}
    >
      <span className={`${color} ${shouldSpin ? 'animate-spin' : ''} text-sm font-medium`}>
        {icon}
      </span>
      <span className={`${color} text-xs font-medium`}>
        {text}
      </span>
    </div>
  )
}

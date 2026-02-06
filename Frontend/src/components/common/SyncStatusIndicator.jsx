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
export default function SyncStatusIndicator({ uploadStatus, isRunningDetection }) {
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
  let iconType = "check"
  let text = "Synced"
  let color = "text-green-500"
  let bgColor = "bg-green-500/10"
  let showGlow = false

  // Check PDF upload status first (higher priority)
  if (uploadStatus?.isUploading) {
    if (uploadStatus.stage === 'converting') {
      iconType = "document"
      text = "Converting PDF..."
      color = "text-blue-500"
      bgColor = "bg-blue-500/10"
      showGlow = false
    } else if (uploadStatus.stage === 'uploading') {
      iconType = "cloud"
      text = "Syncing..."
      color = "text-blue-500"
      bgColor = "bg-blue-500/10"
      showGlow = true
    } else if (uploadStatus.stage === 'complete') {
      iconType = "check"
      text = "PDF Uploaded"
      color = "text-green-500"
      bgColor = "bg-green-500/10"
      showGlow = false
    } else if (uploadStatus.stage === 'error') {
      iconType = "error"
      text = "Upload Failed"
      color = "text-red-500"
      bgColor = "bg-red-500/10"
      showGlow = false
    }
  }
  // Then show AI detection running
  else if (isRunningDetection) {
    iconType = "cloud"
    text = "Syncing..."
    color = "text-blue-500"
    bgColor = "bg-blue-500/10"
    showGlow = true
  }
  // Then check detection sync status
  else if (status.syncing || status.pendingCount > 0) {
    iconType = "cloud"
    text = "Syncing..."
    color = "text-blue-500"
    bgColor = "bg-blue-500/10"
    showGlow = true
  }

  const renderIcon = () => {
    if (iconType === "cloud") {
      return (
        <div className="relative">
          {showGlow && (
            <div className="absolute inset-0 blur-md opacity-60 animate-pulse">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M18.944 11.112C18.507 7.67 15.56 5 12 5 9.244 5 6.85 6.611 5.757 9.15 3.609 9.792 2 11.82 2 14c0 2.757 2.243 5 5 5h11c2.206 0 4-1.794 4-4a4.01 4.01 0 0 0-3.056-3.888z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          <svg className="w-4 h-4 relative" viewBox="0 0 24 24" fill="none">
            <path d="M18.944 11.112C18.507 7.67 15.56 5 12 5 9.244 5 6.85 6.611 5.757 9.15 3.609 9.792 2 11.82 2 14c0 2.757 2.243 5 5 5h11c2.206 0 4-1.794 4-4a4.01 4.01 0 0 0-3.056-3.888z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )
    }
    if (iconType === "document") {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
    if (iconType === "check") {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
    if (iconType === "error") {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
  }

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor} border border-zinc-800`}
      title={status.lastSync ? `Last synced: ${new Date(status.lastSync).toLocaleTimeString()}` : "No recent sync"}
    >
      <span className={color}>
        {renderIcon()}
      </span>
      <span className={`${color} text-xs font-medium`}>
        {text}
      </span>
    </div>
  )
}

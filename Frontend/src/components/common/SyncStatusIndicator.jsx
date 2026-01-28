import { useEffect, useState } from "react"
import detectionSyncService from "../../services/detectionSyncService"

/**
 * SyncStatusIndicator - Shows real-time sync status
 * 
 * Displays:
 * - ✓ Synced (all changes saved)
 * - ↻ Syncing... (changes being saved)
 * - ! Error (sync failed, retrying)
 * - ⏱ Pending (N changes waiting to sync)
 */
export default function SyncStatusIndicator() {
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

  // Determine status display
  let icon = "✓"
  let text = "Synced"
  let color = "text-green-500"
  let bgColor = "bg-green-500/10"

  if (status.syncing) {
    icon = "↻"
    text = "Syncing..."
    color = "text-blue-500"
    bgColor = "bg-blue-500/10"
  } else if (status.pendingCount > 0) {
    icon = "⏱"
    text = `${status.pendingCount} pending`
    color = "text-yellow-500"
    bgColor = "bg-yellow-500/10"
  }

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor} border border-zinc-800`}
      title={status.lastSync ? `Last synced: ${new Date(status.lastSync).toLocaleTimeString()}` : "No recent sync"}
    >
      <span className={`${color} ${status.syncing ? 'animate-spin' : ''} text-sm font-medium`}>
        {icon}
      </span>
      <span className={`${color} text-xs font-medium`}>
        {text}
      </span>
    </div>
  )
}

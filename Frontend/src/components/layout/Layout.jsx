import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import detectionSyncService from "../../services/detectionSyncService"
import {
  getProjectUploadStatuses,
  subscribeUploadStatus,
  hasAnyUploadInProgress,
  clearAllProjectUploadStatus
} from "../../services/uploadStatusStore"

export default function Layout({ children }) {
  const location = useLocation()

  const isEditor =
    location.pathname.startsWith("/projects/") &&
    location.pathname !== "/projects"

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [syncStatus, setSyncStatus] = useState(detectionSyncService.getSyncStatus())
  const [uploadStatusMap, setUploadStatusMap] = useState(getProjectUploadStatuses())

  useEffect(() => {
    if (sessionStorage.getItem("discard_pending_sync") === "1") {
      sessionStorage.removeItem("discard_pending_sync")
      detectionSyncService.discardPendingChanges()
      clearAllProjectUploadStatus()
    }
  }, [])

  useEffect(() => {
    let active = true

    detectionSyncService.recalculatePendingCount().then(() => {
      if (active) {
        setSyncStatus(detectionSyncService.getSyncStatus())
      }
    })

    const unsubscribe = detectionSyncService.subscribe((status) => {
      setSyncStatus(status)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    setUploadStatusMap(getProjectUploadStatuses())
    const unsubscribe = subscribeUploadStatus(setUploadStatusMap)
    return () => unsubscribe()
  }, [])

  const hasSyncInProgress =
    Boolean(syncStatus?.syncing) ||
    (syncStatus?.pendingCount && syncStatus?.pendingCount > 0) ||
    hasAnyUploadInProgress(uploadStatusMap)

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!hasSyncInProgress) return
      e.preventDefault()
      e.returnValue = ""
    }

    const handlePageHide = (e) => {
      if (e?.persisted) return
      if (!hasSyncInProgress) return
      sessionStorage.setItem("discard_pending_sync", "1")
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("pagehide", handlePageHide)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("pagehide", handlePageHide)
    }
  }, [hasSyncInProgress])

  return (
    <div className="h-screen overflow-hidden bg-black flex">
      {!isEditor && (
        <div
          className={`transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-16"
          } flex-none`}
        >
          <Sidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(v => !v)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />

        <main
          className={`flex flex-1 min-h-0 overflow-hidden ${
            isEditor ? "" : "px-6 py-6"
          }`}
        >
          <div className="w-full flex-1 flex flex-col min-h-0 min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

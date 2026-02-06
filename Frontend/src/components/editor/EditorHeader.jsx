import { FiArrowLeft, FiPlay, FiDownload, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import SyncStatusIndicator from "../common/SyncStatusIndicator"

export default function EditorHeader({ 
  projectName, 
  onBack, 
  onRunDetection, 
  isRunningDetection, 
  syncStatus, 
  uploadStatus,
  // Page navigation props
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage
}) {
  const hasPendingSync =
    Boolean(syncStatus?.syncing) ||
    (syncStatus?.pendingCount && syncStatus?.pendingCount > 0)
  const isUploadSyncing =
    Boolean(uploadStatus?.isUploading) ||
    uploadStatus?.stage === "uploading" ||
    uploadStatus?.stage === "converting"
  const isSyncing = hasPendingSync || isUploadSyncing
  const runDetectionDisabled = isRunningDetection || isSyncing
  const runDetectionTip = "Project is syncing. Please wait."

  return (
    <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-md
            text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Back to projects"
        >
          <FiArrowLeft size={18} />
        </button>

        <h2 className="font-semibold tracking-tight">
          {projectName}
        </h2>

        {/* Real-time Sync Status */}
        <SyncStatusIndicator uploadStatus={uploadStatus} isRunningDetection={isRunningDetection} />
      </div>

      <div className="flex items-center gap-3">
        {/* Page Navigation - Moved here from canvas */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-1.5 mr-2">
            <button
              onClick={onPrevPage}
              disabled={currentPage === 1}
              className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft size={16} />
            </button>
            <span className="text-sm text-zinc-300 min-w-[80px] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={onNextPage}
              disabled={currentPage === totalPages}
              className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="relative group">
          <button 
            onClick={onRunDetection}
            disabled={runDetectionDisabled}
            className="flex items-center gap-2 bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiPlay className={isRunningDetection ? "animate-spin" : ""} />
            {isRunningDetection ? "Running..." : "Run Detection"}
          </button>
          {isSyncing && (
            <div className="pointer-events-none absolute right-0 -top-11 z-20 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="relative rounded-lg border border-zinc-700/80 bg-zinc-900/95 px-3 py-1.5 text-xs text-zinc-100 shadow-lg backdrop-blur">
                {runDetectionTip}
                <span className="absolute -bottom-1.5 right-4 h-3 w-3 rotate-45 border-b border-r border-zinc-700/80 bg-zinc-900/95" />
              </div>
            </div>
          )}
        </div>

        <button className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg">
          <FiDownload />
          Export
        </button>
      </div>
    </div>
  )
}

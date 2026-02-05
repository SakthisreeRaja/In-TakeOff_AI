import { FiArrowLeft, FiPlay, FiDownload, FiChevronLeft, FiChevronRight, FiAlertCircle } from "react-icons/fi"
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
  const hasPendingChanges = !!syncStatus?.syncing || (syncStatus?.pendingCount && syncStatus.pendingCount > 0)

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
        <SyncStatusIndicator uploadStatus={uploadStatus} />

        {/* Warning when changes aren't synced yet */}
        {hasPendingChanges && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs">
            <FiAlertCircle size={12} />
            Not synced yet
          </div>
        )}
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

        <button 
          onClick={onRunDetection}
          disabled={isRunningDetection}
          className="flex items-center gap-2 bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FiPlay className={isRunningDetection ? "animate-spin" : ""} />
          {isRunningDetection ? "Running..." : "Run Detection"}
        </button>

        <button className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg">
          <FiDownload />
          Export
        </button>
      </div>
    </div>
  )
}

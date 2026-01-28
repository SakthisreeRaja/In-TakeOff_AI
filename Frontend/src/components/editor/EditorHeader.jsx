import { FiArrowLeft, FiPlay, FiDownload, FiAlertCircle } from "react-icons/fi"
import SyncStatusIndicator from "../common/SyncStatusIndicator"

export default function EditorHeader({ projectName, onBack, onRunDetection, isRunningDetection, syncStatus }) {
  const hasPendingChanges = syncStatus?.syncing || syncStatus?.pendingCount > 0
  return (
    <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-md
              text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={hasPendingChanges ? "You have unsaved changes" : "Back to projects"}
          >
            <FiArrowLeft size={18} />
          </button>
          {hasPendingChanges && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-zinc-900 animate-pulse" 
                  title="Unsaved changes"
            />
          )}
        </div>

        <h2 className="font-semibold tracking-tight">
          {projectName}
        </h2>

        {/* Real-time Sync Status */}
        <SyncStatusIndicator />
      </div>

      <div className="flex items-center gap-3">
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

import { FiArrowLeft, FiPlay, FiSave, FiDownload } from "react-icons/fi"

export default function EditorHeader({ projectName, onBack, onRunDetection, isRunningDetection }) {
  return (
    <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-md
            text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <FiArrowLeft size={18} />
        </button>

        <h2 className="font-semibold tracking-tight">
          {projectName}
        </h2>

        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
          Saved
        </span>
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
          <FiSave />
          Save
        </button>

        <button className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg">
          <FiDownload />
          Export
        </button>
      </div>
    </div>
  )
}

import { FiFileText, FiMoreVertical, FiEdit, FiTrash2, FiCopy } from "react-icons/fi"
import { useState } from "react"
import StatusBadge from "./StatusBadge"

export default function ProjectCard({ project, onOpen, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const rawCount = project?.count ?? project?.page_count ?? 0
  const pageCount = Number(rawCount)
  const showPageCount = Number.isFinite(pageCount) && pageCount > 0
  const showCreatedAt = Boolean(project?.createdAt)
  const pendingCount = Number(project?.syncPendingCount || 0)
  const showSync = Boolean(project?.isUploading) || pendingCount > 0
  const syncLabel = project?.isUploading
    ? "Syncing..."
    : pendingCount > 0
      ? `Syncing (${pendingCount})`
      : ""

  return (
    <div 
      onClick={() => onOpen && onOpen(project)} 
      className="relative bg-zinc-900 rounded-xl p-4 hover:bg-zinc-800 transition cursor-pointer group border border-transparent hover:border-zinc-700"
    >
      <div className="relative">
        <button 
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }} 
          className="absolute top-0 right-0 text-zinc-400 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition"
        >
          <FiMoreVertical />
        </button>

        {showMenu && (
          <div className="absolute top-8 right-0 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 overflow-hidden z-10 w-40">
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <FiEdit size={14} />
              <span>Rename</span>
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <FiCopy size={14} />
              <span>Duplicate</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(false)
                onDelete && onDelete(project)
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <FiTrash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center items-center h-40 mb-4">
        <FiFileText size={48} className="text-zinc-600 group-hover:text-zinc-500 transition" />
      </div>
      
      <h3 className="text-white font-medium truncate">{project.name}</h3>
      
      {(showCreatedAt || showPageCount) && (
        <div className="text-xs text-zinc-400 mt-1 flex gap-2">
          {showCreatedAt && <span>{project.createdAt}</span>}
          {showCreatedAt && showPageCount && <span>•</span>}
          {showPageCount && <span>{pageCount} page{pageCount !== 1 ? "s" : ""}</span>}
        </div>
      )}
      
      <div className="mt-3 flex items-center gap-2">
        <StatusBadge status={project.status} />
        {showSync && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-zinc-800">
            {syncLabel}
          </span>
        )}
      </div>
    </div>
  )
}

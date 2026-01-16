import { FiFileText, FiMoreVertical } from "react-icons/fi"
import StatusBadge from "./StatusBadge"

export default function ProjectCard({ project, onOpen }) {
  return (
    <div onClick={() => onOpen && onOpen(project)} className="relative bg-zinc-900 rounded-xl p-4 hover:bg-zinc-800 transition cursor-pointer">
      <button onClick={(e) => e.stopPropagation()} className="absolute top-3 right-3 text-zinc-400 hover:text-white">
        <FiMoreVertical />
      </button>
      <div className="flex justify-center items-center h-40">
        <FiFileText size={48} className="text-zinc-600" />
      </div>
      <h3 className="text-white font-medium">{project.name}</h3>
      <div className="text-xs text-zinc-400 mt-1 flex gap-2">
        <span>{project.createdAt}</span>
        <span>•</span>
        <span>{project.count} pages</span>
      </div>
      <div className="mt-3">
        <StatusBadge status={project.status} />
      </div>
    </div>
  )
}

import { useNavigate } from "react-router-dom"
import { FiFolder } from "react-icons/fi"
import StatusBadge from "../projects/StatusBadge"

export default function RecentProjects({ projects }) {
  const navigate = useNavigate()
  const recent = [...projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  return (
    <div className="bg-zinc-900 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Projects</h3>

      {recent.length === 0 ? (
        <div className="text-center py-12">
          <FiFolder className="mx-auto text-4xl text-zinc-700 mb-3" />
          <p className="text-zinc-400 mb-4">No projects yet</p>
          <button
            onClick={() => navigate("/projects/new")}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recent.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="flex items-center justify-between border-b border-zinc-800 pb-3 last:border-none cursor-pointer hover:bg-zinc-800/50 -mx-2 px-2 py-2 rounded transition"
            >
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-zinc-400">{p.createdAt}</div>
              </div>

              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

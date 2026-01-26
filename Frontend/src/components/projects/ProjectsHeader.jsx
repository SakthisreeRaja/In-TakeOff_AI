import { FiSearch, FiPlus } from "react-icons/fi"
import { useNavigate } from "react-router-dom"

export default function ProjectsHeader({ search, setSearch, status, setStatus }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="text-sm text-zinc-400">
        Dashboard <span className="mx-1">›</span>
        <span className="text-white">Projects</span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="relative">
          <FiSearch className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-zinc-900 pl-9 pr-3 py-2 rounded-lg text-sm text-white outline-none focus:border-blue-600 border border-transparent transition"
            placeholder="Search projects"
          />
        </div>

        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-zinc-900 text-sm text-white px-3 py-2 rounded-lg outline-none border border-transparent focus:border-blue-600 cursor-pointer transition"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="complete">Complete</option>
        </select>

        <button
          onClick={() => navigate("/projects/new")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <FiPlus />
          New Project
        </button>
      </div>
    </div>
  )
}

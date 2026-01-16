import { FiSearch, FiPlus } from "react-icons/fi"

export default function ProjectsHeader({ search, setSearch, status, setStatus, onNew }) {
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
            className="bg-zinc-900 pl-9 pr-3 py-2 rounded-lg text-sm text-white outline-none"
            placeholder="Search projects"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-zinc-900 text-sm text-white px-3 py-2 rounded-lg outline-none"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="complete">Complete</option>
        </select>
        <button onClick={onNew} className="flex items-center gap-2 bg-sky-500 text-black px-4 py-2 rounded-lg text-sm font-medium">
          <FiPlus />
          New Project
        </button>
      </div>
    </div>
  )
}

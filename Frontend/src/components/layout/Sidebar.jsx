import { NavLink } from "react-router-dom"
import { FiHome, FiFolder, FiSettings, FiMenu } from "react-icons/fi"

export default function Sidebar({ open, onToggle }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-zinc-900 text-white transition-all duration-300 ${
        open ? "w-64 px-4" : "w-16 px-2"
      }`}
    >
      <div className="flex items-center h-14 mb-6">
        {open ? (
          <>
            <img src="/logo.jpg" alt="InTakeOff.AI" className="w-8 h-8 mr-3" />
            <button
              onClick={onToggle}
              className="ml-auto w-9 h-9 rounded-md flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              <FiMenu size={20} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="mx-auto w-9 h-9 rounded-md flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            <FiMenu size={20} />
          </button>
        )}
      </div>

      <nav className="space-y-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center rounded-lg ${
              open ? "gap-3 px-3 py-2" : "justify-center py-2"
            } ${isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`
          }
        >
          <FiHome size={18} />
          {open && <span>Dashboard</span>}
        </NavLink>

        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `flex items-center rounded-lg ${
              open ? "gap-3 px-3 py-2" : "justify-center py-2"
            } ${isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`
          }
        >
          <FiFolder size={18} />
          {open && <span>Projects</span>}
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center rounded-lg ${
              open ? "gap-3 px-3 py-2" : "justify-center py-2"
            } ${isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`
          }
        >
          <FiSettings size={18} />
          {open && <span>Settings</span>}
        </NavLink>
      </nav>
    </aside>
  )
}

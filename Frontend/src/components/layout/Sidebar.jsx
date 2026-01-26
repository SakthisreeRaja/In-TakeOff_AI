import { NavLink, useNavigate } from "react-router-dom"
import { FiHome, FiFolder, FiSettings, FiMenu, FiLogOut } from "react-icons/fi"

export default function Sidebar({ open, onToggle }) {
  const navigate = useNavigate()

  function handleLogout() {
    // 1. Clear the session
    localStorage.removeItem("user_id")
    // 2. Force redirect to Sign In
    navigate("/signin", { replace: true })
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-zinc-900 text-white transition-all duration-300 flex flex-col ${
        open ? "w-64 px-4" : "w-16 px-2"
      }`}
    >
      {/* --- HEADER (Logo & Toggle) --- */}
      <div className="flex items-center h-14 mb-6 flex-shrink-0">
        {open ? (
          <>
            {/* You can replace this src with your actual logo path */}
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 mr-3 rounded" />
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

      {/* --- NAVIGATION LINKS (Pushed to top) --- */}
      <nav className="space-y-1 flex-1">
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

      {/* --- LOGOUT BUTTON (Pushed to bottom) --- */}
      <div className="mb-6 border-t border-zinc-800 pt-4 flex-shrink-0">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${
             open ? "gap-3 px-3 py-2" : "justify-center py-2"
          }`}
          title="Sign Out"
        >
          <FiLogOut size={18} />
          {open && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
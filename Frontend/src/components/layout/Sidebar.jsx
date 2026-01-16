import { NavLink } from "react-router-dom"
import { FiHome, FiFolder, FiSettings } from "react-icons/fi"

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-900 text-white p-6">
      <h1 className="text-xl font-semibold mb-8">InTakeOff.AI</h1>
      <nav className="space-y-2">
        <NavLink to="/" className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? "bg-zinc-800" : "text-zinc-400"}`
        }>
          <FiHome />
          Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? "bg-zinc-800" : "text-zinc-400"}`
        }>
          <FiFolder />
          Projects
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? "bg-zinc-800" : "text-zinc-400"}`
        }>
          <FiSettings />
          Settings
        </NavLink>
      </nav>
    </aside>
  )
}

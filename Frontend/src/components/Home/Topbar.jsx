import { FiBell, FiMoon } from "react-icons/fi"

function Topbar() {
  return (
    <div className="h-14 px-6 flex items-center justify-between border-b border-zinc-800">
      <h3 className="text-sm text-gray-400">Dashboard</h3>

      <div className="flex items-center gap-4">
        <FiBell className="text-xl cursor-pointer text-gray-400 hover:text-white" />
        <FiMoon className="text-xl cursor-pointer text-gray-400 hover:text-white" />
      </div>
    </div>
  )
}

export default Topbar

import { FiHome, FiFolder, FiSettings } from "react-icons/fi"

function Sidebar() {
  return (
    <aside className="w-[18%] bg-zinc-900 p-6 flex flex-col">
      <div>
        <h1 className="text-xl font-bold mb-10">
          InTake-off.ai
        </h1>

        <nav className="flex flex-col gap-4 text-gray-300">
          <button className="flex items-center gap-3 text-white">
            <FiHome /> Dashboard
          </button>

          <button className="flex items-center gap-3">
            <FiFolder /> Projects
          </button>

          <button className="flex items-center gap-3">
            <FiSettings /> Settings
          </button>
        </nav>
      </div>

      <button
        type="button"
        className="mt-auto pt-6 border-t border-zinc-800 flex items-center gap-3 w-full text-left hover:bg-zinc-800 rounded-lg p-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-semibold">
            U
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full" />
        </div>

        <div className="leading-tight">
          <p className="text-sm font-medium">
            User
          </p>
          <p className="text-xs text-gray-400">
            Online
          </p>
        </div>
      </button>
    </aside>
  )
}

export default Sidebar

import { FiBell, FiMoon } from "react-icons/fi"

function Topbar() {
  return (
    <div className="h-14 border-b border-zinc-800 flex items-center justify-end px-6 gap-4">
      <FiBell className="cursor-pointer" />
      <FiMoon className="cursor-pointer" />
    </div>
  )
}

export default Topbar

import { FiBell, FiMoon } from "react-icons/fi"

export default function Topbar() {
  return (
    <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">
        InTakeOff.AI
      </h1>

      <div className="flex items-center gap-4 text-zinc-400">
        <FiBell className="cursor-pointer hover:text-white" />
        <FiMoon className="cursor-pointer hover:text-white" />
      </div>
    </div>
  )
}

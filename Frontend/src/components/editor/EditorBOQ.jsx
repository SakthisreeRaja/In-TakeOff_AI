import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { useState } from "react"

export default function EditorBOQ() {
  const [open, setOpen] = useState(true)

  return (
    <div
      className={`border-l border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 ${
        open ? "w-80" : "w-12"
      }`}
    >
      <div className="h-12 flex items-center justify-between px-3 border-b border-zinc-800">
        {open && (
          <span className="text-sm font-semibold">
            Bill of Quantities
          </span>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
        >
          {open ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      {open && (
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
          <div className="text-center text-zinc-400 mt-20">
            <p>No detections yet.</p>
            <p className="text-xs mt-1">
              Run detection to generate BOQ
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

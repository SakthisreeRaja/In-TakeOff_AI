import { useState } from "react"
import { FiSliders, FiTool, FiInfo } from "react-icons/fi"

export default function EditorSettings({ filters, setFilters, hidden }) {
  const [activeTab, setActiveTab] = useState("settings")

  const classes = [
    "Diffuser",
    "Grille",
    "Damper",
    "Fan",
    "VAV_FCU",
    "AHU_RTU",
    "Louver",
  ]

  function toggle(cls) {
    setFilters(prev => ({
      ...prev,
      [cls]: !prev[cls],
    }))
  }

  if (hidden) return null

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black text-white">
      {/* Tabs Header */}
      <div className="flex items-center border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "settings"
              ? "border-blue-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FiSliders />
          Settings
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "properties"
              ? "border-blue-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FiInfo />
          Properties
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "tools"
              ? "border-blue-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FiTool />
          Tools
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 scrollbar-hide">
        {activeTab === "settings" && (
          <div className="animate-in fade-in duration-300">
            <p className="text-xs text-zinc-400 mb-2 mt-2">
              Confidence Threshold: 15%
            </p>
            <input type="range" className="w-full mb-6 accent-blue-500" />

            <h4 className="text-sm font-semibold mb-3 text-zinc-200">
              Class Filters
            </h4>

            <div className="space-y-3 text-sm text-zinc-300">
              {classes.map(cls => (
                <label
                  key={cls}
                  className="flex items-center gap-3 cursor-pointer select-none hover:text-white transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters[cls]}
                    onChange={() => toggle(cls)}
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-blue-600 focus:ring-offset-zinc-900 focus:ring-blue-500"
                  />
                  {cls.replace("_", " / ")}
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === "properties" && (
          <div className="text-center text-zinc-500 mt-10 animate-in fade-in duration-300">
            <p className="text-sm">No element selected</p>
            <p className="text-xs mt-1">Select a component to view details</p>
          </div>
        )}

        {activeTab === "tools" && (
          <div className="grid grid-cols-2 gap-3 mt-2 animate-in fade-in duration-300">
             <button className="flex flex-col items-center justify-center bg-zinc-900 hover:bg-zinc-800 p-4 rounded-lg border border-zinc-800 transition-colors">
                <span className="text-xl mb-2">✏️</span>
                <span className="text-xs text-zinc-300">Draw Box</span>
             </button>
             <button className="flex flex-col items-center justify-center bg-zinc-900 hover:bg-zinc-800 p-4 rounded-lg border border-zinc-800 transition-colors">
                <span className="text-xl mb-2">📏</span>
                <span className="text-xs text-zinc-300">Measure</span>
             </button>
             <button className="flex flex-col items-center justify-center bg-zinc-900 hover:bg-zinc-800 p-4 rounded-lg border border-zinc-800 transition-colors">
                <span className="text-xl mb-2">🗑️</span>
                <span className="text-xs text-zinc-300">Eraser</span>
             </button>
          </div>
        )}
      </div>
    </div>
  )
}
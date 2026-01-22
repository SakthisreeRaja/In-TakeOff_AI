import { useState } from "react"
import { FiSliders, FiInfo, FiTool } from "react-icons/fi"

export default function EditorSettings({ filters, setFilters, hidden, activeTool, setActiveTool, width }) {
  const [activeTab, setActiveTab] = useState("tools")

  const isNarrow = width < 220

  const classes = [
    "Diffuser", "Grille", "Damper", "Fan",
    "VAV_FCU", "AHU_RTU", "Louver",
  ]

  function toggle(cls) {
    setFilters(prev => ({ ...prev, [cls]: !prev[cls] }))
  }

  const renderSettings = () => (
    <div className="animate-in fade-in duration-300">
      <p className="text-xs text-zinc-400 mb-2 mt-2">Confidence Threshold: 15%</p>
      <input type="range" className="w-full mb-6 accent-blue-500" />
      <h4 className="text-sm font-semibold mb-3 text-zinc-200">Class Filters</h4>
      <div className="space-y-3 text-sm text-zinc-300">
        {classes.map(cls => (
          <label key={cls} className="flex items-center gap-3 cursor-pointer select-none hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={filters[cls]}
              onChange={() => toggle(cls)}
              className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-blue-600 focus:ring-offset-zinc-900 focus:ring-blue-500"
            />
            {isNarrow ? (
              <span className="truncate">{cls.replace("_", "/").substring(0, 15)}</span>
            ) : (
              <span>{cls.replace("_", " / ")}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  )

  const renderProperties = () => (
    <div className="text-center text-zinc-500 mt-10 animate-in fade-in duration-300">
      <p className="text-sm">No element selected</p>
      <p className="text-xs mt-1">Select a component to view details</p>
    </div>
  )

  const renderTools = () => (
    <div className={`grid gap-3 mt-2 animate-in fade-in duration-300 ${isNarrow ? "grid-cols-1" : "grid-cols-2"}`}>
      <button 
        onClick={() => setActiveTool("select")}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${activeTool === "select" ? "bg-zinc-800 border-blue-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"}`}
      >
        <span className="text-xl mb-2">👆</span> <span className="text-xs">Select</span>
      </button>
      <button 
        onClick={() => setActiveTool("draw_box")}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${activeTool === "draw_box" ? "bg-zinc-800 border-blue-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"}`}
      >
        <span className="text-xl mb-2">✏️</span> <span className="text-xs">Draw Box</span>
      </button>
      <button 
        onClick={() => setActiveTool("measure")}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${activeTool === "measure" ? "bg-zinc-800 border-blue-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"}`}
      >
        <span className="text-xl mb-2">📏</span> <span className="text-xs">Measure</span>
      </button>
      <button 
        onClick={() => setActiveTool("eraser")}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${activeTool === "eraser" ? "bg-zinc-800 border-blue-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"}`}
      >
        <span className="text-xl mb-2">🗑️</span> <span className="text-xs">Eraser</span>
      </button>
    </div>
  )

  if (hidden) return null

  if (isNarrow) {
    return (
      <div className="h-full flex flex-col overflow-y-auto bg-black text-white scrollbar-hide">
        <div className="border-b border-zinc-800">
          <button
            onClick={() => setActiveTab(activeTab === "settings" ? "" : "settings")}
            className={`w-full flex items-center gap-3 px-4 h-12 text-sm font-medium transition-colors hover:bg-zinc-900 ${activeTab === "settings" ? "text-blue-500" : "text-zinc-400"}`}
          >
            <FiSliders size={16} /> <span>Settings</span>
          </button>
          {activeTab === "settings" && (
            <div className="px-4 pb-4 bg-zinc-950/50 border-t border-zinc-800/50">
              {renderSettings()}
            </div>
          )}
        </div>

        <div className="border-b border-zinc-800">
          <button
            onClick={() => setActiveTab(activeTab === "properties" ? "" : "properties")}
            className={`w-full flex items-center gap-3 px-4 h-12 text-sm font-medium transition-colors hover:bg-zinc-900 ${activeTab === "properties" ? "text-blue-500" : "text-zinc-400"}`}
          >
            <FiInfo size={16} /> <span>Properties</span>
          </button>
          {activeTab === "properties" && (
            <div className="px-4 pb-4 bg-zinc-950/50 border-t border-zinc-800/50">
              {renderProperties()}
            </div>
          )}
        </div>

        <div className="border-b border-zinc-800">
          <button
            onClick={() => setActiveTab(activeTab === "tools" ? "" : "tools")}
            className={`w-full flex items-center gap-3 px-4 h-12 text-sm font-medium transition-colors hover:bg-zinc-900 ${activeTab === "tools" ? "text-blue-500" : "text-zinc-400"}`}
          >
            <FiTool size={16} /> <span>Tools</span>
          </button>
          {activeTab === "tools" && (
            <div className="px-4 pb-4 bg-zinc-950/50 border-t border-zinc-800/50">
              {renderTools()}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black text-white">
      <div className="flex items-center border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "settings" ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FiSliders /> Settings
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "properties" ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FiInfo /> Properties
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "tools" ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FiTool /> Tools
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 scrollbar-hide">
        {activeTab === "settings" && renderSettings()}
        {activeTab === "properties" && renderProperties()}
        {activeTab === "tools" && renderTools()}
      </div>
    </div>
  )
}
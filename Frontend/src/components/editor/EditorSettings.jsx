import { useState } from "react"
import { 
  FiSliders, FiInfo, FiTool, 
  FiMousePointer, FiMove, FiSquare, FiPenTool, 
  FiMaximize, FiGrid, FiPlusCircle, FiType, 
  FiMap, FiZoomIn, FiZoomOut, FiTrash2, FiLayers
} from "react-icons/fi"

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
    <div className="animate-in fade-in duration-300 space-y-4">
      <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Dimensions</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Neck Size</label>
            <input type="text" placeholder='12"x12"' className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Face Size</label>
            <input type="text" placeholder='24"x24"' className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Inlet Size</label>
          <input type="text" placeholder='10" Ø' className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none" />
        </div>
      </div>

      <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Specifications</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">CFM</label>
            <input type="number" placeholder="450" className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Orientation</label>
            <select className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none">
              <option>0°</option>
              <option>90°</option>
              <option>180°</option>
              <option>270°</option>
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="text-[10px] text-zinc-500 block mb-1">Material</label>
          <select className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none">
            <option>Aluminum</option>
            <option>Steel</option>
            <option>Plastic</option>
            <option>Stainless Steel</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="text-[10px] text-zinc-500 block mb-1">Manufacturer & Model</label>
          <input type="text" placeholder="Titus / T-123" className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
           <label className="text-[10px] text-zinc-500 block mb-1">Specification Note</label>
           <textarea rows="3" className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none resize-none" placeholder="Add specific notes..."></textarea>
        </div>
      </div>
    </div>
  )

  const toolsList = [
    { id: "select", icon: FiMousePointer, label: "Select" },
    { id: "pan", icon: FiMove, label: "Pan" },
    { id: "draw_box", icon: FiSquare, label: "Box (Equip)" },
    { id: "polyline", icon: FiPenTool, label: "Polyline (Duct)" },
    { id: "measure", icon: FiMaximize, label: "Distance" },
    { id: "area", icon: FiGrid, label: "Area (Zone)" },
    { id: "count", icon: FiPlusCircle, label: "Counter" },
    { id: "text", icon: FiType, label: "Text/Tag" },
    { id: "scale", icon: FiMap, label: "Set Scale" },
    { id: "zoom_in", icon: FiZoomIn, label: "Zoom In" },
    { id: "zoom_out", icon: FiZoomOut, label: "Zoom Out" },
    { id: "eraser", icon: FiTrash2, label: "Eraser" },
  ]

  const renderTools = () => (
    <div className={`grid gap-2 mt-2 animate-in fade-in duration-300 ${isNarrow ? "grid-cols-2" : "grid-cols-3"}`}>
      {toolsList.map((tool) => {
        const Icon = tool.icon
        const isActive = activeTool === tool.id
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all duration-200
              ${isActive 
                ? "bg-blue-600/10 border-blue-500 text-blue-400" 
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
              }`}
          >
            <Icon size={18} className="mb-1.5" />
            <span className="text-[10px] font-medium text-center leading-tight">{tool.label}</span>
          </button>
        )
      })}
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
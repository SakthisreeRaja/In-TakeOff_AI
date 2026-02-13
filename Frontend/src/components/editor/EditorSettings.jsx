import { useEffect, useState } from "react"
import {
  FiInfo,
  FiTool,
  FiMousePointer,
  FiMove,
  FiSquare,
  FiPenTool,
  FiMaximize,
  FiGrid,
  FiPlusCircle,
  FiType,
  FiMap,
  FiZoomIn,
  FiZoomOut,
  FiTrash2,
  FiLayers,
  FiEdit3,
  FiArrowLeft,
} from "react-icons/fi"
import { ANNOTATION_CLASS_OPTIONS, getAnnotationClassLabel } from "./annotationClasses"

export default function EditorSettings({
  filters,
  setFilters,
  selectedClass,
  setSelectedClass,
  hidden,
  activeTool,
  setActiveTool,
  width,
  selectedDetection,
  onChangeDetectionClass,
  onClearSelection,
}) {
  const [activeTab, setActiveTab] = useState("tools")
  const isNarrow = width < 220
  const isDrawBoxTool = activeTool === "draw_box"
  const selectedDetectionId = selectedDetection?.id || null

  function toggle(cls) {
    setFilters(prev => ({ ...prev, [cls]: !prev[cls] }))
  }

  useEffect(() => {
    if (!selectedDetectionId) return
    setActiveTab("properties")
  }, [selectedDetectionId])

  useEffect(() => {
    if (!isDrawBoxTool && activeTab === "drawing") {
      setActiveTab("tools")
    }
  }, [activeTab, isDrawBoxTool])

  const renderSelectedAnnotation = () => {
    if (!selectedDetection) return null

    return (
      <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Selected Annotation
          </h4>
          <button
            type="button"
            onClick={() => onClearSelection && onClearSelection()}
            className="text-[10px] text-zinc-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
        <div className="text-[11px] text-zinc-400 mb-3">
          Click a class to update. Confidence will be set to 100%.
        </div>
        <div className={`grid gap-2 ${isNarrow ? "grid-cols-2" : "grid-cols-3"}`}>
          {ANNOTATION_CLASS_OPTIONS.map(option => {
            const isActive = selectedDetection.class_name === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChangeDetectionClass && onChangeDetectionClass(option.value)}
                className={`px-2 py-1.5 rounded border text-[11px] font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600/20 border-blue-500 text-blue-200"
                    : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <div className="mt-3 text-[11px] text-zinc-500">
          Current: <span className="text-zinc-200">{getAnnotationClassLabel(selectedDetection.class_name || "-")}</span>
          {selectedDetection.is_manual ? " (Manual)" : " (AI)"}
        </div>
      </div>
    )
  }

  const renderDrawingClassPicker = () => (
    <div className="animate-in fade-in duration-300">
      <div className="space-y-2 text-sm text-zinc-300">
        {ANNOTATION_CLASS_OPTIONS.map(option => (
          <label
            key={option.value}
            className="flex items-center gap-3 cursor-pointer select-none hover:text-white transition-colors p-2 rounded hover:bg-zinc-900/50"
          >
            <input
              type="radio"
              name="drawingClass"
              checked={selectedClass === option.value}
              onChange={() => setSelectedClass(option.value)}
              className="w-4 h-4 bg-zinc-800 border-zinc-600 text-blue-600 focus:ring-offset-zinc-900 focus:ring-blue-500"
            />
            {isNarrow ? (
              <span className="truncate">{option.label.substring(0, 15)}</span>
            ) : (
              <span>{option.label}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  )

  const renderClassFilters = () => (
    <div className="animate-in fade-in duration-300">
      <h4 className="text-sm font-semibold mb-3 text-zinc-200">Class Visibility Filters</h4>
      <p className="text-xs text-zinc-400 mb-4">Toggle which classes are visible on the canvas</p>

      <div className="space-y-3 text-sm text-zinc-300">
        {ANNOTATION_CLASS_OPTIONS.map(option => (
          <label key={option.value} className="flex items-center gap-3 cursor-pointer select-none hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={Boolean(filters[option.value])}
              onChange={() => toggle(option.value)}
              className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-blue-600 focus:ring-offset-zinc-900 focus:ring-blue-500"
            />
            {isNarrow ? (
              <span className="truncate">{option.label.substring(0, 15)}</span>
            ) : (
              <span>{option.label}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  )

  const renderProperties = () => (
    <div className="animate-in fade-in duration-300 space-y-4">
      {renderSelectedAnnotation()}
      <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Dimensions</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Neck Size</label>
            <input
              type="text"
              placeholder='12"x12"'
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Face Size</label>
            <input
              type="text"
              placeholder='24"x24"'
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Inlet Size</label>
          <input
            type="text"
            placeholder='10" dia'
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Specifications</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">CFM</label>
            <input
              type="number"
              placeholder="450"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Orientation</label>
            <select className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none">
              <option>0 deg</option>
              <option>90 deg</option>
              <option>180 deg</option>
              <option>270 deg</option>
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
          <input
            type="text"
            placeholder="Titus / T-123"
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 block mb-1">Specification Note</label>
          <textarea
            rows="3"
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none resize-none"
            placeholder="Add specific notes..."
          />
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
      {toolsList.map(tool => {
        const Icon = tool.icon
        const isActive = activeTool === tool.id
        return (
          <button
            key={tool.id}
            onClick={() => {
              setActiveTool(tool.id)
              if (tool.id === "draw_box") {
                setActiveTab("drawing")
              }
            }}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all duration-200
              ${
                isActive
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

  const renderAccordionSection = (tabId, Icon, title, content) => (
    <div key={tabId} className="border-b border-zinc-800">
      <button
        onClick={() => setActiveTab(activeTab === tabId ? "" : tabId)}
        className={`w-full flex items-center gap-3 px-4 h-12 text-sm font-medium transition-colors hover:bg-zinc-900 ${activeTab === tabId ? "text-blue-500" : "text-zinc-400"}`}
      >
        <Icon size={16} />
        <span>{title}</span>
      </button>
      {activeTab === tabId && (
        <div className="px-4 pb-4 bg-zinc-950/50 border-t border-zinc-800/50">
          {content}
        </div>
      )}
    </div>
  )

  if (hidden) return null

  if (isNarrow) {
    return (
      <div className="h-full flex flex-col overflow-y-auto bg-black text-white scrollbar-hide">
        {isDrawBoxTool && renderAccordionSection("drawing", FiEdit3, "Draw Class", renderDrawingClassPicker())}
        {renderAccordionSection("classes", FiLayers, "Classes", renderClassFilters())}
        {renderAccordionSection("properties", FiInfo, "Properties", renderProperties())}
        {renderAccordionSection("tools", FiTool, "Tools", renderTools())}
      </div>
    )
  }

  if (isDrawBoxTool && activeTab === "drawing") {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-black text-white">
        <div className="flex items-center border-b border-zinc-800 h-12">
          <button
            onClick={() => {
              setActiveTab("tools")
              setActiveTool("select")
            }}
            className="flex items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-colors"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="flex-1 text-center text-sm font-medium text-white">Annotations</div>
          <div className="w-16"></div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 scrollbar-hide">
          {renderDrawingClassPicker()}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black text-white">
      <div className="flex items-center border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("classes")}
          className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "classes" ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FiLayers /> Classes
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
        {activeTab === "classes" && renderClassFilters()}
        {activeTab === "properties" && renderProperties()}
        {activeTab === "tools" && renderTools()}
      </div>
    </div>
  )
}

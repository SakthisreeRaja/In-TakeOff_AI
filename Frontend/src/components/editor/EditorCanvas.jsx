export default function EditorCanvas({ activeTool, onUpload }) {
  const getCursor = () => {
    switch (activeTool) {
      case "pan": return "grab"
      case "draw_box": return "crosshair"
      case "polyline": return "crosshair"
      case "measure": return "crosshair"
      case "area": return "crosshair"
      case "count": return "copy"
      case "text": return "text"
      case "eraser": return "not-allowed"
      case "scale": return "crosshair"
      case "zoom_in": return "zoom-in"
      case "zoom_out": return "zoom-out"
      default: return "default"
    }
  }

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-black"
      style={{ cursor: getCursor() }}
    >
      <div className="text-center text-zinc-400 p-4">
        <div className="text-4xl mb-4">⬆️</div>
        <p className="mb-2 text-lg font-medium">No PDF Uploaded</p>
        <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">
          Upload HVAC PDF to begin detection
        </p>
        <button
          onClick={onUpload}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Upload PDF
        </button>
      </div>
    </div>
  )
}

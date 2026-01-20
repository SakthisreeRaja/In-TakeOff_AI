export default function EditorCanvas() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <div className="text-center text-zinc-400">
        <div className="text-4xl mb-4">⬆️</div>
        <p className="mb-2">No PDF Uploaded</p>
        <p className="text-xs mb-4">
          Upload a PDF drawing to start detecting HVAC components
        </p>
        <button className="bg-blue-600 px-4 py-2 rounded-lg text-sm">
          Upload PDF
        </button>
      </div>
    </div>
  )
}

export default function EditorCanvas({ activeTool }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-black">
      <div className="text-center text-zinc-400 p-4">
        <div className="text-4xl mb-4">⬆️</div>
        <p className="mb-2 text-lg font-medium">No PDF Uploaded</p>
        <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">
          Upload functionality is pending backend integration.
        </p>
        <button
          onClick={() => alert("Waiting for backend integration.")}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          Upload PDF
        </button>
      </div>
    </div>
  )
}
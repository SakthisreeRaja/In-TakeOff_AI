export default function EditorBOQ() {
  return (
    <div className="w-80 border-l border-zinc-800 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          Bill of Quantities
        </h3>
        <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">
          0 items
        </span>
      </div>

      <div className="text-center text-zinc-400 mt-20">
        <p>No detections yet.</p>
        <p className="text-xs mt-1">
          Run detection to generate BOQ
        </p>
      </div>

      <button className="w-full mt-6 bg-blue-600 py-2 rounded-lg text-sm">
        Export BOQ
      </button>
    </div>
  )
}

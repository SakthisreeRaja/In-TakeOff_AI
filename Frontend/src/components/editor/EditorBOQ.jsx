export default function EditorBOQ({ hidden }) {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="h-12 flex items-center px-4 border-b border-zinc-800 flex-shrink-0">
        {!hidden && (
          <span className="text-sm font-semibold">
            Bill of Quantities
          </span>
        )}
      </div>

      {!hidden && (
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

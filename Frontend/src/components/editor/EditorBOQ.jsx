import { useMemo } from "react"
import { generateBOQ } from "./boqUtils"

export default function EditorBOQ({ hidden, detections = [], pageNumber = null }) {
  const boq = useMemo(() => generateBOQ(detections), [detections])

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
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="text-xs text-zinc-400">
              {pageNumber ? `Current Page: ${pageNumber}` : "Current Page"}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5">
                <div className="text-zinc-500">Items</div>
                <div className="text-zinc-100 font-semibold">{boq.totals.totalItems}</div>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5">
                <div className="text-zinc-500">Classes</div>
                <div className="text-zinc-100 font-semibold">{boq.totals.totalClasses}</div>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5">
                <div className="text-zinc-500">Manual</div>
                <div className="text-zinc-100 font-semibold">{boq.totals.manualItems}</div>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5">
                <div className="text-zinc-500">Edited (AI)</div>
                <div className="text-zinc-100 font-semibold">{boq.totals.editedAiItems}</div>
              </div>
            </div>
          </div>

          {boq.rows.length === 0 ? (
            <div className="text-center text-zinc-400 mt-12">
              <p>No annotations on this page.</p>
              <p className="text-xs mt-1">
                Draw boxes or run detection to generate BOQ.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <div className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.8fr] gap-2 px-3 py-2 text-[11px] font-semibold text-zinc-300 bg-zinc-900 border-b border-zinc-800">
                <span>Class</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Manual</span>
                <span className="text-right">Edited (AI)</span>
              </div>
              <div>
                {boq.rows.map(row => (
                  <div
                    key={row.className}
                    className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.8fr] gap-2 px-3 py-2 text-xs text-zinc-300 border-b last:border-b-0 border-zinc-800/60"
                  >
                    <span className="truncate" title={row.label}>{row.label}</span>
                    <span className="text-right text-zinc-100">{row.quantity}</span>
                    <span className="text-right">{row.manual}</span>
                    <span className="text-right">{row.editedAi}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

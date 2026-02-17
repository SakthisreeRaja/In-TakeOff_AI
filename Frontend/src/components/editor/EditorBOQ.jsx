import { useMemo, useState, useEffect } from "react"
import { getPageDetections } from "../../services/api"
import { generateBOQ } from "./boqUtils"
import { getAnnotationClassLabel, getClassColor } from "./annotationClasses"

function getItemStatus(det) {
  if (det?.is_manual) return "Manual"
  if (det?.is_edited) return "Edited (AI)"
  return "AI"
}

export default function EditorBOQ({
  hidden,
  detections = [],
  pageNumber = null,
  pages = [],
  onJumpToDetection,
  deletionTrigger = 0,
}) {
  const [viewMode, setViewMode] = useState("current")
  const [isGeneratingFullBOQ, setIsGeneratingFullBOQ] = useState(false)
  const [fullPdfDetections, setFullPdfDetections] = useState([])
  const [fullBoqError, setFullBoqError] = useState("")

  const currentPageDetections = useMemo(
    () => detections.map(det => ({ ...det, page_number: pageNumber || det.page_number || null })),
    [detections, pageNumber]
  )

  const activeDetections = viewMode === "full" ? fullPdfDetections : currentPageDetections
  const boq = useMemo(() => generateBOQ(activeDetections), [activeDetections])

  const sortedDetectionRows = useMemo(() => {
    return [...activeDetections].sort((a, b) => {
      const pageDiff = (a.page_number || 0) - (b.page_number || 0)
      if (pageDiff !== 0) return pageDiff
      const classDiff = (a.class_name || "").localeCompare(b.class_name || "")
      if (classDiff !== 0) return classDiff
      return (a.id || "").localeCompare(b.id || "")
    })
  }, [activeDetections])

  // Refresh full PDF BOQ when a detection is deleted (if currently viewing full PDF)
  useEffect(() => {
    if (deletionTrigger > 0 && viewMode === "full" && pages.length > 0) {
      handleGenerateFullPdfBoq()
    }
  }, [deletionTrigger])

  async function handleGenerateFullPdfBoq() {
    if (!pages.length) return

    setIsGeneratingFullBOQ(true)
    setFullBoqError("")

    try {
      const perPageDetections = await Promise.all(
        pages.map(async page => {
          const pageDetections = await getPageDetections(page.page_id)
          return (pageDetections || []).map(det => ({
            ...det,
            page_number: page.page_number,
          }))
        })
      )

      setFullPdfDetections(perPageDetections.flat())
      setViewMode("full")
    } catch (error) {
      console.error("Failed to generate full PDF BOQ:", error)
      setFullBoqError("Failed to generate full PDF BOQ. Please try again.")
    } finally {
      setIsGeneratingFullBOQ(false)
    }
  }

  const jumpToDetection = det => {
    if (!det || !onJumpToDetection) return
    onJumpToDetection(det)
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-800 flex-shrink-0">
        {!hidden && (
          <>
            <span className="text-sm font-semibold">
              Bill of Quantities
            </span>
            <div className="flex items-center gap-2">
              {viewMode === "full" && (
                <button
                  type="button"
                  onClick={() => setViewMode("current")}
                  className="text-[11px] px-2.5 py-1 rounded border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Current Page
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateFullPdfBoq}
                disabled={isGeneratingFullBOQ || pages.length === 0}
                className="text-[11px] px-2.5 py-1 rounded border border-blue-500/60 text-blue-200 hover:bg-blue-600/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGeneratingFullBOQ ? "Generating..." : "Full PDF BOQ"}
              </button>
            </div>
          </>
        )}
      </div>

      {!hidden && (
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          {fullBoqError && (
            <div className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {fullBoqError}
            </div>
          )}

          <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="text-xs text-zinc-400">
              {viewMode === "full"
                ? "Scope: Complete PDF"
                : pageNumber
                  ? `Scope: Current Page (${pageNumber})`
                  : "Scope: Current Page"}
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
              <p>{viewMode === "full" ? "No annotations found in this PDF." : "No annotations on this page."}</p>
              <p className="text-xs mt-1">
                Draw boxes or run detection to generate BOQ.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <div className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.8fr] gap-2 px-3 py-2 text-[11px] font-semibold text-zinc-300 bg-zinc-900 border-b border-zinc-800">
                  <span>Class</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Manual</span>
                  <span className="text-right">Edited (AI)</span>
                </div>
                <div>
                  {boq.rows.map(row => {
                    const classColor = getClassColor(row.className);
                    return (
                      <div
                        key={row.className}
                        className="w-full grid grid-cols-[1.5fr_0.6fr_0.6fr_0.8fr] gap-2 px-3 py-2 text-xs text-zinc-300 border-b last:border-b-0 border-zinc-800/60 text-left"
                      >
                        <span className="truncate flex items-center gap-2" title={row.label}>
                          <span 
                            className="w-2.5 h-2.5 flex-shrink-0" 
                            style={{ backgroundColor: classColor.stroke }}
                          />
                          {row.label}
                        </span>
                        <span className="text-right text-zinc-100">{row.quantity}</span>
                        <span className="text-right">{row.manual}</span>
                        <span className="text-right">{row.editedAi}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-zinc-800 overflow-hidden">
                <div className="px-3 py-2 text-[11px] font-semibold text-zinc-300 bg-zinc-900 border-b border-zinc-800">
                  Annotation Tracker (Click to focus in editor)
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {sortedDetectionRows.map(det => {
                    const classColor = getClassColor(det.class_name);
                    return (
                      <button
                        key={det.id}
                        type="button"
                        onClick={() => jumpToDetection(det)}
                        className="w-full grid grid-cols-[1.4fr_0.5fr_0.9fr] gap-2 px-3 py-2 text-xs text-zinc-300 border-b last:border-b-0 border-zinc-800/60 hover:bg-zinc-900/70 text-left transition-colors"
                      >
                        <span className="truncate flex items-center gap-2" title={getAnnotationClassLabel(det.class_name)}>
                          <span 
                            className="w-2.5 h-2.5 flex-shrink-0" 
                            style={{ backgroundColor: classColor.stroke }}
                          />
                          {getAnnotationClassLabel(det.class_name)}
                        </span>
                        <span className="text-right text-zinc-400">P{det.page_number || "-"}</span>
                        <span className="text-right text-zinc-200">{getItemStatus(det)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

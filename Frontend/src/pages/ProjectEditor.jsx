import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import EditorHeader from "../components/editor/EditorHeader"
import EditorSettings from "../components/editor/EditorSettings"
import EditorCanvas from "../components/editor/EditorCanvas"
import EditorBOQ from "../components/editor/EditorBOQ"
import useDetections from "../hooks/useDetections"
import {
  createProject,
  getProjects,
  uploadProjectPDF,
  getProjectPages,
  runDetectionOnPage,
} from "../services/api"

export default function ProjectEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  const [project, setProject] = useState(null)
  const [pages, setPages] = useState([])
  const [activeTool, setActiveTool] = useState("select")
  const [activePageIdx, setActivePageIdx] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRunningDetection, setIsRunningDetection] = useState(false)

  const createdRef = useRef(false)
  const pollingIntervalRef = useRef(null)

  const userId = localStorage.getItem("user_id")

  const sortedPages = [...pages].sort(
    (a, b) => a.page_number - b.page_number
  )

  useEffect(() => {
    if (activePageIdx >= sortedPages.length) {
      setActivePageIdx(0)
    }
  }, [sortedPages.length])

  useEffect(() => {
    setActivePageIdx(0)
  }, [project?.id])

  const activePage =
    sortedPages.length > 0 ? sortedPages[activePageIdx] : null

  const { detections, add, remove, refresh } = useDetections(
    activePage?.page_id
  )

  useEffect(() => {
    if (!userId) {
      navigate("/signin", { replace: true })
      return
    }

    if (id === "new" && !createdRef.current) {
      createdRef.current = true
      createProject({
        name: "New Project",
        description: "",
        user_id: userId,
      }).then(p => {
        setProject(p)
        navigate(`/projects/${p.id}`, { replace: true })
      })
      return
    }

    if (id !== "new") {
      setIsInitialLoading(true)
      getProjects().then(list => {
        const p = list.find(x => x.id === id)
        if (!p) {
          setIsInitialLoading(false)
          return
        }
        setProject(p)
        fetchPages(p.id)
      })
    }
  }, [id, navigate, userId])

  useEffect(() => {
    if (location.state?.uploadFile && project && !isUploading) {
      const file = location.state.uploadFile
      window.history.replaceState({}, document.title)
      handlePDFUpload(file)
    }
  }, [location.state, project, isUploading])

  const fetchPages = async projectId => {
    try {
      const res = await getProjectPages(projectId)
      setPages(res.pages || [])
      setIsInitialLoading(false)

      if ((!res.pages || res.pages.length === 0) && isProcessing) {
        startPolling(projectId)
      } else if (res.pages && res.pages.length > 0) {
        setIsProcessing(false)
        stopPolling()
      }
    } catch {
      setIsInitialLoading(false)
    }
  }

  const startPolling = projectId => {
    if (pollingIntervalRef.current) return
    pollingIntervalRef.current = setInterval(() => {
      fetchPages(projectId)
    }, 2000)
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  const [filters, setFilters] = useState({
    Diffuser: true,
    Grille: true,
    Damper: true,
    Fan: true,
    VAV_FCU: true,
    AHU_RTU: true,
    Louver: true,
  })

  const widths = useRef({ settings: 280, boq: 320 })
  const [layout, setLayout] = useState({ settings: 280, boq: 320 })

  function startResize(type, e) {
    e.preventDefault()
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const rect = containerRef.current.getBoundingClientRect()
    const left = rect.left
    const width = rect.width
    const handle = 16

    function onMove(ev) {
      const x = ev.clientX - left
      if (type === "settings") {
        const s = Math.max(0, Math.min(x, width - handle))
        const b = Math.min(widths.current.boq, width - handle - s)
        widths.current = { settings: s, boq: b }
      } else {
        const b = Math.max(0, Math.min(width - (x + 8), width - handle))
        const s = Math.min(widths.current.settings, width - handle - b)
        widths.current = { settings: s, boq: b }
      }
      setLayout({ ...widths.current })
    }

    function onUp() {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  async function handlePDFUpload(file) {
    if (!project) return
    setActivePageIdx(0)
    setIsUploading(true)
    setIsProcessing(true)
    try {
      await uploadProjectPDF(project.id, file)
      startPolling(project.id)
      await fetchPages(project.id)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRunDetection() {
    if (!activePage) return
    setIsRunningDetection(true)
    try {
      const result = await runDetectionOnPage(activePage.page_id)
      await refresh()
      alert(`Detection completed! Found ${result.detections_count} objects.`)
    } catch {
      alert("Failed to run detection.")
    } finally {
      setIsRunningDetection(false)
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full min-h-screen overflow-hidden">
      <EditorHeader
        projectName={project ? project.name : "Project"}
        onBack={() => navigate("/projects")}
        onRunDetection={handleRunDetection}
        isRunningDetection={isRunningDetection}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => e.target.files?.[0] && handlePDFUpload(e.target.files[0])}
      />

      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <div style={{ width: layout.settings }} className="border-r border-zinc-800 flex-shrink-0 overflow-hidden">
          <EditorSettings
            filters={filters}
            setFilters={setFilters}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            hidden={layout.settings < 60}
            width={layout.settings}
          />
        </div>

        <div onMouseDown={e => startResize("settings", e)} className="w-2 bg-zinc-900 hover:bg-zinc-800 flex-shrink-0 cursor-col-resize" />

        <div className="flex-1 min-w-0 overflow-hidden relative bg-black">
          {sortedPages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/95 border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-3">
              <button
                onClick={() => setActivePageIdx(i => Math.max(0, i - 1))}
                disabled={activePageIdx === 0}
              >
                ←
              </button>
              <span>
                Page {sortedPages[activePageIdx]?.page_number} of {sortedPages.length}
              </span>
              <button
                onClick={() =>
                  setActivePageIdx(i => Math.min(sortedPages.length - 1, i + 1))
                }
                disabled={activePageIdx === sortedPages.length - 1}
              >
                →
              </button>
            </div>
          )}

          <EditorCanvas
            activeTool={activeTool}
            pages={sortedPages}
            activePageId={activePage?.page_id}
            detections={detections}
            onAddDetection={box =>
              add({ ...box, project_id: project?.id, page_id: activePage?.page_id })
            }
            onDeleteDetection={remove}
            onUpload={() => fileInputRef.current.click()}
            isProcessing={isProcessing}
            isUploading={isUploading}
            isInitialLoading={isInitialLoading}
          />
        </div>

        <div onMouseDown={e => startResize("boq", e)} className="w-2 bg-zinc-900 hover:bg-zinc-800 flex-shrink-0 cursor-col-resize" />

        <div style={{ width: layout.boq }} className="border-l border-zinc-800 flex-shrink-0 overflow-hidden">
          <EditorBOQ hidden={layout.boq < 60} />
        </div>
      </div>
    </div>
  )
}

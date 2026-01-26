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
  const createdRef = useRef(false)
  const pollingIntervalRef = useRef(null)

  const userId = localStorage.getItem("user_id")

  // --- Logic to get the Active Page ---
  const activePage = pages.length > 0 ? pages[activePageIdx] : null
  
  // --- Hook: Fetch Detections for the Active Page ---
  const { detections, add, remove, update } = useDetections(activePage?.page_id)

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
      getProjects().then(list => {
        const p = list.find(x => x.id === id)
        if (!p) return
        setProject(p)
        fetchPages(p.id)
      })
    }
  }, [id, navigate, userId])

  // Handle file upload from NewProject page
  useEffect(() => {
    if (location.state?.uploadFile && project && !isUploading) {
      const file = location.state.uploadFile
      // Clear the state to prevent re-upload on navigation
      window.history.replaceState({}, document.title)
      handlePDFUpload(file)
    }
  }, [location.state, project, isUploading])

  // Fetch pages function
  const fetchPages = async (projectId) => {
    try {
      const res = await getProjectPages(projectId)
      setPages(res.pages || [])
      
      // If we're still processing and no pages yet, start polling
      if ((!res.pages || res.pages.length === 0) && isProcessing) {
        startPolling(projectId)
      } else if (res.pages && res.pages.length > 0) {
        setIsProcessing(false)
        stopPolling()
      }
    } catch (error) {
      console.error("Error fetching pages:", error)
    }
  }

  // Start polling for page updates
  const startPolling = (projectId) => {
    if (pollingIntervalRef.current) return // Already polling
    
    pollingIntervalRef.current = setInterval(() => {
      fetchPages(projectId)
    }, 2000) // Poll every 2 seconds
  }

  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  // Cleanup polling on unmount
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
  const [isDragging, setIsDragging] = useState(false)

  function startResize(type, e) {
    e.preventDefault()
    setIsDragging(true)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const containerRect = containerRef.current.getBoundingClientRect()
    const containerLeft = containerRect.left
    const containerWidth = containerRect.width
    const handleWidth = 16

    function onMove(ev) {
      const mouseX = ev.clientX - containerLeft

      if (type === "settings") {
        let newSettings = Math.max(0, Math.min(mouseX, containerWidth - handleWidth))
        const availableForBoq = containerWidth - handleWidth - newSettings
        const newBoq = Math.min(widths.current.boq, availableForBoq)
        widths.current = { settings: newSettings, boq: newBoq }
      } else {
        let newBoq = Math.max(
          0,
          Math.min(containerWidth - (mouseX + 8), containerWidth - handleWidth)
        )
        const availableForSettings = containerWidth - handleWidth - newBoq
        const newSettings = Math.min(widths.current.settings, availableForSettings)
        widths.current = { settings: newSettings, boq: newBoq }
      }

      setLayout({ ...widths.current })
    }

    function onUp() {
      setIsDragging(false)
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

    setIsUploading(true)
    setIsProcessing(true)

    try {
      await uploadProjectPDF(project.id, file)
      
      // Start polling for pages
      startPolling(project.id)
      
      // Initial fetch
      await fetchPages(project.id)
    } catch (error) {
      console.error("Error uploading PDF:", error)
      setIsProcessing(false)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full min-h-screen overflow-hidden">
      <EditorHeader
        projectName={project ? project.name : "Project"}
        onBack={() => navigate("/projects")}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => {
          if (e.target.files?.[0]) {
            handlePDFUpload(e.target.files[0])
          }
        }}
      />

      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <div
          style={{ width: layout.settings }}
          className="border-r border-zinc-800 flex-shrink-0 overflow-hidden"
        >
          <EditorSettings
            filters={filters}
            setFilters={setFilters}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            hidden={layout.settings < 60}
            width={layout.settings}
          />
        </div>

        <div
          onMouseDown={e => startResize("settings", e)}
          className="w-2 bg-zinc-900 hover:bg-zinc-800 flex-shrink-0 z-50 flex items-center justify-center cursor-col-resize"
        >
          <div className="grid grid-cols-2 gap-0.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-0.5 h-0.5 bg-zinc-500 rounded-full" />
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0 overflow-hidden relative bg-black">
          {/* Page Navigation - Show if multiple pages */}
          {pages.length > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-zinc-900/95 border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-3">
              <button
                onClick={() => setActivePageIdx(Math.max(0, activePageIdx - 1))}
                disabled={activePageIdx === 0}
                className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="text-white text-sm font-medium">
                Page {activePageIdx + 1} of {pages.length}
              </span>
              <button
                onClick={() => setActivePageIdx(Math.min(pages.length - 1, activePageIdx + 1))}
                disabled={activePageIdx === pages.length - 1}
                className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute top-4 right-4 z-10 bg-blue-600/90 border border-blue-500 rounded-lg px-4 py-2 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span className="text-white text-sm font-medium">Processing PDF...</span>
            </div>
          )}

          <EditorCanvas
            activeTool={activeTool}
            pages={pages}
            activePageId={activePage?.page_id}
            detections={detections}
            onAddDetection={(box) => add({ 
                ...box, 
                project_id: project?.id, 
                page_id: activePage?.page_id 
            })}
            onDeleteDetection={remove}
            onUpload={() => fileInputRef.current.click()}
            isProcessing={isProcessing}
            isUploading={isUploading}
          />
        </div>

        <div
          onMouseDown={e => startResize("boq", e)}
          className="w-2 bg-zinc-900 hover:bg-zinc-800 flex-shrink-0 z-50 flex items-center justify-center cursor-col-resize"
        >
          <div className="grid grid-cols-2 gap-0.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-0.5 h-0.5 bg-zinc-500 rounded-full" />
            ))}
          </div>
        </div>

        <div
          style={{ width: layout.boq }}
          className="border-l border-zinc-800 flex-shrink-0 overflow-hidden"
        >
          <EditorBOQ hidden={layout.boq < 60} />
        </div>
      </div>
    </div>
  )
}
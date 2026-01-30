import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import EditorHeader from "../components/editor/EditorHeader"
import EditorSettings from "../components/editor/EditorSettings"
import EditorCanvas from "../components/editor/EditorCanvas"
import EditorBOQ from "../components/editor/EditorBOQ"
import useDetections from "../hooks/useDetections"
import pdfPreviewService from "../services/pdfPreviewService"
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
  const [previewPages, setPreviewPages] = useState([]) // Local preview before upload
  const [uploadStatus, setUploadStatus] = useState({
    isUploading: false,
    stage: null, // 'converting', 'uploading', 'complete', 'error'
    progress: 0,
    error: null
  })

  const createdRef = useRef(false)
  const pollingIntervalRef = useRef(null)
  const uploadInitiatedRef = useRef(false) // Track if upload already started

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

  const { detections, add, remove, refresh, syncStatus = {}, syncNow, cancelSync } = useDetections(
    activePage?.page_id
  )

  // Check if there are unsaved changes
  const hasPendingChanges = syncStatus?.syncing || (syncStatus?.pendingCount && syncStatus.pendingCount > 0)
  const hasUploadInProgress = isProcessing

  // Warn user when refreshing page, closing tab, or closing browser
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check conditions inside the handler to get latest values
      const shouldWarn = hasPendingChanges || hasUploadInProgress
      
      console.log("beforeunload triggered:", { hasPendingChanges, hasUploadInProgress, shouldWarn })
      
      if (shouldWarn) {
        // Standard way to trigger browser's "Leave site?" dialog
        e.preventDefault()
        // Chrome/Edge requires returnValue to be set (even though the message is ignored)
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasPendingChanges, hasUploadInProgress])

  // Cleanup on component unmount (leaving project)
  useEffect(() => {
    return () => {
      // Stop polling when leaving
      stopPolling()
      // Cancel any pending syncs if we're just navigating away
      if (cancelSync) {
        cancelSync()
      }
    }
  }, [])

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
        setIsInitialLoading(false) // No pages yet, show upload UI immediately
        navigate(`/projects/${p.id}`, { replace: true })
      })
      return
    }

    if (id !== "new") {
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

  // Remove this useEffect - no longer using uploadFile from state

  const fetchPages = async projectId => {
    try {
      setIsInitialLoading(true)
      const res = await getProjectPages(projectId)
      setPages(res.pages || [])

      if ((!res.pages || res.pages.length === 0) && isProcessing) {
        startPolling(projectId)
      } else if (res.pages && res.pages.length > 0) {
        setIsProcessing(false)
        stopPolling()
      }
      
      setIsInitialLoading(false)
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

  const [selectedClass, setSelectedClass] = useState("Manual_Item")

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
    
    // Validate file
    if (!file) {
      alert('No file selected')
      return
    }
    
    if (!file.type || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file')
      return
    }
    
    if (file.size > 25 * 1024 * 1024) {
      alert('File too large. Maximum size is 25MB')
      return
    }
    
    console.log('Starting PDF upload:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    setActivePageIdx(0)
    setIsUploading(true)
    setUploadStatus({
      isUploading: true,
      stage: 'converting',
      progress: 0,
      error: null
    })
    
    try {
      // Step 1: Convert PDF to images CLIENT-SIDE (instant preview!)
      console.log('Converting PDF to images...')
      const convertedPages = await pdfPreviewService.convertPDFToImages(file)
      
      // Step 2: Show instant preview (local images)
      const previewPagesData = convertedPages.map((page, index) => ({
        page_id: `preview_${Date.now()}_${index}`,
        page_number: page.pageNumber,
        image_url: page.imageUrl, // Base64 data URL for instant display
        width: page.width,
        height: page.height,
        isPreview: true, // Flag to indicate this is a local preview
      }))
      
      setPreviewPages(previewPagesData)
      setPages(previewPagesData) // Show immediately!
      setIsUploading(false) // User can start working!
      setIsProcessing(true) // Background upload in progress - shows "Syncing" indicator
      
      // Stop any existing polling to prevent interference
      stopPolling()
      
      setUploadStatus({
        isUploading: false,
        stage: 'uploading',
        progress: 50,
        error: null
      })
      
      // Step 3: Upload to backend/Cloudinary in BACKGROUND
      console.log('Uploading to Cloudinary in background...')
      const result = await pdfPreviewService.uploadPagesToBackend(
        project.id,
        convertedPages
      )
      
      // Step 4: Replace preview with real Cloudinary URLs
      if (result.pages) {
        setPages(result.pages)
        setPreviewPages([])
      }
      
      setIsProcessing(false)
      setUploadStatus({
        isUploading: false,
        stage: null,
        progress: 0,
        error: null
      })
      console.log('Upload complete! Synced to cloud.')
      
      // Reset upload ref for next upload
      uploadInitiatedRef.current = false
    } catch (error) {
      console.error('PDF upload failed:', error)
      
      // Reset upload ref to allow retry
      uploadInitiatedRef.current = false
      
      setUploadStatus({
        isUploading: false,
        stage: 'error',
        progress: 0,
        error: error.message || 'Upload failed'
      })
      
      // Fallback: Try the old backend processing method
      console.log('Attempting fallback to backend PDF processing...')
      try {
        setIsProcessing(true)
        setUploadStatus({
          isUploading: true,
          stage: 'uploading',
          progress: 25,
          error: null
        })
        await uploadProjectPDF(project.id, file)
        startPolling(project.id)
        await fetchPages(project.id)
        setIsUploading(false)
        setUploadStatus({
          isUploading: false,
          stage: 'complete',
          progress: 100,
          error: null
        })
        setTimeout(() => {
          setUploadStatus({
            isUploading: false,
            stage: null,
            progress: 0,
            error: null
          })
        }, 3000)
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        setUploadStatus({
          isUploading: false,
          stage: 'error',
          progress: 0,
          error: fallbackError.message || 'Failed to process PDF'
        })
        alert(error.message || 'Failed to process PDF. Please try again.')
        setIsUploading(false)
        setIsProcessing(false)
      }
      
      setPreviewPages([])
      setPages([])
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

  async function handleBackClick() {
    // Just navigate back - no warning modal
    // Browser beforeunload will still warn on refresh/close tab
    navigate("/projects")
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full min-h-screen overflow-hidden">
      <EditorHeader
        projectName={project ? project.name : "Project"}
        onBack={handleBackClick}
        onRunDetection={handleRunDetection}
        isRunningDetection={isRunningDetection}
        syncStatus={syncStatus}
        uploadStatus={{
          ...uploadStatus,
          isUploading: isProcessing, // Show as uploading when syncing to cloud
          stage: isProcessing ? 'uploading' : uploadStatus.stage
        }}
        currentPage={sortedPages[activePageIdx]?.page_number || 1}
        totalPages={sortedPages.length}
        onPrevPage={() => setActivePageIdx(i => Math.max(0, i - 1))}
        onNextPage={() => setActivePageIdx(i => Math.min(sortedPages.length - 1, i + 1))}
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
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            hidden={layout.settings < 60}
            width={layout.settings}
          />
        </div>

        <div onMouseDown={e => startResize("settings", e)} className="w-2 bg-zinc-900 hover:bg-zinc-800 flex-shrink-0 cursor-col-resize" />

        <div className="flex-1 min-w-0 overflow-hidden relative bg-black">
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
            selectedClass={selectedClass}
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

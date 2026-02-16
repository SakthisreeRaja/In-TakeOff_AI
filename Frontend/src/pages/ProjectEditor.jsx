import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import EditorHeader from "../components/editor/EditorHeader"
import EditorSettings from "../components/editor/EditorSettings"
import EditorCanvas from "../components/editor/EditorCanvas"
import EditorBOQ from "../components/editor/EditorBOQ"
import { INITIAL_ANNOTATION_FILTERS } from "../components/editor/annotationClasses"
import useDetections from "../hooks/useDetections"
import pdfPreviewService from "../services/pdfPreviewService"
import detectionSyncService from "../services/detectionSyncService"
import { setProjectUploadStatus, clearProjectUploadStatus, getProjectUploadStatuses } from "../services/uploadStatusStore"
import {
  createProject,
  getProject,
  uploadProjectPDF,
  getProjectPages,
  runDetectionOnPage,
} from "../services/api"

const MIN_CANVAS_WIDTH = 420
const PANEL_HIDE_THRESHOLD = 60
const RESIZE_HANDLE_GUTTER = 16

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

  useEffect(() => {
    if (!project?.id) return

    const isUploadingNow =
      isProcessing ||
      uploadStatus?.isUploading ||
      uploadStatus?.stage === "converting" ||
      uploadStatus?.stage === "uploading"

    if (isUploadingNow) {
      const stage = uploadStatus?.stage || (isProcessing ? "uploading" : "converting")
      setProjectUploadStatus(project.id, { isUploading: true, stage })
    } else {
      clearProjectUploadStatus(project.id)
    }
  }, [project?.id, isProcessing, uploadStatus?.isUploading, uploadStatus?.stage])

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

  const { detections, add, update, remove, refresh, syncStatus = {}, syncNow, cancelSync } = useDetections(
    activePage?.page_id
  )

  const [selectedDetectionId, setSelectedDetectionId] = useState(null)
  const [pendingBoqJump, setPendingBoqJump] = useState(null)
  const [isFromBoqJump, setIsFromBoqJump] = useState(false)
  const selectedDetection = selectedDetectionId
    ? detections.find(d => d.id === selectedDetectionId)
    : null

  useEffect(() => {
    if (selectedDetectionId && !selectedDetection) {
      if (
        pendingBoqJump &&
        pendingBoqJump.detectionId === selectedDetectionId &&
        pendingBoqJump.pageId === activePage?.page_id
      ) {
        return
      }
      setSelectedDetectionId(null)
    }
  }, [selectedDetectionId, selectedDetection, pendingBoqJump, activePage?.page_id])

  useEffect(() => {
    if (!activePage?.page_id) return
    if (pendingBoqJump && pendingBoqJump.pageId === activePage.page_id) return
    setSelectedDetectionId(null)
  }, [activePage?.page_id, pendingBoqJump])

  useEffect(() => {
    if (!pendingBoqJump) return
    if (pendingBoqJump.pageId !== activePage?.page_id) return

    const target = detections.find(d => d.id === pendingBoqJump.detectionId)
    if (!target) return

    setIsFromBoqJump(true)
    setSelectedDetectionId(target.id)
    setPendingBoqJump(null)
  }, [pendingBoqJump, activePage?.page_id, detections])

  // Clear BOQ jump flag after canvas has had time to process (prevents sticking)
  useEffect(() => {
    if (!isFromBoqJump || !selectedDetectionId) return
    const timer = setTimeout(() => {
      setIsFromBoqJump(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [isFromBoqJump])

  const undoStackRef = useRef([])
  const UNDO_LIMIT = 50

  const pushUndo = (action) => {
    const stack = undoStackRef.current
    stack.push(action)
    if (stack.length > UNDO_LIMIT) {
      stack.shift()
    }
  }

  const buildUpdatePayload = (box, options = {}) => {
    if (!box) return null
    const payload = {
      bbox_x1: box.bbox_x1,
      bbox_y1: box.bbox_y1,
      bbox_x2: box.bbox_x2,
      bbox_y2: box.bbox_y2,
    }
    if (options.includeMeta) {
      payload.class_name = box.class_name
      payload.confidence = box.confidence
      payload.notes = box.notes
    }
    if (typeof box.is_edited === "boolean") {
      payload.is_edited = box.is_edited
    }
    return payload
  }

  const buildCreatePayload = (box) => {
    if (!box) return null
    const payload = {
      project_id: box.project_id,
      page_id: box.page_id,
      class_name: box.class_name,
      confidence: box.confidence,
      bbox_x1: box.bbox_x1,
      bbox_y1: box.bbox_y1,
      bbox_x2: box.bbox_x2,
      bbox_y2: box.bbox_y2,
      notes: box.notes,
      is_manual: box.is_manual,
    }
    if (typeof box.is_edited === "boolean") {
      payload.is_edited = box.is_edited
    }
    return payload
  }

  const restoreDeletedDetection = async (box) => {
    const updatePayload = buildUpdatePayload(box, { includeMeta: true })
    if (!updatePayload) return

    try {
      await update(box.id, updatePayload)
      return
    } catch (error) {
      const createPayload = buildCreatePayload(box)
      if (!createPayload) return
      await add(createPayload)
    }
  }

  const undoLast = async () => {
    const action = undoStackRef.current.pop()
    if (!action) return

    try {
      if (action.type === "add") {
        await remove(action.detection.id)
      } else if (action.type === "delete") {
        await restoreDeletedDetection(action.detection)
      } else if (action.type === "update") {
        const updatePayload = buildUpdatePayload(action.previous, { includeMeta: action.includeMeta })
        if (updatePayload) {
          await update(action.id, updatePayload)
        }
      }
    } catch (error) {
      console.error("Undo failed:", error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey
      if (!isUndo) return

      const target = e.target
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)

      if (isEditable) return

      e.preventDefault()
      void undoLast()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

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
      // Attempt to flush any pending detection changes when leaving
      if (syncNow) {
        void syncNow()
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
      getProject(id).then(p => {
        if (!p) {
          setIsInitialLoading(false)
          return
        }
        setProject(p)
        fetchPages(p.id)
      }).catch(() => {
        setIsInitialLoading(false)
      })
    }
  }, [id, navigate, userId])

  // Remove this useEffect - no longer using uploadFile from state

  const fetchPages = async projectId => {
    try {
      setIsInitialLoading(true)
      const res = await getProjectPages(projectId)
      setPages(res.pages || [])

      const uploadMap = getProjectUploadStatuses()
      const isUploadInProgress = Boolean(uploadMap[projectId]?.isUploading)

      if ((!res.pages || res.pages.length === 0) && (isProcessing || isUploadInProgress)) {
        if (!isProcessing && isUploadInProgress) {
          setIsProcessing(true)
        }
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

  const [filters, setFilters] = useState(INITIAL_ANNOTATION_FILTERS)

  const [selectedClass, setSelectedClass] = useState(null)

  const widths = useRef({ settings: 280, boq: 320 })
  const [layout, setLayout] = useState({ settings: 280, boq: 320 })

  useEffect(() => {
    const clampLayoutToContainer = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const maxSideTotal = Math.max(0, rect.width - MIN_CANVAS_WIDTH - RESIZE_HANDLE_GUTTER)
      const current = widths.current
      const total = current.settings + current.boq

      if (total <= maxSideTotal) return

      if (maxSideTotal <= 0) {
        widths.current = { settings: 0, boq: 0 }
        setLayout(widths.current)
        return
      }

      const ratio = maxSideTotal / total
      let settings = Math.round(current.settings * ratio)
      let boq = Math.round(current.boq * ratio)
      const overflow = settings + boq - maxSideTotal
      if (overflow > 0) {
        boq = Math.max(0, boq - overflow)
      }

      widths.current = { settings, boq }
      setLayout(widths.current)
    }

    clampLayoutToContainer()
    window.addEventListener("resize", clampLayoutToContainer)
    return () => window.removeEventListener("resize", clampLayoutToContainer)
  }, [])

  function startResize(type, e) {
    e.preventDefault()
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const rect = containerRef.current.getBoundingClientRect()
    const left = rect.left
    const width = rect.width
    const maxSideTotal = Math.max(0, width - MIN_CANVAS_WIDTH - RESIZE_HANDLE_GUTTER)

    function onMove(ev) {
      const x = ev.clientX - left
      if (type === "settings") {
        const desiredSettings = Math.max(0, Math.min(x, width - RESIZE_HANDLE_GUTTER))
        const s = Math.min(desiredSettings, maxSideTotal)
        const b = Math.min(widths.current.boq, Math.max(0, maxSideTotal - s))
        widths.current = { settings: s, boq: b }
      } else {
        const desiredBoq = Math.max(0, Math.min(width - (x + 8), width - RESIZE_HANDLE_GUTTER))
        const b = Math.min(desiredBoq, maxSideTotal)
        const s = Math.min(widths.current.settings, Math.max(0, maxSideTotal - b))
        widths.current = { settings: s, boq: b }
      }
      setLayout(widths.current)
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
    
    if (file.size > 500 * 1024 * 1024) {
      alert('File too large. Maximum size is 500MB')
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
    setProjectUploadStatus(project.id, { isUploading: true, stage: "converting" })
    
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
      setProjectUploadStatus(project.id, { isUploading: true, stage: "uploading" })
      
      // Step 3: Upload to backend/Cloudinary in BACKGROUND
      console.log('Uploading to Cloudinary in background...')
      const result = await pdfPreviewService.uploadPagesToBackend(
        project.id,
        convertedPages
      )
      
      // Step 4: Replace preview with real Cloudinary URLs
      if (result.pages) {
        await detectionSyncService.migratePreviewDetections(previewPagesData, result.pages)
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

      clearProjectUploadStatus(project.id)
      
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
        setProjectUploadStatus(project.id, { isUploading: true, stage: "uploading" })
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
        clearProjectUploadStatus(project.id)
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
        clearProjectUploadStatus(project.id)
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

  async function handleAddDetection(box) {
    if (!project?.id || !activePage?.page_id) return null
    const tempDetection = await add({
      ...box,
      project_id: project.id,
      page_id: activePage.page_id,
    })
    if (tempDetection) {
      pushUndo({ type: "add", detection: tempDetection })
    }
    return tempDetection
  }

  async function handleUpdateDetection(id, updates, meta) {
    const updatedDetection = await update(id, updates)
    if (meta?.previous) {
      pushUndo({
        type: "update",
        id,
        previous: meta.previous,
        next: meta.next,
        includeMeta: Boolean(meta.includeMeta),
      })
    }
    return updatedDetection
  }

  function handleSelectDetection(det) {
    setIsFromBoqJump(false)
    setSelectedDetectionId(det?.id || null)
  }

  function handleJumpToDetection(det) {
    if (!det?.id || !det?.page_id) return

    setActiveTool("select")

    const targetPageIndex = sortedPages.findIndex(page => page.page_id === det.page_id)
    if (targetPageIndex === -1) return

    if (activePage?.page_id === det.page_id) {
      setIsFromBoqJump(true)
      if (selectedDetectionId === det.id) {
        setSelectedDetectionId(null)
        window.requestAnimationFrame(() => {
          setSelectedDetectionId(det.id)
        })
      } else {
        setSelectedDetectionId(det.id)
      }
      setPendingBoqJump(null)
      return
    }

    setPendingBoqJump({ detectionId: det.id, pageId: det.page_id })
    setActivePageIdx(targetPageIndex)
  }

  async function handleChangeDetectionClass(newClass) {
    if (!selectedDetection) return
    if (!newClass) {
      return
    }

    const shouldUpdate =
      newClass !== selectedDetection.class_name ||
      (!selectedDetection.is_manual && !selectedDetection.is_edited)

    if (!shouldUpdate) return

    const updates = {
      class_name: newClass,
    }
    if (!selectedDetection.is_manual) {
      updates.is_edited = true
    }

    const next = {
      ...selectedDetection,
      class_name: newClass,
      is_edited: selectedDetection.is_manual ? selectedDetection.is_edited : true,
    }

    await handleUpdateDetection(selectedDetection.id, updates, {
      previous: selectedDetection,
      next,
      includeMeta: true,
      reason: "class",
    })
  }

  function handleClearSelection() {
    setSelectedDetectionId(null)
  }

  async function handleDeleteDetection(id) {
    const existing = detections.find(d => d.id === id)
    await remove(id)
    if (existing) {
      pushUndo({ type: "delete", detection: existing })
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
            hidden={layout.settings < PANEL_HIDE_THRESHOLD}
            width={layout.settings}
            selectedDetection={selectedDetection}
            onChangeDetectionClass={handleChangeDetectionClass}
            onClearSelection={handleClearSelection}
          />
        </div>

        <div onMouseDown={e => startResize("settings", e)} className="w-2 bg-zinc-900 hover:bg-zinc-800 flex-shrink-0 cursor-col-resize" />

        <div className="flex-1 min-w-0 overflow-hidden relative bg-black">
          <EditorCanvas
            activeTool={activeTool}
            pages={sortedPages}
            activePageId={activePage?.page_id}
            detections={detections}
            filters={filters}
            onAddDetection={handleAddDetection}
            onUpdateDetection={handleUpdateDetection}
            onDeleteDetection={handleDeleteDetection}
            onSelectDetection={handleSelectDetection}
            selectedDetectionId={selectedDetectionId}
            onUpload={() => fileInputRef.current.click()}
            isProcessing={isProcessing}
            isUploading={isUploading}
            isInitialLoading={isInitialLoading}
            selectedClass={selectedClass}
            fromBoqJump={isFromBoqJump}
          />
        </div>

        <div onMouseDown={e => startResize("boq", e)} className="w-2 bg-zinc-900 hover:bg-zinc-800 flex-shrink-0 cursor-col-resize" />

        <div style={{ width: layout.boq }} className="border-l border-zinc-800 flex-shrink-0 overflow-hidden">
          <EditorBOQ
            hidden={layout.boq < PANEL_HIDE_THRESHOLD}
            detections={detections}
            pageNumber={activePage?.page_number}
            pages={sortedPages}
            onJumpToDetection={handleJumpToDetection}
          />
        </div>
      </div>
    </div>
  )
}

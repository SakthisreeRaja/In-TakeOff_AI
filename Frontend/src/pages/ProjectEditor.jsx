import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import EditorHeader from "../components/editor/EditorHeader"
import EditorSettings from "../components/editor/EditorSettings"
import EditorCanvas from "../components/editor/EditorCanvas"
import EditorBOQ from "../components/editor/EditorBOQ"
import {
  createProject,
  getProjects,
  uploadProjectPDF,
  getProjectPages,
} from "../services/api"

export default function ProjectEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  const [project, setProject] = useState(null)
  const [pages, setPages] = useState([])
  const [activeTool, setActiveTool] = useState("select")
  const createdRef = useRef(false)

  const userId = localStorage.getItem("user_id")

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
        getProjectPages(p.id).then(res => {
          setPages(res.pages || [])
        })
      })
    }
  }, [id, navigate, userId])

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

    await uploadProjectPDF(project.id, file)

    const res = await getProjectPages(project.id)
    setPages(res.pages || [])
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
          <EditorCanvas
            activeTool={activeTool}
            onUpload={() => fileInputRef.current.click()}
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

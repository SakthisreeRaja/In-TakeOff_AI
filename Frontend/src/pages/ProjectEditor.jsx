import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import EditorHeader from "../components/editor/EditorHeader"
import EditorSettings from "../components/editor/EditorSettings"
import EditorCanvas from "../components/editor/EditorCanvas"
import EditorBOQ from "../components/editor/EditorBOQ"

export default function ProjectEditor({ projects, setProjects }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const containerRef = useRef(null)

  const [project, setProject] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const [activeTool, setActiveTool] = useState("select") 
  const createdRef = useRef(false)

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

  useEffect(() => {
    if (id === "new" && !createdRef.current) {
      createdRef.current = true
      const newId = Date.now()
      const newProject = {
        id: newId,
        name: "New Project",
        createdAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        count: 0,
        status: "draft",
      }
      setProjects(prev => [newProject, ...prev])
      setProject(newProject)
      navigate(`/projects/${newId}`, { replace: true })
      return
    }

    const pid = Number(id)
    const found = projects.find(p => p.id === pid) || null
    setProject(found)
  }, [id, projects, navigate, setProjects])

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
        let newSettings = Math.max(0, mouseX)
        newSettings = Math.min(newSettings, containerWidth - handleWidth)

        const availableForBoq = containerWidth - handleWidth - newSettings
        const newBoq = Math.min(widths.current.boq, availableForBoq)

        widths.current = { settings: newSettings, boq: newBoq }
      } else {
        let newBoq = Math.max(0, containerWidth - (mouseX + 8))
        newBoq = Math.min(newBoq, containerWidth - handleWidth)

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

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full min-h-screen overflow-hidden"
    >
      <EditorHeader
        projectName={project ? project.name : "Project"}
        onBack={() => navigate("/projects")}
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
          />
        </div>

        <div
          onMouseDown={e => startResize("settings", e)}
          className="w-2 bg-zinc-900 hover:bg-zinc-800 relative flex-shrink-0 z-50 transition-colors flex items-center justify-center"
        >
          <div className="grid grid-cols-2 gap-0.5 opacity-100">
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
          </div>
        </div>

        <div className="flex-1 min-w-0 overflow-hidden relative bg-black">
           <EditorCanvas 
             filters={filters} 
             pdfFile={pdfFile}
             onUpload={(file) => setPdfFile(file)}
             isDragging={isDragging}
             activeTool={activeTool}
           />
        </div>

        <div
          onMouseDown={e => startResize("boq", e)}
          className="w-2 bg-zinc-900 hover:bg-zinc-800 relative flex-shrink-0 z-50 transition-colors flex items-center justify-center"
        >
           <div className="grid grid-cols-2 gap-0.5 opacity-100">
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
             <div className="w-0.5 h-0.5 bg-zinc-500 rounded-full"></div>
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
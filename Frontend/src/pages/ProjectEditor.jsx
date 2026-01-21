import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import EditorHeader from "../components/editor/EditorHeader"
import EditorSettings from "../components/editor/EditorSettings"
import EditorCanvas from "../components/editor/EditorCanvas"
import EditorBOQ from "../components/editor/EditorBOQ"

export default function ProjectEditor({ projects, setProjects }) {
  const navigate = useNavigate()
  const { id } = useParams()

  const [project, setProject] = useState(null)
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

  const [settingsWidth, setSettingsWidth] = useState(280)
  const [boqWidth, setBoqWidth] = useState(320)
  const [isDragging, setIsDragging] = useState(false)

  const containerRef = useRef(null)

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

    const startX = e.clientX
    const startSettings = settingsWidth
    const containerRight =
      containerRef.current.getBoundingClientRect().right

    function onMove(ev) {
      if (type === "settings") {
        const delta = ev.clientX - startX
        setSettingsWidth(Math.max(0, startSettings + delta))
      } else {
        const newWidth = containerRight - ev.clientX
        setBoqWidth(Math.max(0, newWidth))
      }
    }

    function onUp() {
      setIsDragging(false)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full min-h-screen"
    >
      <EditorHeader
        projectName={project ? project.name : "Project"}
        onBack={() => navigate("/projects")}
      />

      <div className="flex flex-1 min-h-0 min-w-0">
        {/* SETTINGS */}
        <div
          style={{ width: settingsWidth }}
          className="border-r border-zinc-800 flex-shrink-0 overflow-hidden"
        >
          <EditorSettings
            filters={filters}
            setFilters={setFilters}
            hidden={settingsWidth < 60}
          />
        </div>

        {/* LEFT HANDLE */}
        <div
          onMouseDown={e => startResize("settings", e)}
          className="w-2 bg-zinc-900 hover:bg-zinc-800 relative flex-shrink-0"
        >
          {!isDragging && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <div className="grid grid-cols-2 gap-0.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-1 h-1 bg-zinc-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <EditorCanvas filters={filters} />

        {/* RIGHT HANDLE */}
        <div
          onMouseDown={e => startResize("boq", e)}
          className="w-2 bg-zinc-900 hover:bg-zinc-800 relative flex-shrink-0"
        >
          {!isDragging && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <div className="grid grid-cols-2 gap-0.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-1 h-1 bg-zinc-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOQ — ALWAYS PRESENT */}
        <div
          style={{ width: boqWidth }}
          className="border-l border-zinc-800 flex-shrink-0 overflow-hidden"
        >
          <EditorBOQ hidden={boqWidth < 60} />
        </div>
      </div>
    </div>
  )
}

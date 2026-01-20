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

  return (
    <div className="flex flex-col h-full min-h-screen">
      <EditorHeader
        projectName={project ? project.name : "Project"}
        onBack={() => navigate("/projects")}
      />

      <div className="flex flex-1 min-h-0">
        <EditorSettings
          filters={filters}
          setFilters={setFilters}
        />

        <EditorCanvas
          filters={filters}
        />

        <EditorBOQ
          filters={filters}
        />
      </div>
    </div>
  )
}

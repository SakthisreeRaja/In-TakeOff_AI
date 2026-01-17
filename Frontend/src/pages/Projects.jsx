import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { mockProjects } from "../data/mockProjects"
import ProjectsHeader from "../components/projects/ProjectsHeader"
import ProjectsGrid from "../components/projects/ProjectsGrid"

export default function Projects() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [projects, setProjects] = useState(() => {
    try {
      const s = localStorage.getItem("projects")
      return s ? JSON.parse(s) : mockProjects
    } catch {
      return mockProjects
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("projects", JSON.stringify(projects))
    } catch {}
  }, [projects])

  function handleOpen(project) {
    navigate(`/projects/${project.id}`)
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (status === "all" || p.status === status)
  )

  return (
    <div>
      <ProjectsHeader search={search} setSearch={setSearch} status={status} setStatus={setStatus} />
      <ProjectsGrid projects={filtered} onOpen={handleOpen} />
    </div>
  )
}

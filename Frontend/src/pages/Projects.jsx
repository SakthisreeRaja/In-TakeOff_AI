import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ProjectsHeader from "../components/projects/ProjectsHeader"
import ProjectsGrid from "../components/projects/ProjectsGrid"

export default function Projects({ projects }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  const filtered = projects.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || p.status === status)
  )

  function handleOpen(project) {
    navigate(`/projects/${project.id}`)
  }

  return (
    <div>
      <ProjectsHeader
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
      />
      <ProjectsGrid projects={filtered} onOpen={handleOpen} />
    </div>
  )
}

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import ProjectsHeader from "../components/projects/ProjectsHeader"
import ProjectsGrid from "../components/projects/ProjectsGrid"
import { getProjects } from "../services/api"

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  useEffect(() => {
    getProjects().then(setProjects)
  }, [])

  const filtered = projects.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || p.status === status)
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full">
      <ProjectsHeader
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        onNew={() => navigate("/projects/new")}
      />

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide w-full">
        <ProjectsGrid
          projects={filtered}
          onOpen={p => navigate(`/projects/${p.id}`)}
        />
      </div>
    </div>
  )
}

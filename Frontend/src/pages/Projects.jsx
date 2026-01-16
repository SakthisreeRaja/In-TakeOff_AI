import { useState } from "react"
import { mockProjects } from "../data/mockProjects"
import ProjectsHeader from "../components/projects/ProjectsHeader"
import ProjectsGrid from "../components/projects/ProjectsGrid"

export default function Projects() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [projects, setProjects] = useState(mockProjects)
  const [toast, setToast] = useState("")

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (status === "all" || p.status === status)
  )

  function handleNew() {
    const id = Math.max(...projects.map(p => p.id)) + 1
    const newP = { id, name: `New Project ${id}`, createdAt: "Jan 16, 2026", count: 0, status: "draft" }
    setProjects([newP, ...projects])
    setToast("Project created")
    setTimeout(() => setToast(""), 2500)
  }

  function handleOpen(project) {
    setToast(`Opened ${project.name}`)
    setTimeout(() => setToast(""), 2000)
  }

  return (
    <div>
      <ProjectsHeader search={search} setSearch={setSearch} status={status} setStatus={setStatus} onNew={handleNew} />
      <ProjectsGrid projects={filtered} onOpen={handleOpen} />
      {toast && (
        <div className="fixed right-6 bottom-6 bg-zinc-800 text-white px-4 py-2 rounded-lg shadow">
          {toast}
        </div>
      )}
    </div>
  )
}

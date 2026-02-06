import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiFolder } from "react-icons/fi"
import ProjectsHeader from "../components/projects/ProjectsHeader"
import ProjectsGrid from "../components/projects/ProjectsGrid"
import { getProjects, deleteProject } from "../services/api"
import { formatDate } from "../utils/helpers"
import detectionSyncService from "../services/detectionSyncService"
import { getProjectUploadStatuses, subscribeUploadStatus } from "../services/uploadStatusStore"

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [projectSyncMap, setProjectSyncMap] = useState({})
  const [uploadStatusMap, setUploadStatusMap] = useState(getProjectUploadStatuses())

  useEffect(() => {
    getProjects()
      .then(data => {
        const formatted = data.map(p => ({
          ...p,
          createdAt: formatDate(p.created_at)
        }))
        setProjects(formatted)
      })
      .catch(err => console.error("Error loading projects:", err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let active = true

    const updateSyncMap = async () => {
      const ids = projects.map(p => p.id)
      if (ids.length === 0) {
        setProjectSyncMap({})
        return
      }
      const counts = await detectionSyncService.getPendingCountsByProject(ids)
      if (active) {
        setProjectSyncMap(counts)
      }
    }

    updateSyncMap()
    const unsubscribe = detectionSyncService.subscribe(() => {
      updateSyncMap()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [projects])

  useEffect(() => {
    setUploadStatusMap(getProjectUploadStatuses())
    const unsubscribe = subscribeUploadStatus(setUploadStatusMap)
    return () => unsubscribe()
  }, [])

  const filtered = projects.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || p.status === status)
  )

  const filteredWithSync = filtered.map(p => ({
    ...p,
    syncPendingCount: projectSyncMap[p.id] || 0,
    isUploading: Boolean(uploadStatusMap[p.id]?.isUploading)
  }))

  const handleDelete = async (project) => {
    const confirmed = window.confirm(
      `Delete "${project.name}"? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      await deleteProject(project.id)
      setProjects(prev => prev.filter(p => p.id !== project.id))
    } catch (err) {
      console.error("Error deleting project:", err)
      alert("Failed to delete project. Please try again.")
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full">
      <ProjectsHeader
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        onNew={() => navigate("/projects/new")}
      />

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-zinc-400">Loading projects </div>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center py-12">
            <FiFolder className="mx-auto text-6xl text-zinc-700 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-zinc-400 mb-6">Create your first project to get started</p>
            <button
              onClick={() => navigate("/projects/new")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Create Project
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center py-12">
            <p className="text-zinc-400">No projects match your search</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide w-full">
          <ProjectsGrid
            projects={filteredWithSync}
            onOpen={p => navigate(`/projects/${p.id}`)}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  )
}

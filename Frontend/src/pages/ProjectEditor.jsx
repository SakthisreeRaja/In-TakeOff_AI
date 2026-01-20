import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  FiArrowLeft,
  FiPlay,
  FiSave,
  FiDownload,
} from "react-icons/fi"

export default function ProjectEditor({ projects, setProjects }) {
  const navigate = useNavigate()
  const { id } = useParams()

  const [project, setProject] = useState(null)
  const createdRef = useRef(false)

  useEffect(() => {
    if (id === "new" && !createdRef.current) {
      createdRef.current = true
      const newId = Date.now()
      const newProject = {
        id: newId,
        name: `New Project`,
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

  function goBack() {
    navigate("/projects")
  }

  return (
    <div className="flex flex-col h-full min-h-screen">
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="w-8 h-8 flex items-center justify-center rounded-md
    text-zinc-400 hover:text-white
    hover:bg-zinc-800 transition-colors"
          >
            <FiArrowLeft size={18} />
          </button>

          <h2 className="font-semibold">
            {project ? project.name : "Project"}
          </h2>
          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
            Saved
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg">
            <FiPlay />
            Run Detection
          </button>

          <button className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg">
            <FiSave />
            Save
          </button>

          <button className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg">
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-72 border-r border-zinc-800 px-6 py-4 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-4">Settings</h3>

          <p className="text-xs text-zinc-400 mb-2">
            Confidence Threshold: 15%
          </p>
          <input type="range" className="w-full mb-6" />

          <h4 className="text-sm font-semibold mb-2">
            Class Filters
          </h4>

          <div className="space-y-2 text-sm text-zinc-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> AHU
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> VAV
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Diffuser
            </label>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center text-zinc-400">
            <div className="text-4xl mb-4">⬆️</div>
            <p className="mb-2">No PDF Uploaded</p>
            <p className="text-xs mb-4">
              Upload a PDF drawing to start detecting HVAC components
            </p>
            <button className="bg-blue-600 px-4 py-2 rounded-lg text-sm">
              Upload PDF
            </button>
          </div>
        </div>

        <div className="w-80 border-l border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Bill of Quantities</h3>
            <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">
              0 items
            </span>
          </div>

          <div className="text-center text-zinc-400 mt-20">
            <p>No detections yet.</p>
            <p className="text-xs mt-1">
              Run detection to generate BOQ
            </p>
          </div>

          <button className="w-full mt-6 bg-blue-600 py-2 rounded-lg text-sm">
            Export BOQ
          </button>
        </div>
      </div>
    </div>
  )
}

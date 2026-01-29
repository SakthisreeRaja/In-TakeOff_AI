import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createProject } from "../services/api"

export default function NewProject() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!projectName.trim()) {
      setError("Project name is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const userId = localStorage.getItem("user_id")
      
      // Create project
      const project = await createProject({
        name: projectName,
        description: description || "",
        user_id: userId,
        status: "draft"
      })

      // Navigate to editor immediately
      navigate(`/projects/${project.id}`)

    } catch (err) {
      console.error("Error creating project:", err)
      setError(err.message || "Failed to create project")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-white text-2xl font-semibold mb-2">Create New Project</h2>
        <p className="text-zinc-400">Create a project and upload your PDF in the editor</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Project Name 
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-600"
              placeholder="HVAC Floor Plan - Building A"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-600 resize-none"
              rows={4}
              placeholder="Add project details, notes, or requirements..."
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="px-6 py-2 text-zinc-400 hover:text-white transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

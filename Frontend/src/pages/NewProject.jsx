import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiUpload, FiFileText, FiX } from "react-icons/fi"
import { createProject, uploadProjectPDF } from "../services/api"

export default function NewProject() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile)
        setError("")
      } else {
        setError("Please upload a PDF file")
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile)
        setError("")
      } else {
        setError("Please upload a PDF file")
      }
    }
  }

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
      // Pass the file in state so the editor can upload it in background
      navigate(`/projects/${project.id}`, { 
        state: { uploadFile: file } 
      })

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
        <p className="text-zinc-400">Upload your PDF and start detecting elements</p>
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

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Upload PDF
            </label>
            
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
                  dragActive
                    ? "border-blue-600 bg-blue-600/10"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <FiUpload className="mx-auto text-4xl text-zinc-600 mb-4" />
                <p className="text-white mb-2">
                  Drag and drop your PDF here
                </p>
                <p className="text-sm text-zinc-400 mb-4">or</p>
                <label className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg cursor-pointer transition">
                  Browse Files
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-zinc-500 mt-4">
                  Supported format: PDF (Max 50MB)
                </p>
              </div>
            ) : (
              <div className="bg-black border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiFileText className="text-2xl text-blue-400" />
                  <div>
                    <div className="text-white font-medium">{file.name}</div>
                    <div className="text-sm text-zinc-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-zinc-400 hover:text-red-400 transition"
                >
                  <FiX size={20} />
                </button>
              </div>
            )}
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

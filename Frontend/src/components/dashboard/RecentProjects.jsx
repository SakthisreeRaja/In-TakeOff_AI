function RecentProjects() {
  const projects = [
    {
      name: "New Project #6",
      date: "Jan 6, 2026",
      status: "Draft",
    },
    {
      name: "New Project #5",
      date: "Jan 5, 2026",
      status: "Completed",
    },
    {
      name: "Iksnrg",
      date: "Dec 31, 2025",
      status: "Completed",
    },
    {
      name: "New Project #3",
      date: "Dec 30, 2025",
      status: "Completed",
    },
  ]

  return (
    <div className="bg-zinc-900 rounded-xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Recent Projects
        </h2>

        <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
          View all →
        </button>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {projects.map((project) => (
          <div
            key={project.name}
            className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3"
          >
            <div>
              <p className="font-medium">
                {project.name}
              </p>
              <p className="text-xs text-gray-400">
                {project.date}
              </p>
            </div>

            <span
              className={`text-xs px-3 py-1 rounded-full ${
                project.status === "Completed"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {project.status.toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentProjects

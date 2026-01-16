import {
  FiFolder,
  FiTarget,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi"

export default function StatCards({ projects }) {
  const totalProjects = projects.length
  const completed = projects.filter(p => p.status === "complete").length
  const drafts = projects.filter(p => p.status === "draft").length

  const stats = [
    {
      title: "Total Projects",
      value: totalProjects,
      icon: <FiFolder />,
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      title: "Completed Projects",
      value: completed,
      icon: <FiTarget />,
      color: "bg-green-500/20 text-green-400",
    },
    {
      title: "Pending Review",
      value: drafts,
      icon: <FiClock />,
      color: "bg-yellow-500/20 text-yellow-400",
    },
    {
      title: "AI Confidence",
      value: "94%",
      icon: <FiTrendingUp />,
      color: "bg-pink-500/20 text-pink-400",
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-6 mt-6">
      {stats.map(stat => (
        <div
          key={stat.title}
          className="bg-zinc-900 rounded-xl p-6 flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-gray-400">
              {stat.title}
            </p>
            <h2 className="text-3xl font-semibold mt-2">
              {stat.value}
            </h2>
          </div>

          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}
          >
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  )
}

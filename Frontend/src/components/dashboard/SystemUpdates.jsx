import { FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi"

function SystemUpdates() {
  const updates = [
    {
      icon: <FiCheckCircle className="text-green-400" />,
      title: "v1.2 Released",
      description: "Improved detection model accuracy by 15%",
      time: "2 hours ago"
    },
    {
      icon: <FiAlertCircle className="text-yellow-400" />,
      title: "Scheduled Maintenance",
      description: "System will be down Sunday 2-4 AM UTC",
      time: "Tomorrow"
    },
    {
      icon: <FiClock className="text-blue-400" />,
      title: "New Feature",
      description: "Bulk export to Excel coming next week",
      time: "Upcoming"
    }
  ]

  return (
    <div className="bg-zinc-900 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">
        System Updates
      </h2>

      <div className="space-y-4">
        {updates.map((update, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="mt-0.5">{update.icon}</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{update.title}</div>
              <div className="text-xs text-zinc-400 mt-1">{update.description}</div>
              <div className="text-xs text-zinc-500 mt-1">{update.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SystemUpdates

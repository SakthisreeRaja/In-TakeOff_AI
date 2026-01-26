import { useEffect, useState } from "react"
import StatCards from "../components/dashboard/StatCards"
import RecentProjects from "../components/dashboard/RecentProjects"
import StorageUsage from "../components/dashboard/StorageUsage"
import SystemUpdates from "../components/dashboard/SystemUpdates"
import { getProjects } from "../services/api"
import { formatDate } from "../utils/helpers"

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjects()
      .then(list => {
        const normalized = list.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          createdAt: formatDate(p.created_at),
          count: p.page_count ?? 0,
        }))
        setProjects(normalized)
      })
      .catch(err => console.error("Error loading projects:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-white text-2xl font-semibold mb-2">
        Welcome back
      </h2>
      <p className="text-zinc-400 mb-6">
        Here’s what’s happening with your projects today
      </p>

      <StatCards projects={projects} />

      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="col-span-2">
          <RecentProjects projects={projects} />
        </div>

        <div className="flex flex-col gap-6">
          <StorageUsage />
          <SystemUpdates />
        </div>
      </div>
    </div>
  )
}

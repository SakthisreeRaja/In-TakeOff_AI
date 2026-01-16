import { mockProjects } from "../data/mockProjects"
import StatCards from "../components/dashboard/StatCards"
import RecentProjects from "../components/dashboard/RecentProjects"
import StorageUsage from "../components/dashboard/StorageUsage"
import SystemUpdates from "../components/dashboard/SystemUpdates"

export default function Dashboard() {
  return (
    <div>
      <h2 className="text-white text-2xl font-semibold mb-2">
        Welcome back
      </h2>
      <p className="text-zinc-400 mb-6">
        Here’s what’s happening with your projects today
      </p>

      <StatCards projects={mockProjects} />

      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="col-span-2">
          <RecentProjects projects={mockProjects} />
        </div>

        <div className="flex flex-col gap-6">
          <StorageUsage />
          <SystemUpdates />
        </div>
      </div>
    </div>
  )
}

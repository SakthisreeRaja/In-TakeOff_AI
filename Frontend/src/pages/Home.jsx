import Layout from "../components/layout/Layout"
import StatCards from "../components/dashboard/StatCards"
import RecentProjects from "../components/dashboard/RecentProjects"
import StorageUsage from "../components/dashboard/StorageUsage"
import SystemUpdates from "../components/dashboard/SystemUpdates"

function Home() {
  return (
    <Layout>
      <div className="mt-6 px-6 pb-6 flex-1 flex flex-col min-h-0">
        <h1 className="text-2xl font-semibold">
          Welcome back, User
        </h1>

        <p className="text-sm text-gray-400 mt-1">
          Here's what's happening with your projects today.
        </p>

        <StatCards />

        <div className="grid grid-cols-12 gap-6 mt-8 flex-1 min-h-0">
          <div className="col-span-8 h-full">
            <RecentProjects />
          </div>

          <div className="col-span-4 flex flex-col gap-6 h-full">
            <StorageUsage />
            <SystemUpdates />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Home

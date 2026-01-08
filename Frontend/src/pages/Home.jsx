import Sidebar from "../components/Home/Sidebar"
import Topbar from "../components/Home/Topbar"
import StatCards from "../components/Home/StatCards"
import RecentWorks from "../components/Home/RecentWorks"
import Announcements from "../components/Home/Announcements"

function Home() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 bg-black text-white flex flex-col">
        <Topbar />

        <div className="mt-6 px-6 pb-6 flex-1 flex flex-col min-h-0">
          <h1 className="text-2xl font-semibold">
            Welcome back, User
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Here's what's happening with your projects today.
          </p>

          <StatCards />

          <div className="grid grid-cols-3 gap-6 mt-8 w-full flex-1 min-h-0">
            <RecentWorks />

            <div className="flex flex-col gap-6 flex-1 min-h-0">
              <Announcements />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

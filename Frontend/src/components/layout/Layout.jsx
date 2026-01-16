import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        <Topbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

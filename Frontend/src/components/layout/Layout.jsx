import { useState } from "react"
import { useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function Layout({ children }) {
  const location = useLocation()

  const isEditor =
    location.pathname.startsWith("/projects/") &&
    location.pathname !== "/projects"

  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="h-screen overflow-hidden bg-black flex">
      {!isEditor && (
        <div className={`transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"} flex-none`}>
          <Sidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(v => !v)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />

        <main
          className={`flex flex-1 min-h-0 overflow-hidden ${isEditor ? "" : "px-6 py-6"}`}
        >
          <div className="w-full flex-1 flex flex-col min-h-0 min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

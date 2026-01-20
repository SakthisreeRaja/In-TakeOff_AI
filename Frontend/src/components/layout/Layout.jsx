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

  const marginLeft = isEditor
    ? "ml-0"
    : sidebarOpen
    ? "ml-64"
    : "ml-16"

  return (
    <div className="min-h-screen bg-black">
      {!isEditor && (
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(v => !v)}
        />
      )}

      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${marginLeft}`}
      >
        <Topbar />
        <main
          className={`flex-1 min-h-0 py-6 ${
            isEditor ? "" : "px-6"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

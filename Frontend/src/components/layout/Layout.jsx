import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

function Layout({ children }) {
  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />
        {children}
      </div>
    </div>
  )
}

export default Layout
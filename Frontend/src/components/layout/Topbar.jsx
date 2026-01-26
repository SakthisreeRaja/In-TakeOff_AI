import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FiBell, FiUser, FiSettings, FiLogOut, FiChevronDown } from "react-icons/fi"
import { getUser } from "../../services/api"
import { getInitials } from "../../utils/helpers"

export default function Topbar() {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userId = localStorage.getItem("user_id")
    if (userId) {
      getUser(userId)
        .then(setUser)
        .catch(err => console.error("Error loading user:", err))
    }
  }, [])

  const notifications = [
    { id: 1, text: "Project 'Building A' completed", time: "5m ago", unread: true },
    { id: 2, text: "New AI model update available", time: "1h ago", unread: true },
    { id: 3, text: "Storage usage at 68%", time: "3h ago", unread: false }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  const handleLogout = () => {
    localStorage.removeItem("user_id")
    navigate("/signin", { replace: true })
  }

  return (
    <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">
        InTakeOff.AI
      </h1>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-zinc-400 hover:text-white transition"
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-zinc-900 rounded-lg shadow-lg border border-zinc-800 overflow-hidden z-50">
              <div className="p-4 border-b border-zinc-800">
                <h3 className="font-semibold text-white">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer ${
                      notif.unread ? "bg-blue-500/5" : ""
                    }`}
                  >
                    <p className="text-sm text-white mb-1">{notif.text}</p>
                    <p className="text-xs text-zinc-500">{notif.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center border-t border-zinc-800">
                <button className="text-sm text-blue-400 hover:text-blue-300">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user ? getInitials(`${user.first_name} ${user.last_name}`) : "U"}
            </div>
            <FiChevronDown size={16} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-12 w-56 bg-zinc-900 rounded-lg shadow-lg border border-zinc-800 overflow-hidden z-50">
              <div className="p-4 border-b border-zinc-800">
                <div className="text-white font-medium">
                  {user ? `${user.first_name} ${user.last_name}` : "User"}
                </div>
                <div className="text-sm text-zinc-400">
                  {user?.email || "user@company.com"}
                </div>
              </div>
              
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    navigate("/settings")
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <FiSettings size={18} />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                >
                  <FiLogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

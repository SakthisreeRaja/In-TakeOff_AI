import { useState, useEffect } from "react"
import { FiUser, FiBell, FiLock, FiDatabase, FiSave } from "react-icons/fi"
import { getUser, updateUser } from "../services/api"

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile")
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: ""
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    projectUpdates: true,
    weeklyReports: false,
    aiSuggestions: true
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const userId = localStorage.getItem("user_id")
    if (userId) {
      getUser(userId)
        .then(user => {
          setUserData({
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            email: user.email || "",
            company: user.company || "",
            phone: user.phone || ""
          })
        })
        .catch(err => {
          console.error("Error loading user:", err)
          setError("Failed to load user data")
        })
        .finally(() => setLoading(false))
    }
  }, [])

  const tabs = [
    { id: "profile", label: "Profile", icon: <FiUser size={18} /> },
    { id: "notifications", label: "Notifications", icon: <FiBell size={18} /> },
    { id: "security", label: "Security", icon: <FiLock size={18} /> },
    { id: "storage", label: "Storage", icon: <FiDatabase size={18} /> }
  ]

  const handleSave = async () => {
    const userId = localStorage.getItem("user_id")
    if (!userId) return

    setSaving(true)
    setError("")

    try {
      await updateUser(userId, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        company: userData.company || "",
        phone: userData.phone || ""
      })
      
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error("Error saving:", err)
      setError("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl">
      <h2 className="text-white text-2xl font-semibold mb-2">Settings</h2>
      <p className="text-zinc-400 mb-6">Manage your account settings and preferences</p>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-zinc-900 rounded-xl p-4 h-fit">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === tab.id
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-zinc-900 rounded-xl p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-zinc-400">Loading settings...</div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              {activeTab === "profile" && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">First Name</label>
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Company</label>
                  <input
                    type="text"
                    value={userData.company}
                    onChange={(e) => setUserData({ ...userData, company: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-zinc-800">
                    <div>
                      <div className="text-white font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="text-sm text-zinc-400">
                        {key === "emailNotifications" && "Receive email notifications for important updates"}
                        {key === "projectUpdates" && "Get notified when projects are updated"}
                        {key === "weeklyReports" && "Receive weekly summary reports"}
                        {key === "aiSuggestions" && "Get AI-powered suggestions and insights"}
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [key]: !value })}
                      className={`relative w-12 h-6 rounded-full transition ${
                        value ? "bg-blue-600" : "bg-zinc-700"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          value ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Security Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-600"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Two-Factor Authentication</span>
                    <span className="text-sm text-zinc-400">Not enabled</span>
                  </div>
                  <button className="text-sm text-blue-400 hover:text-blue-300">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "storage" && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Storage Management</h3>
              <div className="space-y-6">
                <div className="bg-black rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-zinc-400">Storage Used</span>
                    <span className="text-white font-medium">6.8 GB / 10 GB</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: "68%" }} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                    <div>
                      <div className="text-white">Projects</div>
                      <div className="text-sm text-zinc-400">4.2 GB</div>
                    </div>
                    <button className="text-sm text-red-400 hover:text-red-300">Clean up</button>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                    <div>
                      <div className="text-white">Uploads</div>
                      <div className="text-sm text-zinc-400">2.6 GB</div>
                    </div>
                    <button className="text-sm text-red-400 hover:text-red-300">Clean up</button>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div>
                      <div className="text-white">Cache</div>
                      <div className="text-sm text-zinc-400">124 MB</div>
                    </div>
                    <button className="text-sm text-red-400 hover:text-red-300">Clear cache</button>
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition">
                  Upgrade Storage Plan
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-800">
            <button className="px-6 py-2 text-zinc-400 hover:text-white transition">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave />
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}

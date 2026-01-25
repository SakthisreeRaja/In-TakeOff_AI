import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import Layout from "./components/layout/Layout"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import ProjectEditor from "./pages/ProjectEditor"
import SignIn from "./pages/SignIn"
import { getUser } from "./services/api" // Import the new check function

function RequireAuth({ children }) {
  const [isVerified, setIsVerified] = useState(null) // null = loading
  const userId = localStorage.getItem("user_id")

  useEffect(() => {
    // 1. If no ID in storage, kick them out immediately
    if (!userId) {
      setIsVerified(false)
      return
    }

    // 2. 🔥 INSTANT CHECK: Does this user exist in the DB?
    getUser(userId)
      .then(() => {
        setIsVerified(true) // User exists, let them in
      })
      .catch(() => {
        // 3. User deleted in DB? Clear storage and kick them out
        console.warn("User ID invalid. Logging out...")
        localStorage.removeItem("user_id")
        setIsVerified(false)
      })
  }, [userId])

  // Show a blank screen or spinner while checking (usually takes <100ms)
  if (isVerified === null) {
    return <div className="h-screen bg-black text-zinc-500 flex items-center justify-center">Verifying session...</div>
  }

  // Redirect if invalid
  if (isVerified === false) {
    return <Navigate to="/signin" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />

      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectEditor />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  )
}
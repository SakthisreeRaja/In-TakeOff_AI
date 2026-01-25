import { Routes, Route, Navigate } from "react-router-dom"
import Layout from "./components/layout/Layout"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import ProjectEditor from "./pages/ProjectEditor"
import SignIn from "./pages/SignIn"

function RequireAuth({ children }) {
  const userId = localStorage.getItem("user_id")
  if (!userId) {
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

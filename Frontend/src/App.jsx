import { Routes, Route } from "react-router-dom"
import { useState } from "react"
import Layout from "./components/layout/Layout"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import ProjectEditor from "./pages/ProjectEditor"
import { mockProjects } from "./data/mockProjects"

export default function App() {
  const [projects, setProjects] = useState(mockProjects)

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard projects={projects} />} />
        <Route
          path="/projects"
          element={<Projects projects={projects} />}
        />
        <Route
          path="/projects/:id"
          element={
            <ProjectEditor
              projects={projects}
              setProjects={setProjects}
            />
          }
        />
      </Routes>
    </Layout>
  )
}

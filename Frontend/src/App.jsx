import { Routes, Route } from "react-router-dom"
import Layout from "./components/layout/Layout"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import ProjectEditor from "./pages/ProjectEditor"

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectEditor />} />
      </Routes>
    </Layout>
  )
}

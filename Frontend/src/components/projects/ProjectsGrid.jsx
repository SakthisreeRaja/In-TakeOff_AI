import ProjectCard from "./ProjectCard"

export default function ProjectsGrid({ projects, onOpen }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {projects.map(p => (
        <ProjectCard key={p.id} project={p} onOpen={onOpen} />
      ))}
    </div>
  )
}

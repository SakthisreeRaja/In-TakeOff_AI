import StatusBadge from "../projects/StatusBadge"

export default function RecentProjects({ projects }) {
  const recent = [...projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  return (
    <div className="bg-zinc-900 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Projects</h3>

      <div className="space-y-4">
        {recent.map(p => (
          <div
            key={p.id}
            className="flex items-center justify-between border-b border-zinc-800 pb-3 last:border-none"
          >
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-zinc-400">{p.createdAt}</div>
            </div>

            <StatusBadge status={p.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

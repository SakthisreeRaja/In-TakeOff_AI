export default function StatusBadge({ status }) {
  const map = {
    draft: "bg-blue-500/15 text-blue-400",
    complete: "bg-pink-500/15 text-pink-400"
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-zinc-700 text-zinc-300"}`}>
      {status}
    </span>
  )
}

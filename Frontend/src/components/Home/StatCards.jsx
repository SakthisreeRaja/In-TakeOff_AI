import { FiTrendingUp, FiUsers, FiTarget, FiFolder } from "react-icons/fi"

function StatCards() {
  return (
    <div className="grid grid-cols-4 gap-6 mt-6 w-full">
      <Card icon={<FiFolder />} label="Projects" />
      <Card icon={<FiTarget />} label="Total Detections" />
      <Card icon={<FiUsers />} label="Team Members" />
      <Card icon={<FiTrendingUp />} label="This Week" />
    </div>
  )
}

function Card({ icon, label }) {
  return (
    <button className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center gap-4 text-lg font-medium hover:bg-zinc-800 active:scale-95 transition">
      <span className="text-2xl text-blue-400">{icon}</span>
      {label}
    </button>
  )
}

export default StatCards

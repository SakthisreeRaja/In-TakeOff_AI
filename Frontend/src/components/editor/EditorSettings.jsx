export default function EditorSettings({ filters, setFilters }) {
  const classes = [
    "Diffuser",
    "Grille",
    "Damper",
    "Fan",
    "VAV_FCU",
    "AHU_RTU",
    "Louver",
  ]

  function toggle(cls) {
    setFilters(prev => ({
      ...prev,
      [cls]: !prev[cls],
    }))
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-12 flex items-center px-4 border-b border-zinc-800">
        <span className="text-sm font-semibold">Settings</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
        <p className="text-xs text-zinc-400 mb-2">
          Confidence Threshold: 15%
        </p>
        <input type="range" className="w-full mb-6" />

        <h4 className="text-sm font-semibold mb-2">
          Class Filters
        </h4>

        <div className="space-y-2 text-sm text-zinc-300">
          {classes.map(cls => (
            <label key={cls} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters[cls]}
                onChange={() => toggle(cls)}
              />
              {cls.replace("_", " / ")}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function StorageUsage() {
  const usage = 95

  return (
    <div className="bg-zinc-900 rounded-xl p-6 flex flex-col flex-1">
      <h2 className="text-lg font-semibold mb-4">
        Storage Usage
      </h2>

      <div className="flex-1 flex items-center justify-center">
        <div
          className="relative w-36 h-36 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(
              #22c55e 0%,
              #eab308 60%,
              #ef4444 ${usage}%,
              #3f3f46 ${usage}% 100%
            )`,
          }}
        >
          <div className="w-28 h-28 bg-zinc-900 rounded-full flex items-center justify-center">
            <span className="text-xl font-semibold text-yellow-400">
              {usage}%
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-400 mt-4 text-center">
        6.8 GB of 10 GB used
      </p>
    </div>
  )
}

export default StorageUsage

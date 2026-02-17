import { useEffect, useState } from "react"
import { FiCheck, FiX } from "react-icons/fi"

/**
 * Toast notification that auto-disappears after 3 seconds
 * with a smooth progress line animation
 */
export default function Toast({ message, type = "success", onClose }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10)

    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for fade-out animation
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === "success" ? "bg-green-600/90" : "bg-red-600/90"
  const Icon = type === "success" ? FiCheck : FiX

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className={`${bgColor} backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 min-w-75`}>
        <Icon className="text-xl shrink-0" />
        <span className="flex-1 font-medium">{message}</span>
        
        {/* Animated progress line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden rounded-b-lg">
          <div
            className="h-full bg-white/60 animate-progress-line"
            style={{
              animation: "progress-line 3s linear forwards"
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes progress-line {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createUser } from "../services/api"

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const user = await createUser({
        email,
        first_name: "User",
        last_name: "Company",
        role: "estimator",
      })

      localStorage.setItem("user_id", user.id)
      navigate("/projects", { replace: true })
    } catch (err) {
      setError("Unable to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-sm"
      >
        <h1 className="text-2xl font-semibold mb-2">InTakeOff.ai</h1>
        <p className="text-zinc-400 mb-6 text-sm">
          Sign in to continue
        </p>

        <input
          type="email"
          required
          placeholder="company@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-md bg-black border border-zinc-700 text-white focus:outline-none focus:border-blue-600"
        />

        {error && (
          <p className="text-red-500 text-sm mb-3">{error}</p>
        )}

        <button
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 transition-colors py-2 rounded-md text-sm font-medium"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  )
}

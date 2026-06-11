'use client'

import { useState } from 'react'
import { adminLogin } from './actions'
import { Loader2, Lock } from 'lucide-react'

export default function AdminLoginForm() {
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await adminLogin(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Access</h1>
          <p className="text-stone-400 text-sm mt-1">BeNative Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-stone-800 rounded-2xl p-6 space-y-4 border border-stone-700">
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1.5">Username</label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="Enter username"
              className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-950/50 border border-red-800 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  )
}

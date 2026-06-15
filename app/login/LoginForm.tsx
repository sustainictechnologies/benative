'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Invalid email or password. Please try again.')
        setLoading(false)
      } else {
        router.push(next)
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setConfirmed(true)
        setLoading(false)
      }
    }
  }

  const inputCls = "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-all bg-stone-50"
  const labelCls = "block text-xs font-semibold text-stone-600 mb-1.5"

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Home size={22} className="text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-stone-900">BeNative</div>
              <div className="text-[10px] text-brand-600 font-semibold tracking-widest uppercase">Community Homestays</div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-stone-100 shadow-card p-8">

          {confirmed ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
                <Home size={24} className="text-brand-600" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">Check your email</h2>
              <p className="text-sm text-stone-500 leading-relaxed">
                We sent a confirmation link to <strong>{email}</strong>.<br />
                Click it to activate your account, then log in.
              </p>
              <button
                onClick={() => { setMode('login'); setConfirmed(false) }}
                className="text-brand-600 hover:text-brand-800 text-sm font-semibold"
              >
                Go to Login →
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-stone-900 mb-1">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-stone-500 text-sm mb-6">
                {mode === 'login'
                  ? 'Login to view host contact details.'
                  : 'Join BeNative to connect directly with local hosts.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className={labelCls}>Your Name</label>
                    <input required value={name} onChange={(e) => setName(e.target.value)}
                      className={inputCls} placeholder="Full name" />
                  </div>
                )}

                <div>
                  <label className={labelCls}>Email</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className={inputCls} placeholder="your@email.com" />
                </div>

                <div>
                  <label className={labelCls}>Password</label>
                  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className={inputCls} placeholder="••••••••" minLength={6} />
                  {mode === 'signup' && (
                    <p className="text-[10px] text-stone-400 mt-1">Minimum 6 characters</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white font-semibold py-3 rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Please wait…</>
                    : mode === 'login' ? 'Login' : 'Create Account'
                  }
                </button>
              </form>

              <p className="text-center text-sm text-stone-500 mt-6">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                  className="text-brand-600 hover:text-brand-800 font-semibold"
                >
                  {mode === 'login' ? 'Sign up free' : 'Login'}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          By signing up you agree to our community code of conduct.
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import GoogleSignInButton from '@/components/GoogleSignInButton'

export default function LoginForm() {
  const params = useSearchParams()

  // Only ever return to a page on this site
  const requested = params.get('next') ?? '/'
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'

  // ?mode=signup opens straight on "Create account"
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  // ?error=signin is set by /auth/callback when a Google sign-in does not complete
  const [error, setError] = useState<string | null>(
    params.get('error') === 'signin'
      ? 'Google sign-in did not complete. Please try again, or use your email instead.'
      : null
  )

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
        // A full page load, so the page is fetched again with the visitor signed in
        window.location.assign(next)
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (!data.session) {
        // The account exists but is not signed in yet (email confirmation is switched on)
        setError('Please confirm your email using the link we sent you, then log in.')
        setLoading(false)
      } else {
        window.location.assign(next)
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
          <h1 className="text-2xl font-bold text-stone-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-stone-500 text-sm mb-6">
            {mode === 'login'
              ? 'Login to see full homestay details and host contacts.'
              : 'Join BeNative to see full homestay details and connect directly with local hosts.'}
          </p>

          <div className="flex flex-col gap-4 mb-5">
            <GoogleSignInButton next={next} className="w-full" />
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span className="flex-1 h-px bg-stone-200" />
              or
              <span className="flex-1 h-px bg-stone-200" />
            </div>
          </div>

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
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          By signing up you agree to our community code of conduct.
        </p>
      </div>
    </div>
  )
}

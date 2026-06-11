'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut, Heart } from 'lucide-react'

export default function UserButton() {
  const [email, setEmail]         = useState<string | null>(null)
  const [fullName, setFullName]   = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [open, setOpen]           = useState(false)
  const ref                       = useRef<HTMLDivElement>(null)
  const router                    = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email ?? null)
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()
        setFullName(profile?.full_name ?? null)
        setAvatarUrl(profile?.avatar_url ?? null)
      }
      setLoading(false)
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setEmail(session?.user?.email ?? null)
      if (!session) { setFullName(null); setAvatarUrl(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  if (loading) return null

  if (!email) {
    return (
      <Link
        href="/login"
        className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-brand-700 border border-stone-200 hover:border-brand-300 px-3 py-2 rounded-full transition-all"
      >
        <User size={14} /> Login
      </Link>
    )
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email[0].toUpperCase()

  return (
    <div className="relative hidden sm:block" ref={ref}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center overflow-hidden border-2 border-white hover:border-brand-300 transition-colors shadow-sm focus:outline-none relative"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="avatar" fill className="object-cover" sizes="36px" />
        ) : (
          <span className="text-white text-sm font-bold">{initials}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-52 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-stone-100 bg-stone-50">
            <p className="text-sm font-semibold text-stone-900 truncate">{fullName || 'User'}</p>
            <p className="text-xs text-stone-400 truncate">{email}</p>
          </div>

          {/* Menu items */}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <User size={14} className="text-stone-400" /> My Profile
          </Link>

          <Link
            href="/favorites"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Heart size={14} className="text-stone-400" /> Favourites
          </Link>

          <div className="border-t border-stone-100" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
    </div>
  )
}

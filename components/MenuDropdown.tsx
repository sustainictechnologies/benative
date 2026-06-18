'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/discover', label: 'Discover' },
  { href: '/map',     label: 'Map' },
  { href: '/about',   label: 'About Us' },
  { href: '/blog',     label: 'Blog' },
  { href: '/faq',     label: 'FAQ' },
  { href: '/contact', label: 'Contact Us' },
]

export default function MenuDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-stone-100 transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X size={20} className="text-stone-600" /> : <Menu size={20} className="text-stone-600" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden z-50">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block px-5 py-3.5 text-sm font-medium transition-colors border-b border-stone-100 last:border-0 ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-brand-600'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

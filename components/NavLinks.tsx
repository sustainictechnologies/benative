'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/discover', label: 'Discover' },
  { href: '/map',     label: 'Map' },
  { href: '/about',   label: 'About Us' },
  { href: '/blog',     label: 'Blog' },
  { href: '/faq',     label: 'FAQ' },
  { href: '/contact', label: 'Contact Us' },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:flex items-center gap-5 ml-2">
      {links.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium transition-colors pb-0.5
              ${active
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-stone-500 hover:text-brand-600 border-b-2 border-transparent'
              }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

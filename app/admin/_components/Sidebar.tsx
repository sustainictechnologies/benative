'use client'

import { useState, useLayoutEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Home,
  Users,
  Star,
  Compass,
  MapPin,
  BarChart2,
  ImageIcon,
  Wrench,
  Settings,
  ChevronLeft,
  ChevronRight,
  Leaf,
  FilePen,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',       href: '/admin',                  icon: LayoutDashboard },
  { label: 'Homestays',       href: '/admin/homestays',        icon: Home },
  { label: 'Drafts',          href: '/admin/drafts',           icon: FilePen },
  { label: 'Hosts',           href: '/admin/hosts',            icon: Users },
  { label: 'Reviews',         href: '/admin/reviews',          icon: Star },
  { label: 'Experiences',     href: '/admin/experiences',      icon: Compass },
  { label: 'Regions',         href: '/admin/regions',          icon: MapPin },
  { label: 'Analytics',       href: '/admin/analytics',        icon: BarChart2 },
  { label: 'Media Library',   href: '/admin/media',            icon: ImageIcon },
  { label: 'Website Builder', href: '/admin/builder',          icon: Wrench },
  { label: 'Settings',        href: '/admin/settings',         icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setCollapsed(mq.matches)
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-white border-r border-stone-100 shadow-[2px_0_24px_rgba(0,0,0,0.04)] shrink-0 z-30 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-stone-100 shrink-0">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Leaf size={17} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-stone-900 leading-none tracking-tight">BeNative</p>
              <p className="text-[10px] text-brand-600 font-semibold tracking-widest uppercase mt-0.5">Admin Panel</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 3 }}
                transition={{ duration: 0.15 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-150 ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                }`}
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${active ? 'text-brand-600' : ''}`}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      className={`text-sm font-medium whitespace-nowrap ${active ? 'text-brand-700' : ''}`}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-4 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors text-xs font-medium"
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}

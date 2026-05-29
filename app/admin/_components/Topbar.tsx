'use client'

import { motion } from 'framer-motion'
import { Search, Bell, RefreshCw } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: Props) {
  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-16 bg-white/80 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20"
    >
      {/* Page title */}
      <div>
        <h1 className="text-base font-bold text-stone-900 leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-full px-3.5 py-2 w-52 hover:border-brand-300 transition-colors">
          <Search size={13} className="text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Search anything…"
            className="bg-transparent text-xs text-stone-600 placeholder:text-stone-400 outline-none flex-1 min-w-0"
          />
        </div>

        {/* Refresh */}
        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-50 border border-stone-200 text-stone-500 hover:border-brand-300 hover:text-brand-600 transition-colors">
          <RefreshCw size={14} />
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-stone-50 border border-stone-200 text-stone-500 hover:border-brand-300 hover:text-brand-600 transition-colors">
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full border-2 border-white" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            JA
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-stone-800 leading-none">Be Native Admin</p>
            <p className="text-[10px] text-stone-400 mt-0.5">Super Admin</p>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

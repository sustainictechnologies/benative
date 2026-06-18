'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Topbar from '../_components/Topbar'
import { Monitor, Users, RefreshCw, Smartphone, Laptop, Tablet } from 'lucide-react'

interface PageView {
  id: string
  path: string
  referrer: string | null
  user_agent: string | null
  created_at: string
}

interface PageStat {
  path: string
  count: number
}

function getDevice(ua: string | null) {
  if (!ua) return { label: 'Unknown', Icon: Laptop }
  if (/mobile/i.test(ua)) return { label: 'Mobile', Icon: Smartphone }
  if (/tablet|ipad/i.test(ua)) return { label: 'Tablet', Icon: Tablet }
  return { label: 'Desktop', Icon: Laptop }
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function AnalyticsPage() {
  const [recent, setRecent]         = useState<PageView[]>([])
  const [activeCount, setActive]    = useState(0)
  const [todayCount, setToday]      = useState(0)
  const [weekCount, setWeek]        = useState(0)
  const [topPages, setTopPages]     = useState<PageStat[]>([])
  const [refreshed, setRefreshed]   = useState<Date>(new Date())
  const [loading, setLoading]       = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const now = new Date()
    const fiveMinAgo  = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    const startOfDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { data: recentData },
      { count: active },
      { count: today },
      { count: week },
      { data: todayPaths },
    ] = await Promise.all([
      supabase.from('page_views').select('*').order('created_at', { ascending: false }).limit(25),
      supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', fiveMinAgo),
      supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
      supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek),
      supabase.from('page_views').select('path').gte('created_at', startOfDay),
    ])

    const counts: Record<string, number> = {}
    todayPaths?.forEach((v) => { counts[v.path] = (counts[v.path] || 0) + 1 })
    const sorted = Object.entries(counts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    setRecent(recentData || [])
    setActive(active || 0)
    setToday(today || 0)
    setWeek(week || 0)
    setTopPages(sorted)
    setRefreshed(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30_000)
    return () => clearInterval(id)
  }, [fetchData])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Analytics" subtitle="Live visitor activity · refreshes every 30s" />

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active now', value: activeCount, sub: 'last 5 minutes', icon: Monitor, bg: 'bg-emerald-50', color: 'text-emerald-600', bar: 'bg-emerald-400' },
            { label: 'Visits today', value: todayCount, sub: 'since midnight',  icon: Users,   bg: 'bg-brand-50',   color: 'text-brand-600',   bar: 'bg-brand-400'   },
            { label: 'This week',   value: weekCount,  sub: 'last 7 days',      icon: RefreshCw, bg: 'bg-indigo-50', color: 'text-indigo-600', bar: 'bg-indigo-400' },
          ].map(({ label, value, sub, icon: Icon, bg, color, bar }) => (
            <div key={label} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-bold text-stone-900">{value}</p>
              <p className="text-sm text-stone-400 mt-0.5">{label}</p>
              <p className="text-xs text-stone-300 mt-0.5">{sub}</p>
              <div className={`mt-3 h-1 rounded-full ${bg}`} />
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* Recent visits feed */}
          <div className="xl:col-span-3 bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-700">Recent Visits</h3>
              <span className="text-xs text-stone-300 flex items-center gap-1">
                <RefreshCw size={10} /> {refreshed.toLocaleTimeString()}
              </span>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-9 bg-stone-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-10">No visits recorded yet</p>
            ) : (
              <div className="space-y-0.5">
                {recent.map((v) => {
                  const { label, Icon } = getDevice(v.user_agent)
                  const isLive = (Date.now() - new Date(v.created_at).getTime()) < 5 * 60 * 1000
                  return (
                    <div key={v.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isLive ? 'bg-emerald-400' : 'bg-stone-200'}`} />
                      <span className="text-sm text-stone-700 font-medium flex-1 truncate">{v.path}</span>
                      <Icon size={13} className="text-stone-300 shrink-0" />
                      <span className="text-xs text-stone-400 shrink-0 w-16 text-right">{timeAgo(v.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top pages */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-700 mb-4">Top Pages Today</h3>

            {topPages.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-10">No data yet</p>
            ) : (
              <div className="space-y-4">
                {topPages.map((p) => (
                  <div key={p.path}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-stone-600 truncate flex-1 mr-2">{p.path}</span>
                      <span className="text-xs font-semibold text-stone-700 shrink-0">{p.count}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-400 rounded-full transition-all duration-500"
                        style={{ width: `${(p.count / (topPages[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

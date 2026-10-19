'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Topbar from '../_components/Topbar'
import { Monitor, Users, RefreshCw, Smartphone, Laptop, Tablet, Home, ChevronDown } from 'lucide-react'

interface PageView {
  id: string
  path: string
  referrer: string | null
  user_agent: string | null
  user_id: string | null    // the signed-in visitor's account; empty for signed-out visitors
  created_at: string
}

interface Person {
  name: string
  email: string
}

// One signed-in visitor and the pages they opened, newest first
interface Visitor extends Person {
  id: string
  homestays: number
  pages: number
  lastVisit: string
  visits: { path: string; created_at: string }[]
}

interface PageStat {
  path: string
  count: number
}

interface HomestayVisits {
  slug: string
  title: string
  today: number
  week: number
  total: number
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
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function AnalyticsPage() {
  const [recent, setRecent]         = useState<PageView[]>([])
  const [activeCount, setActive]    = useState(0)
  const [todayCount, setToday]      = useState(0)
  const [weekCount, setWeek]        = useState(0)
  const [topPages, setTopPages]     = useState<PageStat[]>([])
  const [homestayVisits, setHomestayVisits] = useState<HomestayVisits[]>([])
  const [showHomestays, setShowHomestays]   = useState(false)   // the table opens from the Homestay visits card
  const [people, setPeople]         = useState<Record<string, Person>>({})          // account id → name and email
  const [visitors, setVisitors]     = useState<Visitor[]>([])
  const [openVisitor, setOpenVisitor] = useState<string | null>(null)
  const [pageTitles, setPageTitles] = useState<Record<string, string>>({})        // homestay page path → homestay name
  // Set only in the browser after the first fetch, so the server and the browser never print different times
  const [refreshed, setRefreshed]   = useState<Date | null>(null)
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

    // Visits to each homestay's page: today, last 7 days and all time. Every homestay is listed, even with no visits.
    const { data: homestays } = await supabase.from('homestays').select('title, slug')
    const perHomestay = await Promise.all((homestays ?? []).map(async (h) => {
      const path = `/homestays/${h.slug}`
      const [{ count: t }, { count: w }, { count: all }] = await Promise.all([
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('path', path).gte('created_at', startOfDay),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('path', path).gte('created_at', startOfWeek),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('path', path),
      ])
      return { slug: h.slug, title: h.title, today: t || 0, week: w || 0, total: all || 0 }
    }))
    perHomestay.sort((a, b) => b.week - a.week || b.total - a.total)

    // Signed-in visitors: their newest 1,000 visits, grouped per person (newest visitor first)
    const { data: signedIn } = await supabase
      .from('page_views')
      .select('user_id, path, created_at')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000)

    const ids = Array.from(new Set([
      ...(signedIn ?? []).map((v) => v.user_id as string),
      ...(recentData ?? []).map((v) => v.user_id as string | null).filter((id): id is string => !!id),
    ]))
    const { data: profiles } = ids.length > 0
      ? await supabase.from('profiles').select('id, full_name, email').in('id', ids)
      : { data: [] as { id: string; full_name: string | null; email: string | null }[] }
    const peopleById: Record<string, Person> = Object.fromEntries((profiles ?? []).map((p) => [
      p.id, { name: p.full_name || p.email || 'No name', email: p.email ?? '' },
    ]))

    const byPerson = new Map<string, Visitor>()
    for (const v of signedIn ?? []) {
      const person = peopleById[v.user_id] ?? { name: 'Deleted account', email: '' }
      const entry: Visitor = byPerson.get(v.user_id) ??
        { id: v.user_id, ...person, homestays: 0, pages: 0, lastVisit: v.created_at, visits: [] }
      entry.pages += 1
      entry.visits.push({ path: v.path, created_at: v.created_at })
      byPerson.set(v.user_id, entry)
    }
    byPerson.forEach((p) => {
      p.homestays = new Set(p.visits.map((v) => v.path).filter((path) => path.startsWith('/homestays/'))).size
    })

    setPeople(peopleById)
    setVisitors(Array.from(byPerson.values()))
    setPageTitles(Object.fromEntries((homestays ?? []).map((h) => [`/homestays/${h.slug}`, h.title])))
    setRecent(recentData || [])
    setActive(active || 0)
    setToday(today || 0)
    setWeek(week || 0)
    setTopPages(sorted)
    setHomestayVisits(perHomestay)
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
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
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

          {/* Homestay visits: opens and closes the table of visits per homestay */}
          <button
            type="button"
            onClick={() => setShowHomestays((open) => !open)}
            aria-expanded={showHomestays}
            className={`text-left bg-white rounded-2xl border p-5 shadow-sm transition-colors ${
              showHomestays ? 'border-amber-300 ring-2 ring-amber-100' : 'border-stone-100 hover:border-amber-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <Home size={18} className="text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-stone-900">{homestayVisits.reduce((sum, h) => sum + h.week, 0)}</p>
            <p className="text-sm text-stone-400 mt-0.5">Homestay visits</p>
            <p className="text-xs text-stone-300 mt-0.5 flex items-center gap-1">
              last 7 days · {showHomestays ? 'hide list' : 'see each homestay'}
              <ChevronDown size={12} className={`transition-transform ${showHomestays ? 'rotate-180' : ''}`} />
            </p>
            <div className="mt-3 h-1 rounded-full bg-amber-50" />
          </button>
        </div>

        {/* Homestay visits, opened from the card above */}
        {showHomestays && (
          <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-700">Homestay Visits</h3>
              <span className="text-xs text-stone-300">Sorted by last 7 days</span>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-9 bg-stone-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : homestayVisits.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-10">No homestays yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-stone-400 border-b border-stone-100">
                      <th className="text-left font-medium pb-2">Homestay</th>
                      <th className="text-right font-medium pb-2 w-20">Today</th>
                      <th className="text-right font-medium pb-2 w-28">Last 7 days</th>
                      <th className="text-right font-medium pb-2 w-24">All time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homestayVisits.map((h) => {
                      const busiest = homestayVisits[0]?.week || 1
                      return (
                        <tr key={h.slug} className="border-b border-stone-50 last:border-0">
                          <td className="py-2.5 pr-4">
                            <a
                              href={`/homestays/${h.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-stone-700 hover:text-brand-700 transition-colors"
                            >
                              {h.title}
                            </a>
                            <div className="mt-1.5 h-1.5 max-w-xs bg-stone-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-400 rounded-full transition-all duration-500"
                                style={{ width: `${(h.week / busiest) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-stone-600">{h.today}</td>
                          <td className="py-2.5 text-right tabular-nums font-semibold text-stone-800">{h.week}</td>
                          <td className="py-2.5 text-right tabular-nums text-stone-600">{h.total}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* Recent visits feed */}
          <div className="xl:col-span-3 bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-700">Recent Visits</h3>
              <span className="text-xs text-stone-300 flex items-center gap-1">
                <RefreshCw size={10} /> {refreshed?.toLocaleTimeString()}
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
                      <span
                        className={`text-xs truncate max-w-[9rem] shrink-0 ${v.user_id ? 'text-stone-600' : 'text-stone-300'}`}
                        title={v.user_id ? people[v.user_id]?.email : undefined}
                      >
                        {v.user_id ? (people[v.user_id]?.name ?? 'Signed in') : 'Signed out'}
                      </span>
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

        {/* Signed-in visitors: who opened which pages */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-700">Visitors</h3>
            <span className="text-xs text-stone-300">Signed-in visitors · click a name to see their pages</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 bg-stone-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : visitors.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-10">No visits by signed-in visitors yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-stone-400 border-b border-stone-100">
                    <th className="text-left font-medium pb-2">Name</th>
                    <th className="text-left font-medium pb-2">Email</th>
                    <th className="text-right font-medium pb-2 w-32">Homestays viewed</th>
                    <th className="text-right font-medium pb-2 w-28">Pages opened</th>
                    <th className="text-right font-medium pb-2 w-24">Last visit</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((p) => {
                    const open = openVisitor === p.id
                    return (
                      <Fragment key={p.id}>
                        <tr className="border-b border-stone-50 last:border-0">
                          <td className="py-2.5 pr-4">
                            <button
                              type="button"
                              onClick={() => setOpenVisitor(open ? null : p.id)}
                              aria-expanded={open}
                              className="flex items-center gap-1.5 font-medium text-stone-700 hover:text-brand-700 transition-colors text-left"
                            >
                              <ChevronDown size={13} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                              {p.name}
                            </button>
                          </td>
                          <td className="py-2.5 pr-4 text-stone-500 truncate max-w-[16rem]">{p.email}</td>
                          <td className="py-2.5 text-right tabular-nums font-semibold text-stone-800">{p.homestays}</td>
                          <td className="py-2.5 text-right tabular-nums text-stone-600">{p.pages}</td>
                          <td className="py-2.5 text-right text-xs text-stone-400">{timeAgo(p.lastVisit)}</td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={5} className="pb-3">
                              <ul className="bg-stone-50 rounded-lg px-4 py-2 divide-y divide-stone-100">
                                {p.visits.map((v, i) => (
                                  <li key={i} className="flex items-center justify-between gap-4 py-1.5 text-xs">
                                    <span className="text-stone-700 truncate">
                                      {pageTitles[v.path] ?? v.path}
                                      {pageTitles[v.path] && <span className="text-stone-400"> · homestay</span>}
                                    </span>
                                    <span className="text-stone-400 shrink-0 tabular-nums">
                                      {new Date(v.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

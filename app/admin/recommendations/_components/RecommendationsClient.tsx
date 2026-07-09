'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox, ChevronDown, ChevronUp, Trash2, Check, X, Phone, Mail, MapPin, User, Home } from 'lucide-react'
import { updateRecommendationStatus, deleteRecommendation } from '../actions'

type Status = 'pending' | 'reviewed' | 'contacted' | 'added'

interface Recommendation {
  id:               string
  recommenderName:  string | null
  recommenderPhone: string | null
  recommenderEmail: string | null
  homestayName:     string | null
  address:          string | null
  hostName:         string | null
  hostContact:      string | null
  description:      string | null
  status:           string
  createdAt:        string
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700' },
  reviewed:  { label: 'Reviewed',  cls: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Contacted', cls: 'bg-purple-100 text-purple-700' },
  added:     { label: 'Added',     cls: 'bg-green-100 text-green-700' },
}

const STATUS_OPTIONS: Status[] = ['pending', 'reviewed', 'contacted', 'added']

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function RecommendationsClient({ recommendations }: { recommendations: Recommendation[] }) {
  const router              = useRouter()
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [confirmId, setConfirmId]     = useState<string | null>(null)
  const [working, setWorking]         = useState<string | null>(null)
  const [statusOpen, setStatusOpen]   = useState<string | null>(null)

  async function handleStatusChange(id: string, status: string) {
    setWorking(id)
    await updateRecommendationStatus(id, status)
    setStatusOpen(null)
    setWorking(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    setWorking(id)
    await deleteRecommendation(id)
    setConfirmId(null)
    setWorking(null)
    router.refresh()
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
          <Inbox size={26} className="text-stone-400" />
        </div>
        <p className="text-sm font-semibold text-stone-600">No recommendations yet</p>
        <p className="text-xs text-stone-400">Submissions from the Recommend a Homestay page will appear here.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-3 max-w-4xl">
        {recommendations.map((r) => {
          const cfg     = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending
          const isOpen  = expanded === r.id
          const isConfirm = confirmId === r.id

          return (
            <div key={r.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">

              {/* Row header */}
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-stone-900 truncate">
                      {r.homestayName ?? <span className="text-stone-400 font-normal italic">Unnamed homestay</span>}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {r.address && (
                      <span className="flex items-center gap-1 text-[11px] text-stone-400">
                        <MapPin size={10} /> {r.address}
                      </span>
                    )}
                    {r.recommenderName && (
                      <span className="flex items-center gap-1 text-[11px] text-stone-400">
                        <User size={10} /> {r.recommenderName}
                      </span>
                    )}
                    <span className="text-[11px] text-stone-300">{timeAgo(r.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setStatusOpen(statusOpen === r.id ? null : r.id)}
                      disabled={working === r.id}
                      className="flex items-center gap-1 text-xs font-semibold text-stone-500 border border-stone-200 hover:border-brand-300 hover:text-brand-700 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Status <ChevronDown size={12} />
                    </button>
                    {statusOpen === r.id && (
                      <div className="absolute right-0 top-9 z-20 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden w-36">
                        {STATUS_OPTIONS.map((s) => {
                          const c = STATUS_CONFIG[s]
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(r.id, s)}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 hover:bg-stone-50 transition-colors ${r.status === s ? 'text-brand-700 bg-brand-50' : 'text-stone-600'}`}
                            >
                              {r.status === s && <Check size={11} className="text-brand-600 shrink-0" />}
                              <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${c.cls.split(' ')[0]}`} />
                              {c.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  {isConfirm ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-2 py-1.5">
                      <span className="text-[11px] text-rose-700 font-medium">Delete?</span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={working === r.id}
                        className="w-5 h-5 flex items-center justify-center rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                      >
                        <Check size={10} />
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-rose-400 hover:text-rose-600">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(r.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl border border-stone-200 text-stone-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-stone-200 text-stone-400 hover:bg-stone-50 transition-colors"
                  >
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div className="border-t border-stone-100 px-5 py-4 grid sm:grid-cols-2 gap-6 bg-stone-50/60">

                  {/* About recommender */}
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">From</p>
                    <div className="space-y-2">
                      {r.recommenderName && (
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                          <User size={13} className="text-stone-400 shrink-0" /> {r.recommenderName}
                        </div>
                      )}
                      {r.recommenderPhone && (
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                          <Phone size={13} className="text-stone-400 shrink-0" />
                          <a href={`tel:${r.recommenderPhone}`} className="hover:text-brand-600 transition-colors">{r.recommenderPhone}</a>
                        </div>
                      )}
                      {r.recommenderEmail && (
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                          <Mail size={13} className="text-stone-400 shrink-0" />
                          <a href={`mailto:${r.recommenderEmail}`} className="hover:text-brand-600 transition-colors">{r.recommenderEmail}</a>
                        </div>
                      )}
                      {!r.recommenderName && !r.recommenderPhone && !r.recommenderEmail && (
                        <p className="text-xs text-stone-400 italic">No contact info provided</p>
                      )}
                    </div>
                  </div>

                  {/* About homestay */}
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Homestay</p>
                    <div className="space-y-2">
                      {r.homestayName && (
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                          <Home size={13} className="text-stone-400 shrink-0" /> {r.homestayName}
                        </div>
                      )}
                      {r.address && (
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                          <MapPin size={13} className="text-stone-400 shrink-0" /> {r.address}
                        </div>
                      )}
                      {r.hostName && (
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                          <User size={13} className="text-stone-400 shrink-0" /> Host: {r.hostName}
                        </div>
                      )}
                      {r.hostContact && (
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                          <Phone size={13} className="text-stone-400 shrink-0" /> {r.hostContact}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {r.description && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Why they recommend it</p>
                      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{r.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

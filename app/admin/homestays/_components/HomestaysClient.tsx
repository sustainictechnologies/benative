'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye, Pencil, Trash2, ShieldCheck, MapPin, Search,
  ExternalLink, Layers, AlertTriangle, X, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Homestay {
  id:                string
  title:             string
  slug:              string
  host_name:         string
  village_name:      string
  location_district: string
  is_verified:       boolean
  has_location:      boolean
  created_at:        string
  cover_image_url:   string | null
  block_count:       number
}

export default function HomestaysClient({ homestays }: { homestays: Homestay[] }) {
  const router = useRouter()
  const [search, setSearch]         = useState('')
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [confirmId, setConfirmId]   = useState<string | null>(null)
  const [deleteErr, setDeleteErr]   = useState('')

  const filtered = homestays.filter(h =>
    h.title.toLowerCase().includes(search.toLowerCase()) ||
    h.host_name.toLowerCase().includes(search.toLowerCase()) ||
    h.village_name.toLowerCase().includes(search.toLowerCase()) ||
    h.location_district.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    setDeleting(id)
    setDeleteErr('')
    const supabase = createClient()
    const { error } = await supabase.from('homestays').delete().eq('id', id)
    if (error) { setDeleteErr(error.message); setDeleting(null) }
    else        { setConfirmId(null); setDeleting(null); router.refresh() }
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">

      {/* Search + stats bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 flex-1 max-w-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
          <Search size={14} className="text-stone-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, host, location…"
            className="bg-transparent text-sm text-stone-700 placeholder:text-stone-400 outline-none flex-1"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-stone-300 hover:text-stone-500">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="bg-stone-100 px-2.5 py-1.5 rounded-lg font-medium text-stone-600">
            {filtered.length} of {homestays.length}
          </span>
        </div>
      </div>

      {/* Delete error */}
      {deleteErr && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          {deleteErr}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-4xl">🌿</span>
          <p className="text-sm font-semibold text-stone-600">No homestays found</p>
          <p className="text-xs text-stone-400">
            {search ? 'Try a different search term' : 'Publish your first homestay from the Website Builder'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-stone-100 bg-stone-50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Homestay</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Location</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Sections</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-stone-50">
            {filtered.map(h => (
              <div
                key={h.id}
                className={`grid grid-cols-[2.5fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-stone-50/60 transition-colors ${
                  confirmId === h.id ? 'bg-rose-50/40' : ''
                }`}
              >
                {/* Homestay info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                    {h.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.cover_image_url} alt={h.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300 text-xl">🏡</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{h.title}</p>
                    <p className="text-xs text-stone-400 truncate">by {h.host_name}</p>
                    <p className="text-[10px] text-stone-300 font-mono truncate mt-0.5">{h.slug}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-1.5 min-w-0">
                  <MapPin size={12} className="text-stone-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-stone-700 truncate">{h.village_name}</p>
                    <p className="text-[10px] text-stone-400 truncate">{h.location_district}</p>
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-col gap-1">
                  {h.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full w-fit">
                      <ShieldCheck size={9} /> Verified
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${
                    h.has_location
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    <MapPin size={9} />
                    {h.has_location ? 'On map' : 'No location'}
                  </span>
                </div>

                {/* Block count */}
                <div className="flex items-center gap-1.5">
                  <Layers size={13} className="text-stone-400" />
                  <span className="text-sm font-semibold text-stone-700">{h.block_count}</span>
                  <span className="text-xs text-stone-400">sections</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {confirmId === h.id ? (
                    /* Delete confirmation inline */
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5">
                      <span className="text-xs text-rose-700 font-medium">Delete?</span>
                      <button
                        onClick={() => handleDelete(h.id)}
                        disabled={deleting === h.id}
                        className="flex items-center gap-1 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Check size={11} /> Yes
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* View on site */}
                      <Link
                        href={`/homestays/${h.slug}`}
                        target="_blank"
                        title="View on site"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </Link>

                      {/* Edit in builder */}
                      <Link
                        href="/admin/builder"
                        title="Edit in Builder"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Pencil size={14} />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => setConfirmId(h.id)}
                        title="Delete"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Pencil, Trash2, ShieldCheck, MapPin, Search,
  ExternalLink, Layers, AlertTriangle, X, Check, Tag, Globe, UserCheck,
} from 'lucide-react'
import { saveCategories, saveSubCategories, toggleShowOnHomepage, linkHostAccount, unlinkHostAccount, removeHomestay } from '../actions'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'
import { SUB_CATEGORY_GROUPS } from '@/lib/subCategories'
import { FACILITIES, FACILITY_GROUPS } from '@/lib/facilities'

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
  updated_at:        string
  cover_image_url:   string | null
  block_count:       number
  category_slugs:    string[]
  sub_categories:    string[]
  has_draft:         boolean
  show_on_homepage:  boolean
  host_user_id:      string | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

interface Category {
  id:   number
  name: string
  slug: string
}

interface Props {
  homestays: Homestay[]
}

/* ── Taxonomy data ───────────────────────────────────────────── */
// Facilities & stay preferences: the same list and groups as Discover's Filters.
// (The earlier Travel Intent and Landscape tags are no longer shown or used; homestays keep them.)
const PRACTICAL_DATA = FACILITIES.map(f => ({ slug: f.slug, name: f.label }))

const PRACTICAL_SLUGS_SET = new Set(PRACTICAL_DATA.map(p => p.slug))

const ALL_SLUG_NAMES = Object.fromEntries(PRACTICAL_DATA.map(c => [c.slug, c.name]))

const facilityCount = (slugs: string[]) => slugs.filter(s => PRACTICAL_SLUGS_SET.has(s)).length

const slugToName = (slug: string) =>
  ALL_SLUG_NAMES[slug] ?? slug.replace(/-/g, ' ')

/* ── Link-host panel ─────────────────────────────────────────── */
function LinkHostPanel({
  homestayId,
  isLinked,
  onClose,
  onSaved,
}: {
  homestayId: string
  isLinked:   boolean
  onClose:    () => void
  onSaved:    () => void
}) {
  const [email,   setEmail]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleLink() {
    if (!email.trim()) return
    setSaving(true); setError(null)
    const res = await linkHostAccount(homestayId, email.trim())
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => onSaved(), 900)
  }

  async function handleUnlink() {
    setSaving(true); setError(null)
    const res = await unlinkHostAccount(homestayId)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    onSaved()
  }

  return (
    <div className="col-span-full px-5 py-4 bg-stone-50 border-t border-stone-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Link Host Account</p>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={14} /></button>
      </div>

      {isLinked && (
        <div className="flex items-center gap-3 mb-3 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2">
          <UserCheck size={14} className="text-brand-600 shrink-0" />
          <span className="text-xs text-brand-700 flex-1">A host account is already linked to this homestay.</span>
          <button
            onClick={handleUnlink}
            disabled={saving}
            className="text-xs text-rose-500 hover:text-rose-700 font-medium disabled:opacity-50"
          >
            Unlink
          </button>
        </div>
      )}

      <div className="flex gap-2 items-start">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setSaved(false); setError(null) }}
          placeholder={isLinked ? 'Enter new host email to re-link…' : 'Enter host email address…'}
          className="flex-1 text-xs border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-400 text-stone-700 placeholder:text-stone-300"
          onKeyDown={e => e.key === 'Enter' && handleLink()}
        />
        <button
          onClick={handleLink}
          disabled={saving || !email.trim()}
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          {saving ? (
            <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <Check size={12} />
          ) : (
            <UserCheck size={12} />
          )}
          {saved ? 'Linked!' : 'Link Account'}
        </button>
      </div>
      {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
      <p className="text-[10px] text-stone-400 mt-2">
        The host must already have an account on BeNative (created via /login). Enter their registered email address.
      </p>
    </div>
  )
}

/* ── Taxonomy panel (replaces CategoryPanel) ─────────────────── */
function TaxonomyPanel({
  homestayId,
  initialSlugs,
  initialSubCategories,
  onClose,
  onSaved,
}: {
  homestayId:           string
  initialSlugs:         string[]
  initialSubCategories: string[]
  onClose:              () => void
  onSaved:              () => void
}) {
  const [subCategories, setSubCategories] = useState<string[]>(initialSubCategories)
  const [practicalSlugs, setPracticalSlugs] = useState<string[]>(
    initialSlugs.filter(s => PRACTICAL_SLUGS_SET.has(s))
  )
  // The homestay's earlier Travel Intent / Landscape tags: no longer shown, but saved back unchanged
  const keptOldSlugs = initialSlugs.filter(s => !PRACTICAL_SLUGS_SET.has(s))
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function togglePractical(slug: string) {
    setPracticalSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
    setSaved(false)
  }

  function toggleSubCategory(key: string) {
    setSubCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const selected = [...keptOldSlugs, ...practicalSlugs]
    // The old tags and the new sub-categories are stored separately; save both
    const result    = await saveCategories(homestayId, selected)
    const subResult = result.error ? null : await saveSubCategories(homestayId, subCategories)
    setSaving(false)
    const failure = result.error ?? subResult?.error
    if (failure) {
      setError(failure)
    } else {
      setSaved(true)
      setTimeout(() => onSaved(), 900)
    }
  }

  const totalSelected = subCategories.length + practicalSlugs.length

  return (
    <div className="col-span-full px-5 py-4 bg-stone-50 border-t border-stone-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Assign Taxonomy</p>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
          <X size={14} />
        </button>
      </div>

      {/* Discover sub-categories (multi-select) — the new Discover page reads these */}
      <div className="mb-5 pb-5 border-b border-stone-200">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
          Discover sub-categories · {subCategories.length} selected
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUB_CATEGORY_GROUPS.map(group => (
            <div key={group.key}>
              <p className="text-xs font-semibold text-stone-700 mb-2">{group.label}</p>
              <div className="space-y-1.5">
                {group.subCategories.map(sub => (
                  <label key={sub.key} className="flex items-center gap-2 cursor-pointer group/s">
                    <input
                      type="checkbox"
                      checked={subCategories.includes(sub.key)}
                      onChange={() => toggleSubCategory(sub.key)}
                      className="w-3.5 h-3.5 rounded border-stone-300 accent-brand-600 cursor-pointer"
                    />
                    <span className="text-xs text-stone-600 group-hover/s:text-stone-900 transition-colors">
                      {sub.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Facilities & Stay Preferences (multi-select): tick only what the host has confirmed.
          These feed Discover's Filters button and the homestay page. */}
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
          Facilities &amp; Stay Preferences · {practicalSlugs.length} selected
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FACILITY_GROUPS.map(group => (
            <div key={group.key}>
              <p className="text-xs font-semibold text-stone-700 mb-2">{group.label}</p>
              <div className="space-y-1.5">
                {group.facilities.map(f => (
                  <label key={f.slug} className="flex items-center gap-2 cursor-pointer group/p">
                    <input
                      type="checkbox"
                      checked={practicalSlugs.includes(f.slug)}
                      onChange={() => togglePractical(f.slug)}
                      className="w-3.5 h-3.5 rounded border-stone-300 accent-brand-600 cursor-pointer"
                    />
                    <span className="text-xs text-stone-600 group-hover/p:text-stone-900 transition-colors">
                      {f.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
        >
          {saving ? (
            <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <Check size={12} />
          ) : null}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Taxonomy'}
        </button>
        <span className="text-xs text-stone-400">{totalSelected} selected</span>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────── */
export default function HomestaysClient({ homestays }: Props) {
  const router = useRouter()
  const [search,       setSearch]       = useState('')
  const [deleting,     setDeleting]     = useState<string | null>(null)
  const [confirmId,    setConfirmId]    = useState<string | null>(null)
  const [deleteErr,    setDeleteErr]    = useState('')
  const [expandedId,   setExpandedId]   = useState<string | null>(null)
  const [linkHostId,   setLinkHostId]   = useState<string | null>(null)
  const [togglingId,   setTogglingId]   = useState<string | null>(null)

  const handleToggleHomepage = async (id: string, current: boolean) => {
    setTogglingId(id)
    await toggleShowOnHomepage(id, current)
    setTogglingId(null)
    router.refresh()
  }

  const filtered = homestays.filter(h =>
    h.title.toLowerCase().includes(search.toLowerCase()) ||
    h.host_name.toLowerCase().includes(search.toLowerCase()) ||
    h.village_name.toLowerCase().includes(search.toLowerCase()) ||
    h.location_district.toLowerCase().includes(search.toLowerCase())
  )

  // A live homestay goes back to Drafts; a draft is deleted for good (see removeHomestay)
  const handleDelete = async (id: string) => {
    setDeleting(id)
    setDeleteErr('')
    const { error } = await removeHomestay(id)
    if (error) { setDeleteErr(error); setDeleting(null) }
    else       { setConfirmId(null); setDeleting(null); router.refresh() }
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">

      {/* Search bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 flex-1 max-w-sm focus-within:border-brand-400 transition-all">
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
        <span className="bg-stone-100 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600">
          {filtered.length} of {homestays.length}
        </span>
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
          {/* Header */}
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
              <div key={h.id}>
                <div
                  className={`grid grid-cols-[2.5fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-stone-50/60 transition-colors ${
                    confirmId === h.id ? 'bg-rose-50/40' : ''
                  }`}
                >
                  {/* Homestay info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                      {h.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={supabaseImgUrl(h.cover_image_url, { width: 150, quality: 65 })} alt={h.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300 text-xl">🏡</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">{h.title}</p>
                      <p className="text-xs text-stone-400 truncate">by {h.host_name}</p>
                      <p className="text-[10px] text-stone-300 mt-0.5">Updated {timeAgo(h.updated_at)}</p>
                      {/* Facility tags (the earlier Travel Intent / Landscape tags are not shown) */}
                      {(() => {
                        const facilitySlugs = h.category_slugs.filter(slug => PRACTICAL_SLUGS_SET.has(slug))
                        return facilitySlugs.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {facilitySlugs.slice(0, 3).map(slug => (
                              <span key={slug} className="text-[9px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full font-medium border border-brand-100">
                                {slugToName(slug)}
                              </span>
                            ))}
                            {facilitySlugs.length > 3 && (
                              <span className="text-[9px] text-stone-400">+{facilitySlugs.length - 3} more</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[9px] text-stone-300 mt-0.5">No facilities</p>
                        )
                      })()}
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

                  {/* Status */}
                  <div className="flex flex-col gap-1">
                    {h.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full w-fit">
                        <ShieldCheck size={9} /> Verified
                      </span>
                    )}
                    {h.has_draft && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full w-fit">
                        Draft
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${
                      h.has_location ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                    }`}>
                      <MapPin size={9} />
                      {h.has_location ? 'On map' : 'Not on map'}
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
                      <div
                        className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5"
                        title={h.has_location
                          ? 'Taken off the site and moved to Drafts. Its page, photos, reviews and location are kept, so you can publish it again.'
                          : 'This draft and its page are deleted for good.'}
                      >
                        <span className="text-xs text-rose-700 font-medium">{h.has_location ? 'Move to Drafts?' : 'Delete for good?'}</span>
                        <button
                          onClick={() => handleDelete(h.id)}
                          disabled={deleting === h.id}
                          className="flex items-center gap-1 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Check size={11} /> Yes
                        </button>
                        <button onClick={() => setConfirmId(null)} className="text-rose-400 hover:text-rose-600">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Show on homepage toggle */}
                        <button
                          onClick={() => handleToggleHomepage(h.id, h.show_on_homepage)}
                          disabled={togglingId === h.id}
                          title={h.show_on_homepage ? 'Remove from homepage' : 'Show on homepage'}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                            h.show_on_homepage
                              ? 'bg-brand-100 text-brand-600 hover:bg-brand-200'
                              : 'text-stone-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Globe size={14} />
                        </button>

                        {/* Categories */}
                        <button
                          onClick={() => { setExpandedId(expandedId === h.id ? null : h.id); setLinkHostId(null) }}
                          title={facilityCount(h.category_slugs) > 0 ? `Edit ${facilityCount(h.category_slugs)} facilities` : 'Assign Taxonomy'}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                            expandedId === h.id
                              ? 'bg-brand-100 text-brand-600'
                              : facilityCount(h.category_slugs) > 0
                              ? 'bg-brand-50 text-brand-500 hover:bg-brand-100 hover:text-brand-700'
                              : 'text-stone-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Tag size={14} />
                        </button>

                        {/* Link host */}
                        <button
                          onClick={() => { setLinkHostId(linkHostId === h.id ? null : h.id); setExpandedId(null) }}
                          title={h.host_user_id ? 'Host account linked — click to manage' : 'Link host account'}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                            linkHostId === h.id
                              ? 'bg-brand-100 text-brand-600'
                              : h.host_user_id
                              ? 'bg-brand-50 text-brand-500 hover:bg-brand-100'
                              : 'text-stone-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <UserCheck size={14} />
                        </button>

                        {/* View */}
                        <Link
                          href={`/homestays/${h.slug}`}
                          target="_blank"
                          title="View on site"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <ExternalLink size={14} />
                        </Link>

                        {/* Edit */}
                        <Link
                          href={`/admin/builder?slug=${h.slug}`}
                          title="Edit in Builder"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => setConfirmId(h.id)}
                          title={h.has_location ? 'Take off the site (back to Drafts)' : 'Delete draft'}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Taxonomy panel */}
                {expandedId === h.id && (
                  <TaxonomyPanel
                    homestayId={h.id}
                    initialSlugs={h.category_slugs}
                    initialSubCategories={h.sub_categories}
                    onClose={() => setExpandedId(null)}
                    onSaved={() => { setExpandedId(null); router.refresh() }}
                  />
                )}

                {/* Link host panel */}
                {linkHostId === h.id && (
                  <LinkHostPanel
                    homestayId={h.id}
                    isLinked={!!h.host_user_id}
                    onClose={() => setLinkHostId(null)}
                    onSaved={() => { setLinkHostId(null); router.refresh() }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

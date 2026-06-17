'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Pencil, Trash2, ShieldCheck, MapPin, Search,
  ExternalLink, Layers, AlertTriangle, X, Check, Tag,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveCategories } from '../actions'
import { supabaseImgUrl } from '@/lib/supabase/imageUrl'

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
const INTENT_DATA = [
  { slug: 'nature_habitat',    name: 'Nature & Habitats'   },
  { slug: 'rural_immersion',   name: 'Rural Immersion'     },
  { slug: 'long_stay_retreat', name: 'Long-Stay Retreats'  },
  { slug: 'transit_pitstop',   name: 'On-the-Move Transit' },
]
const LANDSCAPE_DATA = [
  { slug: 'env_forest_border',   name: 'Forest Borders & Buffers'        },
  { slug: 'env_riverside',       name: 'Riverside & Backwaters'          },
  { slug: 'env_coastal',         name: 'Untouched Coastal Villages'      },
  { slug: 'env_mountain_valley', name: 'Mountain Passes & High Valleys'  },
  { slug: 'env_agricultural',    name: 'Active Farm Belts & Plantations' },
  { slug: 'env_rocky_plateau',   name: 'Plateaus & Rocky Terrains'       },
  { slug: 'env_sacred_grove',    name: 'Sacred Groves & Hidden Orchards' },
  { slug: 'env_wetland',         name: 'Lakeside & Wetland Fringes'      },
]
const PRACTICAL_DATA = [
  { slug: 'spec_gated_parking',        name: 'Gated Parking'           },
  { slug: 'spec_basic_toolkit',        name: 'Basic Toolkit Available' },
  { slug: 'spec_pet_friendly',         name: 'Pet-Friendly Compound'   },
  { slug: 'spec_wildlife_secure',      name: 'Wildlife-Proof Safety'   },
  { slug: 'spec_stable_network',       name: 'Stable Network'          },
  { slug: 'spec_shared_kitchen',       name: 'Shared Kitchen'          },
  { slug: 'spec_power_backup',         name: 'Power Backup'            },
  { slug: 'spec_laundry_access',       name: 'Laundry Access'          },
  { slug: 'spec_native_guide',         name: 'Native Guide Available'  },
  { slug: 'spec_plastic_free',         name: 'Plastic-Free Stay'       },
  { slug: 'spec_western_toilet',       name: 'Western-Style Toilet'    },
  { slug: 'spec_hot_water',            name: 'Hot Water / Geyser'      },
  { slug: 'spec_no_stairs_access',     name: 'No-Stairs Access'        },
  { slug: 'spec_quiet_work_setup',     name: 'Quiet Work Setup'        },
  { slug: 'spec_solo_female_friendly', name: 'Solo-Female Friendly'    },
]

const INTENT_SLUGS_SET   = new Set(INTENT_DATA.map(i => i.slug))
const LANDSCAPE_SLUGS_SET = new Set(LANDSCAPE_DATA.map(l => l.slug))
const PRACTICAL_SLUGS_SET = new Set(PRACTICAL_DATA.map(p => p.slug))

const ALL_SLUG_NAMES = Object.fromEntries([
  ...INTENT_DATA,
  ...LANDSCAPE_DATA,
  ...PRACTICAL_DATA,
].map(c => [c.slug, c.name]))

const slugToName = (slug: string) =>
  ALL_SLUG_NAMES[slug] ?? slug.replace(/-/g, ' ')

/* ── Taxonomy panel (replaces CategoryPanel) ─────────────────── */
function TaxonomyPanel({
  homestayId,
  initialSlugs,
  onClose,
  onSaved,
}: {
  homestayId:   string
  initialSlugs: string[]
  onClose:      () => void
  onSaved:      () => void
}) {
  const [intentSlug,    setIntentSlug]    = useState<string | null>(
    initialSlugs.find(s => INTENT_SLUGS_SET.has(s)) ?? null
  )
  const [landscapeSlugs, setLandscapeSlugs] = useState<string[]>(
    initialSlugs.filter(s => LANDSCAPE_SLUGS_SET.has(s))
  )
  const [practicalSlugs, setPracticalSlugs] = useState<string[]>(
    initialSlugs.filter(s => PRACTICAL_SLUGS_SET.has(s))
  )
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function toggleLandscape(slug: string) {
    setLandscapeSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
    setSaved(false)
  }

  function togglePractical(slug: string) {
    setPracticalSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const selected = [
      ...(intentSlug ? [intentSlug] : []),
      ...landscapeSlugs,
      ...practicalSlugs,
    ]
    const result = await saveCategories(homestayId, selected)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => onSaved(), 900)
    }
  }

  const totalSelected =
    (intentSlug ? 1 : 0) + landscapeSlugs.length + practicalSlugs.length

  return (
    <div className="col-span-full px-5 py-4 bg-stone-50 border-t border-stone-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Assign Taxonomy</p>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
          <X size={14} />
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-4">
        {/* Layer 1: Travel Intent (single select) */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
            Layer 1 · Travel Intent
          </p>
          <div className="space-y-1.5">
            {INTENT_DATA.map(intent => (
              <label key={intent.slug} className="flex items-center gap-2 cursor-pointer group/r">
                <input
                  type="radio"
                  name={`intent-${homestayId}`}
                  value={intent.slug}
                  checked={intentSlug === intent.slug}
                  onChange={() => { setIntentSlug(intent.slug); setSaved(false) }}
                  className="w-3.5 h-3.5 border-stone-300 accent-brand-600 cursor-pointer"
                />
                <span className="text-xs text-stone-600 group-hover/r:text-stone-900 transition-colors">
                  {intent.name}
                </span>
              </label>
            ))}
            {intentSlug && (
              <button
                type="button"
                onClick={() => { setIntentSlug(null); setSaved(false) }}
                className="text-[10px] text-stone-400 hover:text-rose-500 transition-colors mt-0.5"
              >
                Clear intent
              </button>
            )}
          </div>
        </div>

        {/* Layer 2: Landscape (multi-select) */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
            Layer 2 · Landscape
          </p>
          <div className="space-y-1.5">
            {LANDSCAPE_DATA.map(l => (
              <label key={l.slug} className="flex items-center gap-2 cursor-pointer group/c">
                <input
                  type="checkbox"
                  checked={landscapeSlugs.includes(l.slug)}
                  onChange={() => toggleLandscape(l.slug)}
                  className="w-3.5 h-3.5 rounded border-stone-300 accent-brand-600 cursor-pointer"
                />
                <span className="text-xs text-stone-600 group-hover/c:text-stone-900 transition-colors">
                  {l.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Layer 3: Practical Requirements (multi-select) */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
            Layer 3 · Practical Requirements
          </p>
          <div className="space-y-1.5">
            {PRACTICAL_DATA.map(p => (
              <label key={p.slug} className="flex items-center gap-2 cursor-pointer group/p">
                <input
                  type="checkbox"
                  checked={practicalSlugs.includes(p.slug)}
                  onChange={() => togglePractical(p.slug)}
                  className="w-3.5 h-3.5 rounded border-stone-300 accent-brand-600 cursor-pointer"
                />
                <span className="text-xs text-stone-600 group-hover/p:text-stone-900 transition-colors">
                  {p.name}
                </span>
              </label>
            ))}
          </div>
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
  const [search,     setSearch]     = useState('')
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [confirmId,  setConfirmId]  = useState<string | null>(null)
  const [deleteErr,  setDeleteErr]  = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
                      {/* Category tags */}
                      {h.category_slugs.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {h.category_slugs.slice(0, 3).map(slug => (
                            <span key={slug} className="text-[9px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full font-medium border border-brand-100">
                              {slugToName(slug)}
                            </span>
                          ))}
                          {h.category_slugs.length > 3 && (
                            <span className="text-[9px] text-stone-400">+{h.category_slugs.length - 3} more</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[9px] text-stone-300 mt-0.5">No categories</p>
                      )}
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
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${
                      h.has_location ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
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
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5">
                        <span className="text-xs text-rose-700 font-medium">Delete?</span>
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
                        {/* Categories */}
                        <button
                          onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                          title={h.category_slugs.length > 0 ? `Edit ${h.category_slugs.length} tags` : 'Assign Taxonomy'}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                            expandedId === h.id
                              ? 'bg-brand-100 text-brand-600'
                              : h.category_slugs.length > 0
                              ? 'bg-brand-50 text-brand-500 hover:bg-brand-100 hover:text-brand-700'
                              : 'text-stone-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Tag size={14} />
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
                          title="Delete"
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
                    onClose={() => setExpandedId(null)}
                    onSaved={() => { setExpandedId(null); router.refresh() }}
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

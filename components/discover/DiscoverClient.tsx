'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp, Check } from 'lucide-react'
import TravelIntentFilter from './TravelIntentFilter'
import LandscapeFilterRail from './LandscapeFilterRail'
import PracticalFiltersDrawer from './PracticalFiltersDrawer'
import PlaceGrid from './PlaceGrid'
import { SketchIcon } from './icons'
import { TRAVEL_INTENTS, LANDSCAPES } from './mockData'
import { EMPTY_PRACTICAL_FILTERS, type TravelIntent, type Landscape, type PracticalFilters } from './types'
import type { HomestayWithCategories } from '@/types/blocks.types'

const PRACTICAL_ITEMS = [
  { slug: 'spec_stable_network',       name: 'Stable Network'        },
  { slug: 'spec_gated_parking',        name: 'Gated Parking'         },
  { slug: 'spec_basic_toolkit',        name: 'Basic Toolkit'         },
  { slug: 'spec_pet_friendly',         name: 'Pet-Friendly'          },
  { slug: 'spec_wildlife_secure',      name: 'Wildlife-Proof Safety' },
  { slug: 'spec_shared_kitchen',       name: 'Shared Kitchen'        },
  { slug: 'spec_power_backup',         name: 'Power Backup'          },
  { slug: 'spec_laundry_access',       name: 'Laundry Access'        },
  { slug: 'spec_native_guide',         name: 'Native Guide'          },
  { slug: 'spec_plastic_free',         name: 'Plastic-Free Stay'     },
  { slug: 'spec_western_toilet',       name: 'Western Toilet'        },
  { slug: 'spec_hot_water',            name: 'Hot Water / Geyser'    },
  { slug: 'spec_no_stairs_access',     name: 'No-Stairs Access'      },
  { slug: 'spec_quiet_work_setup',     name: 'Quiet Work Setup'      },
  { slug: 'spec_solo_female_friendly', name: 'Solo-Female Friendly'  },
]

const DiscoverMap = dynamic(() => import('./DiscoverMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-stone-100 flex items-center justify-center">
      <span className="text-sm text-stone-400">Loading map…</span>
    </div>
  ),
})

interface Props {
  homestays: HomestayWithCategories[]
}

export default function DiscoverClient({ homestays }: Props) {
  const [selectedIntent, setSelectedIntent]       = useState<TravelIntent | null>(null)
  const [selectedLandscapes, setSelectedLandscapes] = useState<Landscape[]>([])
  const [practicalFilters, setPracticalFilters]   = useState<PracticalFilters>(EMPTY_PRACTICAL_FILTERS)
  const [highlightedId, setHighlightedId]         = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  function toggleLandscape(landscape: Landscape) {
    setSelectedLandscapes((prev) =>
      prev.some((l) => l.id === landscape.id)
        ? prev.filter((l) => l.id !== landscape.id)
        : [...prev, landscape]
    )
  }

  function togglePractical(slug: string) {
    setPracticalFilters((prev) => ({
      ...prev,
      practicalSlugs: prev.practicalSlugs.includes(slug)
        ? prev.practicalSlugs.filter((s) => s !== slug)
        : [...prev.practicalSlugs, slug],
    }))
  }

  function toggleLanguage(lang: string) {
    setPracticalFilters((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }))
  }

  const availableLanguages = useMemo(
    () => Array.from(new Set(homestays.flatMap((h) => h.languages_spoken))).sort(),
    [homestays]
  )

  const filtered = useMemo(() => {
    return homestays.filter((h) => {
      const catSlugs = h.categories.map((c) => c.slug)
      if (selectedIntent && !catSlugs.includes(selectedIntent.slug)) return false
      if (selectedLandscapes.length > 0 && !selectedLandscapes.some((l) => catSlugs.includes(l.slug))) return false
      if (practicalFilters.practicalSlugs.length > 0 && !practicalFilters.practicalSlugs.some((s) => catSlugs.includes(s))) return false
      if (practicalFilters.verifiedOnly && !h.is_verified) return false
      if (practicalFilters.languages.length > 0 && !practicalFilters.languages.some((l) => h.languages_spoken.includes(l))) return false
      return true
    })
  }, [homestays, selectedIntent, selectedLandscapes, practicalFilters])

  const locationLabel = useMemo(() => {
    if (filtered.length === 0) return undefined
    const counts: Record<string, number> = {}
    filtered.forEach((h) => { if (h.location_district) counts[h.location_district] = (counts[h.location_district] ?? 0) + 1 })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? `${top[0]} district` : undefined
  }, [filtered])

  const totalActiveFilters =
    (selectedIntent ? 1 : 0) +
    selectedLandscapes.length +
    (practicalFilters.verifiedOnly ? 1 : 0) +
    practicalFilters.languages.length +
    practicalFilters.practicalSlugs.length

  return (
    <div className="flex flex-col bg-white md:overflow-hidden md:h-[calc(100dvh-64px)]">

      {/* ── Desktop filter bars (Layer 1 + 2) ── */}
      <div className="hidden md:block shrink-0 bg-white relative z-[500]">
        <TravelIntentFilter
          intents={TRAVEL_INTENTS}
          selected={selectedIntent}
          onSelect={setSelectedIntent}
        />
        <LandscapeFilterRail
          landscapes={LANDSCAPES}
          selected={selectedLandscapes}
          onToggle={toggleLandscape}
        />
      </div>

      {/* ── Mobile single filter bar ── */}
      <div className="md:hidden shrink-0 bg-white relative z-[500]">
        {/* Bar */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-stone-100">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-900 leading-none">
              {filtered.length} {filtered.length === 1 ? 'stay' : 'stays'} found
            </p>
            {locationLabel && (
              <p className="text-xs text-stone-400 mt-0.5 leading-none truncate">
                Showing stays in {locationLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((o) => !o)}
            className={`inline-flex items-center gap-1.5 text-sm font-medium border rounded-full px-3.5 py-1.5 transition-colors shrink-0 ${
              totalActiveFilters > 0 || mobileFiltersOpen
                ? 'bg-brand-700 border-brand-700 text-white'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
            }`}
          >
            {!mobileFiltersOpen && <SlidersHorizontal size={13} />}
            {mobileFiltersOpen ? 'Done' : 'Filters'}
            {totalActiveFilters > 0 && !mobileFiltersOpen && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-brand-700 text-[10px] font-bold">
                {totalActiveFilters}
              </span>
            )}
            {mobileFiltersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Expanded mobile filter panel */}
        {mobileFiltersOpen && (
          <div className="px-4 py-3 border-b border-stone-100 space-y-4 bg-white">

            {/* Layer 1: Intent */}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Why are you travelling?</p>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_INTENTS.map((intent) => {
                  const isSelected = selectedIntent?.id === intent.id
                  return (
                    <button
                      key={intent.id}
                      type="button"
                      onClick={() => setSelectedIntent(isSelected ? null : intent)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                        isSelected ? 'bg-brand-700 border-brand-700 text-white' : 'bg-white border-stone-300 text-stone-700'
                      }`}
                    >
                      <SketchIcon slug={intent.slug} className={`w-[18px] h-[18px] shrink-0 ${isSelected ? 'text-white' : 'text-brand-700'}`} />
                      {intent.name}
                      {isSelected && <Check size={13} strokeWidth={2.5} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Layer 2: Landscape */}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Landscape</p>
              <div className="flex flex-wrap gap-2">
                {LANDSCAPES.map((landscape) => {
                  const isSelected = selectedLandscapes.some((l) => l.id === landscape.id)
                  return (
                    <button
                      key={landscape.id}
                      type="button"
                      onClick={() => toggleLandscape(landscape)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium shrink-0 whitespace-nowrap transition-all ${
                        isSelected ? 'bg-brand-700 border-brand-700 text-white' : 'bg-white border-stone-200 text-stone-600'
                      }`}
                    >
                      <SketchIcon slug={landscape.slug} className={`w-[18px] h-[18px] shrink-0 ${isSelected ? 'text-white' : 'text-brand-800'}`} />
                      {landscape.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Layer 3: Requirements */}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Requirements</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {PRACTICAL_ITEMS.map((item) => (
                  <label key={item.slug} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={practicalFilters.practicalSlugs.includes(item.slug)}
                      onChange={() => togglePractical(item.slug)}
                      className="w-3.5 h-3.5 accent-brand-700"
                    />
                    <span className="text-xs text-stone-600">{item.name}</span>
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={practicalFilters.verifiedOnly}
                  onChange={(e) => setPracticalFilters((p) => ({ ...p, verifiedOnly: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-brand-700"
                />
                <span className="text-xs text-stone-600">Verified hosts only</span>
              </label>
              {availableLanguages.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-stone-400">Languages spoken</p>
                    {totalActiveFilters > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIntent(null)
                          setSelectedLandscapes([])
                          setPracticalFilters(EMPTY_PRACTICAL_FILTERS)
                        }}
                        className="text-xs text-brand-600 font-medium hover:text-brand-800 transition-colors"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          practicalFilters.languages.includes(lang)
                            ? 'bg-brand-700 border-brand-700 text-white'
                            : 'bg-white border-stone-200 text-stone-600'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Split: mobile=column (cards then map), desktop=row (60/40) ── */}
      <div className="flex flex-1 md:overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:overflow-hidden">

          {/* List panel */}
          <div className="w-full md:w-3/5 flex flex-col md:border-r border-stone-100 md:shrink-0">
            {/* Layer 3 desktop only */}
            <div className="hidden md:block shrink-0 relative z-[500]">
              <PracticalFiltersDrawer
                filters={practicalFilters}
                availableLanguages={availableLanguages}
                onChange={setPracticalFilters}
                filteredCount={filtered.length}
                locationLabel={locationLabel}
                totalActiveFilters={totalActiveFilters}
                onReset={() => {
                  setSelectedIntent(null)
                  setSelectedLandscapes([])
                  setPracticalFilters(EMPTY_PRACTICAL_FILTERS)
                }}
              />
            </div>
            <div className="md:flex-1 md:overflow-y-auto">
              <PlaceGrid
                homestays={filtered}
                highlightedId={highlightedId}
                onHover={setHighlightedId}
              />
            </div>
          </div>

          {/* Map panel */}
          <div className="w-full h-[300px] p-3 md:h-auto md:w-2/5 md:p-3 md:shrink-0">
            <div className="h-full rounded-xl overflow-hidden">
              <DiscoverMap
                homestays={filtered}
                highlightedId={highlightedId}
                onMarkerClick={setHighlightedId}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import type L from 'leaflet'
import { SlidersHorizontal, ChevronDown, ChevronUp, MapPin, Home, Compass, Sparkles, Star, X, Waves, Mountain, TreePine, Sun, Wind, Droplets, Bird, Clock, Car, Anchor, Leaf } from 'lucide-react'
import PracticalFiltersDrawer from './PracticalFiltersDrawer'
import PlaceGrid from './PlaceGrid'
import { EMPTY_PRACTICAL_FILTERS, type PracticalFilters } from './types'
import type { HomestayWithCategories } from '@/types/blocks.types'
import { createClient } from '@/lib/supabase/client'

interface MapBounds { south: number; north: number; west: number; east: number }

const INDIA = { south: 8.0, north: 37.5, west: 68.0, east: 97.5 }

type SubCat = { label: string; img: string; alt: string; icon: React.ElementType; intentSlug?: string; landscapeSlugs?: string[] }
type MainCat = { key: string; label: string; icon: React.ElementType; img: string; alt: string; subCats: SubCat[] }

const CATEGORIES: MainCat[] = [
  {
    key: 'place',
    label: 'By the Place',
    icon: MapPin,
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=70',
    alt: 'Coastal place',
    subCats: [
      { label: 'By the Sea',       icon: Waves,    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70', alt: 'Sea',    landscapeSlugs: ['env_coastal'] },
      { label: 'Beside the Water', icon: Droplets, img: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&q=70', alt: 'River',  landscapeSlugs: ['env_riverside'] },
      { label: 'In the Hills',     icon: Mountain, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70', alt: 'Hills',  landscapeSlugs: ['env_mountain_valley'] },
      { label: 'In the Forest',    icon: TreePine, img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=70', alt: 'Forest', landscapeSlugs: ['env_forest_border'] },
      { label: 'On the Farm',      icon: Sun,      img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=70', alt: 'Farm',   landscapeSlugs: ['env_agricultural'] },
      { label: 'Away from It All', icon: Wind,     img: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=70', alt: 'Wild',   landscapeSlugs: ['env_rocky_plateau', 'env_sacred_grove', 'env_wetland'] },
    ],
  },
  {
    key: 'home',
    label: 'By the Home',
    icon: Home,
    img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=70',
    alt: 'Family home',
    subCats: [
      { label: 'Nature & Wildlife', icon: Bird,    img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70', alt: 'Nature', intentSlug: 'nature_habitat' },
      { label: 'Rural Immersion',   icon: Home,    img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=70', alt: 'Rural',  intentSlug: 'rural_immersion' },
      { label: 'Long Stays',        icon: Clock,   img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=70', alt: 'Long',   intentSlug: 'long_stay_retreat' },
      { label: 'Road Stops',        icon: Car,     img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70', alt: 'Road',   intentSlug: 'transit_pitstop' },
    ],
  },
  {
    key: 'trip',
    label: 'By the Trip',
    icon: Compass,
    img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=70',
    alt: 'Travel and trip',
    subCats: [
      { label: 'Nature & Wildlife', icon: Bird,    img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=70', alt: 'Nature', intentSlug: 'nature_habitat' },
      { label: 'Rural Immersion',   icon: Home,    img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=70', alt: 'Rural',  intentSlug: 'rural_immersion' },
      { label: 'Long Stays',        icon: Clock,   img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=70', alt: 'Long',   intentSlug: 'long_stay_retreat' },
      { label: 'Road Stops',        icon: Car,     img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70', alt: 'Road',   intentSlug: 'transit_pitstop' },
    ],
  },
  {
    key: 'experience',
    label: 'By the Experience',
    icon: Sparkles,
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70',
    alt: 'Local experience',
    subCats: [
      { label: 'Forest Stays',     icon: TreePine, img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=70', alt: 'Forest',  landscapeSlugs: ['env_forest_border'] },
      { label: 'Riverside',        icon: Waves,    img: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&q=70', alt: 'River',   landscapeSlugs: ['env_riverside'] },
      { label: 'Coastal Villages', icon: Anchor,   img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70', alt: 'Coast',   landscapeSlugs: ['env_coastal'] },
      { label: 'Sacred Groves',    icon: Leaf,     img: 'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=400&q=70', alt: 'Sacred',  landscapeSlugs: ['env_sacred_grove'] },
    ],
  },
  {
    key: 'new',
    label: 'Recently Added',
    icon: Star,
    img: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=70',
    alt: 'Newly added homestays',
    subCats: [],
  },
]

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
  initialIntentSlug?: string
  initialCatKey?: string
}

export default function DiscoverClient({ initialIntentSlug: _, initialCatKey }: Props) {
  const supabase = useMemo(() => createClient(), [])

  // ── Category drill-down state ────────────────────────────────────
  const [selectedCatKey, setSelectedCatKey] = useState<string | null>(initialCatKey ?? null)
  const [selectedSubCat, setSelectedSubCat] = useState<SubCat | null>(null)

  // ── Practical filters ────────────────────────────────────────────
  const [practicalFilters, setPracticalFilters] = useState<PracticalFilters>(EMPTY_PRACTICAL_FILTERS)
  const [mapBounds, setMapBounds]               = useState<MapBounds | null>(null)

  // ── UI state ─────────────────────────────────────────────────────
  const [highlightedId,    setHighlightedId]    = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // ── Data state ───────────────────────────────────────────────────
  const [homestays,          setHomestays]          = useState<HomestayWithCategories[]>([])
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])
  const [isLoading,          setIsLoading]          = useState(true)

  const splitRef    = useRef<HTMLDivElement>(null)
  const selectedCat = CATEGORIES.find(c => c.key === selectedCatKey) ?? null

  // ── Handlers ─────────────────────────────────────────────────────
  const handleBoundsChange = useCallback((bounds: L.LatLngBounds) => {
    const next: MapBounds = {
      south: bounds.getSouth(), north: bounds.getNorth(),
      west:  bounds.getWest(),  east:  bounds.getEast(),
    }
    setMapBounds((prev) => {
      if (
        prev &&
        Math.abs(prev.south - next.south) < 0.0001 &&
        Math.abs(prev.north - next.north) < 0.0001 &&
        Math.abs(prev.west  - next.west)  < 0.0001 &&
        Math.abs(prev.east  - next.east)  < 0.0001
      ) return prev
      return next
    })
  }, [])

  function togglePractical(slug: string) {
    setPracticalFilters(prev => ({
      ...prev,
      practicalSlugs: prev.practicalSlugs.includes(slug)
        ? prev.practicalSlugs.filter(s => s !== slug)
        : [...prev.practicalSlugs, slug],
    }))
  }

  function toggleLanguage(lang: string) {
    setPracticalFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }))
  }

  function handleCatClick(cat: MainCat) {
    if (selectedCatKey === cat.key) {
      setSelectedCatKey(null)
      setSelectedSubCat(null)
      return
    }
    setSelectedCatKey(cat.key)
    setSelectedSubCat(null)
  }

  function handleSubCatClick(sub: SubCat) {
    setSelectedSubCat(sub)
    setTimeout(() => splitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function resetAll() {
    setSelectedCatKey(null)
    setSelectedSubCat(null)
    setPracticalFilters(EMPTY_PRACTICAL_FILTERS)
  }

  // ── Effect: fetch available languages ────────────────────────────
  useEffect(() => {
    supabase
      .from('homestays')
      .select('languages_spoken')
      .neq('latitude', 0)
      .then(({ data }) => {
        if (data) {
          const langs = Array.from(
            new Set(data.flatMap((h: any) => h.languages_spoken ?? []))
          ).sort() as string[]
          setAvailableLanguages(langs)
        }
      })
  }, [])

  // ── Effect: fetch homestays whenever filters / bounds change ─────
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    const timer = setTimeout(async () => {
      const south = mapBounds?.south ?? INDIA.south
      const north = mapBounds?.north ?? INDIA.north
      const west  = mapBounds?.west  ?? INDIA.west
      const east  = mapBounds?.east  ?? INDIA.east

      const { data, error } = await supabase.rpc('filter_homestays_spatial', {
        min_lat:         south,
        max_lat:         north,
        min_lng:         west,
        max_lng:         east,
        intent_slug:     selectedSubCat?.intentSlug     ?? null,
        landscape_slugs: selectedSubCat?.landscapeSlugs ?? [],
        practical_slugs: practicalFilters.practicalSlugs,
      })

      if (cancelled) return
      if (error) { setIsLoading(false); return }

      let results: any[] = data ?? []
      results = results.filter(h => h.latitude !== 0 || h.longitude !== 0)
      if (practicalFilters.verifiedOnly) results = results.filter(h => h.is_verified)
      if (practicalFilters.languages.length > 0) {
        results = results.filter(h =>
          practicalFilters.languages.some(l => (h.languages_spoken ?? []).includes(l))
        )
      }

      setHomestays(results.map(h => ({
        id:                h.id,
        title:             h.title,
        slug:              h.slug,
        location_district: h.location_district,
        village_name:      h.village_name,
        host_name:         h.host_name,
        is_verified:       h.is_verified,
        latitude:          h.latitude,
        longitude:         h.longitude,
        calling_window:    h.calling_window,
        languages_spoken:  h.languages_spoken ?? [],
        categories:        [],
        cover_image_url:   h.cover_image_url ?? null,
      })))
      setIsLoading(false)
    }, 300)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [selectedSubCat, practicalFilters, mapBounds])

  // ── Derived values ───────────────────────────────────────────────
  const locationLabel = useMemo(() => {
    if (homestays.length === 0) return undefined
    const counts: Record<string, number> = {}
    homestays.forEach(h => {
      if (h.location_district) counts[h.location_district] = (counts[h.location_district] ?? 0) + 1
    })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? `${top[0]} district` : undefined
  }, [homestays])

  const totalActiveFilters =
    (selectedSubCat ? 1 : 0) +
    (practicalFilters.verifiedOnly ? 1 : 0) +
    practicalFilters.languages.length +
    practicalFilters.practicalSlugs.length

  return (
    <div className="flex flex-col bg-white">

      {/* ── Category drill-down ── */}
      <div className="bg-[#f8f7f2] px-4 sm:px-6 py-6 border-b border-stone-200">
        <div className="max-w-7xl mx-auto">

          {/* Main category cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCatClick(cat)}
                className={`group relative rounded-xl overflow-hidden aspect-[3/2] text-left transition-all duration-200 ${
                  i === 4 ? 'col-span-2 sm:col-span-1' : ''
                } ${selectedCatKey === cat.key ? 'ring-2 ring-brand-600 ring-offset-2' : ''}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.alt}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/65" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                  <cat.icon size={30} className="text-white/90 drop-shadow-md" />
                  <span className="text-white font-semibold text-sm leading-tight text-center px-2">{cat.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Sub-category expansion */}
          {selectedCat && selectedCat.subCats.length > 0 && (
            <div className="mt-5 pt-5 border-t border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  {selectedCat.label}
                </p>
                <button
                  type="button"
                  onClick={() => { setSelectedCatKey(null); setSelectedSubCat(null) }}
                  className="text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {selectedCat.subCats.map((sub) => (
                  <button
                    key={sub.label}
                    type="button"
                    onClick={() => handleSubCatClick(sub)}
                    className={`group relative rounded-xl overflow-hidden aspect-[3/2] text-left transition-all duration-200 ${
                      selectedSubCat?.label === sub.label ? 'ring-2 ring-brand-600 ring-offset-1' : ''
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sub.img}
                      alt={sub.alt}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/70" />
                    <div className="absolute inset-0 flex items-center justify-center pb-5">
                      <sub.icon size={28} className="text-white/90 drop-shadow-md" />
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 p-2.5 text-white font-semibold text-xs leading-tight text-center">
                      {sub.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Mobile filter bar ── */}
      <div className="md:hidden shrink-0 bg-white relative z-[500]">
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-stone-100">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-900 leading-none">
              {isLoading ? 'Searching…' : `${homestays.length} ${homestays.length === 1 ? 'stay' : 'stays'} found`}
            </p>
            {!isLoading && locationLabel && (
              <p className="text-xs text-stone-400 mt-0.5 leading-none truncate">
                Showing stays in {locationLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(o => !o)}
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

        {mobileFiltersOpen && (
          <div className="px-4 py-3 border-b border-stone-100 space-y-4 bg-white">
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Requirements</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {PRACTICAL_ITEMS.map(item => (
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
                  onChange={e => setPracticalFilters(p => ({ ...p, verifiedOnly: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-brand-700"
                />
                <span className="text-xs text-stone-600">Verified hosts only</span>
              </label>
              {availableLanguages.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-stone-400 mb-1.5">Languages spoken</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableLanguages.map(lang => (
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
              {totalActiveFilters > 0 && (
                <button type="button" onClick={resetAll} className="mt-3 text-xs text-brand-600 font-medium">
                  Reset all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop: practical filters drawer ── */}
      <div className="hidden md:block shrink-0 bg-white relative z-[500]">
        <PracticalFiltersDrawer
          filters={practicalFilters}
          availableLanguages={availableLanguages}
          onChange={setPracticalFilters}
          filteredCount={homestays.length}
          locationLabel={locationLabel}
          totalActiveFilters={totalActiveFilters}
          onReset={resetAll}
        />
      </div>

      {/* ── Split view: cards left, map right ── */}
      <div ref={splitRef} className="max-w-7xl mx-auto w-full flex flex-col md:flex-row">

        <div className="w-full md:w-3/5 flex flex-col md:border-r border-stone-100 order-2 md:order-1">
          <PlaceGrid
            homestays={homestays}
            highlightedId={highlightedId}
            onHover={setHighlightedId}
            isLoading={isLoading}
          />
        </div>

        <div className="w-full h-[300px] p-3 md:w-2/5 md:h-[520px] md:shrink-0 order-1 md:order-2">
          <div className="h-full rounded-xl overflow-hidden">
            <DiscoverMap
              homestays={homestays}
              highlightedId={highlightedId}
              onMarkerClick={setHighlightedId}
              onBoundsChange={handleBoundsChange}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

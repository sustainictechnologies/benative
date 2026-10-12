'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import type L from 'leaflet'
import {
  SlidersHorizontal, ChevronDown, ChevronUp, MapPin, Home, Compass, Sparkles, X,
  Waves, Droplets, Mountain, TreePine, Wheat, Wind,
  Users, Tractor, Landmark, Leaf, Fence,
  Snail, CalendarDays, Clock, Baby, Car, User, Laptop,
  Utensils, Sunrise, BookOpen, WifiOff, HeartHandshake, Armchair,
} from 'lucide-react'
import PracticalFiltersDrawer from './PracticalFiltersDrawer'
import PlaceGrid from './PlaceGrid'
import { EMPTY_PRACTICAL_FILTERS, type PracticalFilters } from './types'
import type { HomestayWithCategories } from '@/types/blocks.types'
import { createClient } from '@/lib/supabase/client'
import { SUB_CATEGORY_GROUPS, type SubCategory } from '@/lib/subCategories'

interface MapBounds { south: number; north: number; west: number; east: number }

const INDIA = { south: 8.0, north: 37.5, west: 68.0, east: 97.5 }

// The names and keys come from the shared list; this file adds how each one looks
type Visual  = { icon: React.ElementType; img: string; alt: string }
type SubCat  = SubCategory & Visual
type MainCat = { key: string; label: string; subtitle: string; subCats: SubCat[] } & Visual

// Indian stock photos, one per sub-category, until an image is uploaded to its slot (sub_<key>) in the admin panel
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&q=70`
const NATURE = photo('1441974231531-c6227db76b6e')

const MAIN_VISUALS: Record<string, Visual & { subtitle: string }> = {
  place: {
    subtitle: 'Find homestays in the setting that feels right for you.',
    icon: MapPin,
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=70',
    alt: 'Coastal place',
  },
  home: {
    subtitle: 'Choose a home that matches the way you like to stay.',
    icon: Home,
    img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=70',
    alt: 'Family home',
  },
  trip: {
    subtitle: 'Find the right stay for the kind of trip you\'re on.',
    icon: Compass,
    img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=70',
    alt: 'Travel and trip',
  },
  experience: {
    subtitle: 'Stay somewhere that gives you a story to tell.',
    icon: Sparkles,
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70',
    alt: 'Local experience',
  },
}

const SUB_VISUALS: Record<string, Visual> = {
  by_the_sea:         { icon: Waves,    img: photo('1593359652766-b77c5795bd65'), alt: 'Palm-lined beach' },
  beside_the_water:   { icon: Droplets, img: photo('1678780910715-9592ca6d2098'), alt: 'House beside a palm-lined lake' },
  in_the_hills:       { icon: Mountain, img: photo('1711192702535-eac61a78ecb0'), alt: 'Tea gardens in the hills' },
  among_the_green:    { icon: TreePine, img: photo('1734373810472-4c246b1ea5b9'), alt: 'Misty forest road' },
  in_the_countryside: { icon: Wheat,    img: photo('1694011772133-dc4b3ff3f24f'), alt: 'Paddy fields and coconut palms' },
  away_from_it_all:   { icon: Wind,     img: photo('1617159156637-dfb8655c9f95'), alt: 'Remote mountain village' },

  family_homes:     { icon: Users,    img: photo('1642667670006-6b3059ccf96d'), alt: 'Family house with a flowering garden' },
  farm_stays:       { icon: Tractor,  img: photo('1620901433789-1d2f85a93653'), alt: 'Farmer ploughing with oxen' },
  heritage_homes:   { icon: Landmark, img: photo('1682414180825-c0df1934387f'), alt: 'Old haveli entrance' },
  village_homes:    { icon: Home,     img: photo('1643474003587-8bbf4bbc01d9'), alt: 'Mud house with a tiled roof' },
  eco_nature_homes: { icon: Leaf,     img: photo('1785407446300-3d89e2158956'), alt: 'Tiled-roof home among trees' },
  homesteads:       { icon: Fence,    img: photo('1672579738105-227fa89d0527'), alt: 'Tiled-roof homestead on a green lawn' },

  slow_escapes:             { icon: Snail,        img: photo('1506461883276-594a12b11cf3'), alt: 'Boat on the backwaters' },
  weekend_getaways:         { icon: CalendarDays, img: photo('1579609424835-16beba97e3c2'), alt: 'River valley seen from the hills' },
  long_stays:               { icon: Clock,        img: photo('1647771167457-c82f4850bb7e'), alt: 'Cottage with a shaded porch' },
  family_time:              { icon: Baby,         img: photo('1687660187066-dc7e95eb3c5e'), alt: 'Family sitting on a rock at dusk' },
  transit_stays:            { icon: Car,          img: photo('1596829568009-bc436aac1b63'), alt: 'Highway through green hills' },
  solo_stays:               { icon: User,         img: photo('1774539570465-8c389151758a'), alt: 'Hiker looking over a green valley' },
  work_from_somewhere_else: { icon: Laptop,       img: photo('1632229910777-131718197ea7'), alt: 'Laptop on a table facing green hills' },

  eat_like_a_local:      { icon: Utensils,       img: photo('1788619378696-c77352c43a88'), alt: 'Meal served on a banana leaf' },
  wake_up_in_nature:     { icon: Sunrise,        img: photo('1707111762867-a88c90b7d9fa'), alt: 'Sunrise over the hills' },
  learn_something_new:   { icon: BookOpen,       img: photo('1613833684971-9411a2b00970'), alt: 'Hands shaping a clay pot' },
  go_offline:            { icon: WifiOff,        img: photo('1663745430674-180c6858f46c'), alt: 'Green cliffs and a deep valley' },
  meet_the_people:       { icon: HeartHandshake, img: photo('1601689892697-b64daa00ff6d'), alt: 'Villagers gathered outside a home' },
  do_absolutely_nothing: { icon: Armchair,       img: photo('1643474004450-78bac5b408e0'), alt: 'Cat resting under a charpai' },
}

// A category or sub-category added to the shared list shows with this until it is given its own look
const DEFAULT_VISUAL: Visual = { icon: Sparkles, img: NATURE, alt: 'Homestay' }

const CATEGORIES: MainCat[] = SUB_CATEGORY_GROUPS.map(group => ({
  key:     group.key,
  label:   group.label,
  ...(MAIN_VISUALS[group.key] ?? { ...DEFAULT_VISUAL, subtitle: '' }),
  subCats: group.subCategories.map(sub => ({ ...sub, ...(SUB_VISUALS[sub.key] ?? DEFAULT_VISUAL) })),
}))

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
  imageMap?: Record<string, string>
}

export default function DiscoverClient({ initialIntentSlug: _, initialCatKey, imageMap = {} }: Props) {
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

      // Sub-categories come from homestays.sub_categories (see supabase/discover_sub_categories.sql)
      const { data, error } = await supabase.rpc('discover_homestays', {
        min_lat:         south,
        max_lat:         north,
        min_lng:         west,
        max_lng:         east,
        sub_category:    selectedSubCat?.key ?? null,
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
      {!selectedCat ? (
        /* No category selected — show cards grid */
        <div className="bg-[#f8f7f2] px-4 sm:px-6 py-6 border-b border-stone-200">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCatClick(cat)}
                  className="group relative rounded-xl overflow-hidden aspect-[3/2] text-left transition-all duration-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageMap[`cat_${cat.key}`] ?? cat.img}
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
          </div>
        </div>
      ) : (
        /* Category selected — its card grows in place, the others stay beside it */
        <div className="border-b border-stone-200">
          <div className="bg-[#f8f7f2] px-4 sm:px-6 py-6">
            <div className="max-w-7xl mx-auto">

              {/* Category switcher. On a phone the selected card takes the full first row. */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 mb-6">
                {CATEGORIES.map((cat) => {
                  const isSelected = cat.key === selectedCat.key
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => { if (!isSelected) handleCatClick(cat) }}
                      className={`group relative min-w-0 rounded-xl overflow-hidden text-left transition-[flex-grow] duration-500 ease-out motion-reduce:transition-none ${
                        isSelected
                          ? 'order-first sm:order-none basis-full sm:flex-[3] h-44 sm:h-52 lg:h-60 cursor-default ring-2 ring-brand-700 ring-offset-2 ring-offset-[#f8f7f2]'
                          : 'flex-1 h-24 sm:h-52 lg:h-60'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageMap[`cat_${cat.key}`] ?? cat.img}
                        alt={cat.alt}
                        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
                          isSelected ? '' : 'group-hover:scale-[1.03]'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/65" />
                      {isSelected ? (
                        <span className="absolute inset-0 flex flex-col justify-end px-5 sm:px-8 pb-5 sm:pb-7">
                          <span className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
                            Explore by Category
                          </span>
                          <span className="text-white text-2xl sm:text-3xl font-bold leading-tight mb-1">
                            {cat.label}
                          </span>
                          <span className="text-white/80 text-sm sm:text-base">
                            {cat.subtitle}
                          </span>
                        </span>
                      ) : (
                        <span className="absolute inset-0 flex flex-col items-center justify-center sm:justify-end gap-1.5 sm:gap-2.5 px-2 sm:pb-7">
                          <cat.icon size={26} className="text-white/90 drop-shadow-md" />
                          <span className="text-white font-semibold text-xs sm:text-sm leading-tight text-center">
                            {cat.label}
                          </span>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedCat.subCats.length > 0 && (
                <>
                  <p className="text-sm font-bold text-stone-700 mb-4">Sub-categories</p>
                  {/* On desktop all of a category's sub-categories share one row, six or seven */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-none lg:grid-flow-col lg:auto-cols-fr gap-3">
                    {selectedCat.subCats.map((sub) => (
                      <button
                        key={sub.key}
                        type="button"
                        onClick={() => handleSubCatClick(sub)}
                        className={`group relative rounded-xl overflow-hidden aspect-[3/2] text-left transition-all duration-200 ${
                          selectedSubCat?.key === sub.key ? 'ring-2 ring-brand-600 ring-offset-1' : ''
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageMap[`sub_${sub.key}`] ?? sub.img}
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
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
            {...(selectedSubCat && totalActiveFilters === 1 && {
              emptyTitle: `No stays in ${selectedSubCat.label} yet.`,
              emptyHint:  'Homestays are still being added to this collection. Try another sub-category.',
            })}
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

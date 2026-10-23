'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import type L from 'leaflet'
import {
  SlidersHorizontal, ChevronDown, ChevronUp, MapPin, Home, Compass, Sparkles, X, Search,
  Waves, Droplets, Mountain, TreePine, Wheat, Wind,
  Users, Tractor, Landmark, Leaf,
  Snail, CalendarDays, Clock, Baby, Car, User, Laptop,
  Utensils, Sunrise, BookOpen, WifiOff, Footprints, Armchair,
} from 'lucide-react'
import PracticalFiltersDrawer from './PracticalFiltersDrawer'
import PlaceGrid from './PlaceGrid'
import { EMPTY_PRACTICAL_FILTERS, type PracticalFilters } from './types'
import type { HomestayWithCategories } from '@/types/blocks.types'
import { createClient } from '@/lib/supabase/client'
import { SUB_CATEGORY_GROUPS, type SubCategory } from '@/lib/subCategories'
import { searchHomestays, groupSuggestions, MIN_SEARCH_LENGTH } from '@/lib/search'
import { findPlace, insidePlace, distanceKm, type Place } from '@/lib/places'
import type { MapFocus } from './DiscoverMap'

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
  beside_the_water:   { icon: Droplets, img: photo('1644071300780-7475aa7ecf93'), alt: 'Footbridge over a stream, with palms' },
  in_the_hills:       { icon: Mountain, img: photo('1711192702535-eac61a78ecb0'), alt: 'Tea gardens in the hills' },
  among_the_green:    { icon: TreePine, img: photo('1734373810472-4c246b1ea5b9'), alt: 'Misty forest road' },
  in_the_countryside: { icon: Wheat,    img: photo('1694011772133-dc4b3ff3f24f'), alt: 'Paddy fields and coconut palms' },
  away_from_it_all:   { icon: Wind,     img: photo('1617159156637-dfb8655c9f95'), alt: 'Remote mountain village' },

  family_homes:     { icon: Users,    img: photo('1642667670006-6b3059ccf96d'), alt: 'Family house with a flowering garden' },
  farm_stays:       { icon: Tractor,  img: photo('1620901433789-1d2f85a93653'), alt: 'Farmer ploughing with oxen' },
  heritage_homes:   { icon: Landmark, img: photo('1682414180825-c0df1934387f'), alt: 'Old haveli entrance' },
  village_homes:    { icon: Home,     img: photo('1643474003587-8bbf4bbc01d9'), alt: 'Mud house with a tiled roof' },
  eco_nature_homes: { icon: Leaf,     img: photo('1785407446300-3d89e2158956'), alt: 'Tiled-roof home among trees' },

  slow_escapes:             { icon: Snail,        img: photo('1578981320111-c7e9426cd6e8'), alt: 'Boat on still water at sunset' },
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
  trekking:              { icon: Footprints,     img: photo('1627894485200-b92fb4353967'), alt: 'Trekker resting on a green mountain meadow' },
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
  initialSearch?: string   // ?q= from the homepage search box
  imageMap?: Record<string, string>
}

export default function DiscoverClient({ initialIntentSlug: _, initialCatKey, initialSearch, imageMap = {} }: Props) {
  const supabase = useMemo(() => createClient(), [])

  // ── Search: name, place or experience ────────────────────────────
  const [searchText, setSearchText] = useState(initialSearch ?? '')
  const [searchIds,  setSearchIds]  = useState<Set<string> | null>(null)   // the matching stays; null when not searching
  const [searchBusy, setSearchBusy] = useState(false)
  // When the words are a place (a town, district, state…): the place, the words it was found for,
  // and the stays whose own village or district matched the words
  const [placeFor,   setPlaceFor]   = useState<{ term: string; place: Place; namedIds: Set<string> } | null>(null)
  const searchTerm = searchText.trim()
  const searching  = searchTerm.length >= MIN_SEARCH_LENGTH

  // Phones get a shorter hint in the search box, so it fits beside the round Search button
  const [narrowScreen, setNarrowScreen] = useState(false)
  useEffect(() => {
    const phone = window.matchMedia('(max-width: 639px)')
    const update = () => setNarrowScreen(phone.matches)
    update()
    phone.addEventListener('change', update)
    return () => phone.removeEventListener('change', update)
  }, [])

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

  // ── Effect: search a moment after typing stops; the words also go into the page address ──
  useEffect(() => {
    const keepInAddress = (q: string | null) => {
      const url = new URL(window.location.href)
      if (q) url.searchParams.set('q', q); else url.searchParams.delete('q')
      window.history.replaceState(window.history.state, '', url)
    }

    if (!searching) {
      setSearchIds(null)
      setPlaceFor(null)
      setSearchBusy(false)
      keepInAddress(null)
      return
    }
    let cancelled = false
    setSearchBusy(true)
    const timer = setTimeout(async () => {
      const placeLookup = findPlace(searchTerm)   // runs alongside the homestay search
      const hits = await searchHomestays(supabase, searchTerm)
      if (cancelled) return
      setSearchIds(new Set(hits.map(h => h.id)))
      setSearchBusy(false)
      keepInAddress(searchTerm)

      // A homestay's name or a kind of stay ("farm stays") is searched as words. Otherwise, when
      // OpenStreetMap knows the words as a place, the map shows that area and the stays inside it.
      const asWords = hits.some(h => h.title_score >= 0.6) || groupSuggestions(searchTerm, hits).kinds.length > 0
      let place = asWords ? null : await placeLookup
      if (cancelled) return

      // If our stays name this place but none lies inside the area found, OpenStreetMap found a
      // different place with the same name (a Kasal elsewhere in India): search as words instead
      const named = hits.filter(h => h.place_score >= 0.6)
      if (place && named.length > 0 && !named.some(h => insidePlace(place!, h.latitude, h.longitude))) place = null

      setPlaceFor(place ? { term: searchTerm, place, namedIds: new Set(named.map(h => h.id)) } : null)
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [searchTerm, searching, supabase])

  // ── Effect: fetch homestays whenever filters / bounds change ─────
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    const timer = setTimeout(async () => {
      // While searching, look across all of India rather than only the area the map shows
      const area  = searching ? INDIA : mapBounds
      const south = area?.south ?? INDIA.south
      const north = area?.north ?? INDIA.north
      const west  = area?.west  ?? INDIA.west
      const east  = area?.east  ?? INDIA.east

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
    // While searching, moving the map does not fetch again
  }, [selectedSubCat, practicalFilters, searching ? null : mapBounds, searching])

  // ── Derived values ───────────────────────────────────────────────
  // A place search: the stays inside the area (and any whose own address names the place),
  // or the three nearest when there are none
  const activePlace = placeFor && placeFor.term === searchTerm ? placeFor.place : null
  const placeView = useMemo(() => {
    if (!activePlace || !placeFor) return null
    const inside  = homestays.filter(h =>
      insidePlace(activePlace, h.latitude, h.longitude) || placeFor.namedIds.has(h.id))
    const nearest = inside.length > 0 ? [] : homestays
      .map(stay => ({ stay, km: distanceKm(activePlace.lat, activePlace.lng, stay.latitude, stay.longitude) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 3)
    return { inside, nearest }
  }, [activePlace, placeFor, homestays])

  // The stays shown in the list and on the map
  const shown = useMemo(() => {
    if (placeView) return placeView.inside.length > 0 ? placeView.inside : placeView.nearest.map(n => n.stay)
    return searchIds ? homestays.filter(h => searchIds.has(h.id)) : homestays
  }, [placeView, searchIds, homestays])
  const busy = isLoading || searchBusy

  // Where the map looks: the searched place (and the nearest stays, if none are inside),
  // or the stays a word search found. Nothing while not searching.
  const mapFocus = useMemo<MapFocus | null>(() => {
    if (activePlace) {
      const [south, north, west, east] = activePlace.bbox
      const near = placeView?.nearest ?? []
      const lats = [south, north, ...near.map(n => n.stay.latitude)]
      const lngs = [west, east, ...near.map(n => n.stay.longitude)]
      return {
        key:     `place:${activePlace.label}:${near.length}`,
        bounds:  [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
        outline: activePlace.outline,
        circle:  activePlace.outline ? undefined : { center: [activePlace.lat, activePlace.lng], radiusKm: activePlace.radiusKm },
      }
    }
    if (searching && searchIds && shown.length > 0) {
      const lats = shown.map(h => h.latitude)
      const lngs = shown.map(h => h.longitude)
      return {
        key:    `stays:${shown.map(h => h.id).sort().join(',')}`,
        bounds: [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      }
    }
    return null
  }, [activePlace, placeView, searching, searchIds, shown])

  const locationLabel = useMemo(() => {
    // A place search names its area above the list instead
    if (shown.length === 0 || activePlace) return undefined
    const counts: Record<string, number> = {}
    shown.forEach(h => {
      if (h.location_district) counts[h.location_district] = (counts[h.location_district] ?? 0) + 1
    })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? `${top[0]} district` : undefined
  }, [shown, activePlace])

  const totalActiveFilters =
    (selectedSubCat ? 1 : 0) +
    (practicalFilters.verifiedOnly ? 1 : 0) +
    practicalFilters.languages.length +
    practicalFilters.practicalSlugs.length

  return (
    <div className="flex flex-col bg-white">

      {/* ── Search box, above the categories ── */}
      <div className="bg-[#f8f7f2] px-4 sm:px-6 pt-6">
        <div className="max-w-7xl mx-auto">
          <form
            role="search"
            onSubmit={e => {
              // The list already follows the typing; Search closes the phone keyboard and shows the results
              e.preventDefault()
              ;(document.activeElement as HTMLElement | null)?.blur()
              splitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="flex items-center gap-3 rounded-full border border-stone-300 bg-white pl-5 pr-1.5 py-1.5 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-50 transition-shadow"
          >
            <Search size={20} className="text-stone-500 shrink-0" aria-hidden />
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder={narrowScreen ? 'Place, stay or experience…' : 'A place, a homestay or an experience…'}
              aria-label="Search homestays"
              autoComplete="off"
              enterKeyHint="search"
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] sm:text-base text-stone-800 placeholder:text-stone-400 py-2"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                aria-label="Clear search"
                className="text-stone-400 hover:text-stone-600 shrink-0"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="submit"
              aria-label="Search"
              className="inline-flex items-center gap-2 shrink-0 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-full p-3 sm:px-6 transition-colors"
            >
              <Search size={18} aria-hidden />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>
        </div>
      </div>

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
              {busy ? 'Searching…' : `${shown.length} ${shown.length === 1 ? 'stay' : 'stays'} found`}
            </p>
            {!busy && locationLabel && (
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
          filteredCount={shown.length}
          locationLabel={locationLabel}
          totalActiveFilters={totalActiveFilters}
          onReset={resetAll}
        />
      </div>

      {/* ── Split view: cards left, map right ── */}
      <div ref={splitRef} className="max-w-7xl mx-auto w-full flex flex-col md:flex-row">

        <div className="w-full md:w-2/3 flex flex-col md:border-r border-stone-100 order-2 md:order-1">
          {/* A place search: which area the list and the outlined map show */}
          {activePlace && placeView && !busy && (
            <div className="mx-4 md:mx-5 mt-4 flex items-start gap-2.5 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
              <MapPin size={16} className="text-brand-700 mt-0.5 shrink-0" aria-hidden />
              {placeView.inside.length > 0 ? (
                <p>
                  <span className="font-semibold">
                    {placeView.inside.length} {placeView.inside.length === 1 ? 'stay' : 'stays'}
                  </span>{' '}
                  in {activePlace.label}
                </p>
              ) : (
                <p>
                  No stays in {activePlace.label} yet. The nearest:{' '}
                  {placeView.nearest.map((n, i) => (
                    <span key={n.stay.id}>
                      {i > 0 && ', '}
                      <span className="font-semibold">{n.stay.title}</span> (about {Math.round(n.km)} km)
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
          <PlaceGrid
            homestays={shown}
            highlightedId={highlightedId}
            onHover={setHighlightedId}
            isLoading={busy}
            {...(searching ? {
              emptyTitle: `No stays match “${searchTerm}” yet.`,
              emptyHint:  'Try another word, or clear the search to see all stays.',
            } : selectedSubCat && totalActiveFilters === 1 && {
              emptyTitle: `No stays in ${selectedSubCat.label} yet.`,
              emptyHint:  'Homestays are still being added to this collection. Try another sub-category.',
            })}
          />
        </div>

        <div className="w-full h-[300px] p-3 md:w-1/3 md:h-[520px] md:shrink-0 order-1 md:order-2">
          <div className="h-full rounded-xl overflow-hidden">
            <DiscoverMap
              homestays={shown}
              highlightedId={highlightedId}
              onMarkerClick={setHighlightedId}
              onBoundsChange={handleBoundsChange}
              focus={mapFocus}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MapPin, Home, Compass, Sparkles, Star, ArrowRight, X, Waves, Mountain, TreePine, Sun, Wind, Droplets, Bird, Clock, Car, Anchor, Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { HomestayWithCategories } from '@/types/blocks.types'

const INDIA = { south: 8.0, north: 37.5, west: 68.0, east: 97.5 }

type SubCat = {
  label: string
  img: string
  alt: string
  icon: React.ElementType
  intentSlug?: string
  landscapeSlugs?: string[]
}

type MainCat = {
  key: string
  label: string
  icon: React.ElementType
  img: string
  alt: string
  subCats: SubCat[]
}

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

function toCard(h: Record<string, unknown>): HomestayWithCategories {
  return {
    id:                String(h.id ?? ''),
    title:             String(h.title ?? ''),
    slug:              String(h.slug ?? ''),
    location_district: String(h.location_district ?? ''),
    village_name:      String(h.village_name ?? ''),
    host_name:         String(h.host_name ?? ''),
    is_verified:       Boolean(h.is_verified),
    latitude:          Number(h.latitude ?? 0),
    longitude:         Number(h.longitude ?? 0),
    calling_window:    String(h.calling_window ?? ''),
    languages_spoken:  Array.isArray(h.languages_spoken) ? h.languages_spoken as string[] : [],
    categories:        [],
    cover_image_url:   h.cover_image_url ? String(h.cover_image_url) : null,
  }
}

export default function CategorySection({ imageMap = {} }: { imageMap?: Record<string, string> }) {
  const supabase = useMemo(() => createClient(), [])

  const [selectedCatKey, setSelectedCatKey] = useState<string | null>(null)
  const [selectedSubCat, setSelectedSubCat] = useState<SubCat | null>(null)
  const [homestays,      setHomestays]       = useState<HomestayWithCategories[]>([])
  const [loading,        setLoading]         = useState(false)

  const selectedCat = CATEGORIES.find(c => c.key === selectedCatKey) ?? null
  const subCatRef   = useRef<HTMLDivElement>(null)
  const resultRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedCatKey) {
      setTimeout(() => subCatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
    }
  }, [selectedCatKey])

  useEffect(() => {
    if (selectedSubCat) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
    }
  }, [selectedSubCat])

  async function fetchBySubCat(sub: SubCat) {
    setLoading(true)
    setHomestays([])
    const { data } = await supabase.rpc('filter_homestays_spatial', {
      min_lat:         INDIA.south,
      max_lat:         INDIA.north,
      min_lng:         INDIA.west,
      max_lng:         INDIA.east,
      intent_slug:     sub.intentSlug ?? null,
      landscape_slugs: sub.landscapeSlugs ?? [],
      practical_slugs: [],
    })
    setHomestays(((data as Record<string, unknown>[] | null) ?? []).slice(0, 6).map(toCard))
    setLoading(false)
  }

  async function fetchRecent() {
    setLoading(true)
    setHomestays([])
    const { data } = await supabase
      .from('homestays')
      .select('id, title, slug, location_district, village_name, host_name, is_verified, latitude, longitude, calling_window, languages_spoken, cover_image_url')
      .order('created_at', { ascending: false })
      .limit(6)
    setHomestays(((data as Record<string, unknown>[] | null) ?? []).map(toCard))
    setLoading(false)
  }

  function handleCatClick(cat: MainCat) {
    if (selectedCatKey === cat.key) {
      setSelectedCatKey(null)
      setSelectedSubCat(null)
      setHomestays([])
      return
    }
    setSelectedCatKey(cat.key)
    setSelectedSubCat(null)
    setHomestays([])
    if (cat.subCats.length === 0) fetchRecent()
  }

  function handleSubCatClick(sub: SubCat) {
    setSelectedSubCat(sub)
    fetchBySubCat(sub)
  }

  function closeAll() {
    setSelectedCatKey(null)
    setSelectedSubCat(null)
    setHomestays([])
  }

  return (
    <section className="bg-[#f8f7f2] px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto">

        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Explore by Categories</h2>
        </div>

        {/* ── Main category cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.key}
              onClick={() => handleCatClick(cat)}
              className={`group relative rounded-xl overflow-hidden aspect-[3/4] text-left transition-all duration-200 ${
                i === 4 ? 'col-span-2 sm:col-span-1' : ''
              } ${selectedCatKey === cat.key ? 'ring-2 ring-brand-600 ring-offset-2' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageMap[`cat_${cat.key}`] ?? cat.img}
                alt={cat.alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/65" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <cat.icon size={32} className="text-white/90 drop-shadow-md" />
                <span className="text-white font-semibold text-sm leading-tight text-center px-2">{cat.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* ── Sub-category panel ── */}
        {selectedCat && selectedCat.subCats.length > 0 && (
          <div ref={subCatRef} className="mt-8 pt-8 border-t border-stone-200">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                {selectedCat.label}
              </p>
              <button
                onClick={closeAll}
                className="text-stone-400 hover:text-stone-600 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {selectedCat.subCats.map((sub) => (
                <button
                  key={sub.label}
                  onClick={() => handleSubCatClick(sub)}
                  className={`group relative rounded-xl overflow-hidden aspect-[3/2] text-left transition-all duration-200 ${
                    selectedSubCat?.label === sub.label ? 'ring-2 ring-brand-600 ring-offset-1' : ''
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageMap[`sub_${sub.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '')}`] ?? sub.img}
                    alt={sub.alt}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/70" />
                  <div className="absolute inset-0 flex items-center justify-center pb-5">
                    <sub.icon size={28} className="text-white/90 drop-shadow-md" />
                  </div>
                  <span className="absolute bottom-0 left-0 right-0 p-3 text-white font-semibold text-sm leading-tight text-center">
                    {sub.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Homestay results ── */}
        {(selectedSubCat !== null || (selectedCat?.subCats.length === 0 && selectedCatKey !== null)) && (
          <div ref={resultRef} className="mt-8 pt-8 border-t border-stone-200">
            <div className="flex items-center justify-between mb-5">
              <p className="text-base font-semibold text-stone-800">
                {selectedSubCat ? `Homestays · ${selectedSubCat.label}` : 'Recently Added'}
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-1.5 text-sm text-brand-700 font-medium hover:gap-2.5 transition-all group"
              >
                View all
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-stone-200 animate-pulse aspect-[4/3]" />
                ))}
              </div>
            ) : homestays.length === 0 ? (
              <p className="text-sm text-stone-400 py-4">No homestays found for this category yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {homestays.map((h) => (
                  <Link
                    key={h.id}
                    href={`/homestays/${h.slug}`}
                    className="group block rounded-xl overflow-hidden border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                      {h.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={h.cover_image_url}
                          alt={h.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin size={20} className="text-stone-300" />
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-2">
                      <p className="text-xs font-semibold text-stone-900 leading-snug line-clamp-1">{h.title}</p>
                      <p className="flex items-center gap-0.5 text-[10px] text-stone-400 mt-0.5 truncate">
                        <MapPin size={8} className="shrink-0" />
                        {h.village_name}, {h.location_district}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  )
}

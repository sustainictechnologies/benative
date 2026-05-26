'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ShieldCheck, Star, X } from 'lucide-react'
import type { HomestayWithCategories } from '@/types/blocks.types'
import FilterBar, { type NominatimPlace } from './FilterSidebar'

interface Props {
  homestays: HomestayWithCategories[]
}

export default function ExploreListClient({ homestays }: Props) {
  const [selectedPlace, setSelectedPlace] = useState<NominatimPlace | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const filtered = useMemo(() => {
    return homestays.filter((h) => {
      if (selectedPlace) {
        const [south, north, west, east] = selectedPlace.bbox
        if (h.latitude < south || h.latitude > north || h.longitude < west || h.longitude > east) return false
      }
      if (selectedCategories.length > 0 && !h.categories.some((c) => selectedCategories.includes(c.slug))) return false
      if (verifiedOnly && !h.is_verified) return false
      return true
    })
  }, [homestays, selectedPlace, selectedCategories, verifiedOnly])

  function clearFilters() {
    setSelectedPlace(null)
    setSelectedCategories([])
    setVerifiedOnly(false)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Filter bar */}
      <FilterBar
        selectedPlace={selectedPlace}
        selectedCategories={selectedCategories}
        verifiedOnly={verifiedOnly}
        onPlaceSelect={setSelectedPlace}
        onCategoryChange={setSelectedCategories}
        onVerifiedChange={setVerifiedOnly}
        resultCount={filtered.length}
        onClear={clearFilters}
      />

      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              All Homestays
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              {filtered.length} {filtered.length === 1 ? 'stay' : 'stays'} across the Konkan coast
            </p>
          </div>
          <Link
            href="/map"
            className="hidden sm:flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800 border border-brand-200 hover:border-brand-400 bg-white px-4 py-2 rounded-full transition-all"
          >
            <MapPin size={14} /> View on Map
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <MapPin size={24} className="text-stone-300" />
            </div>
            <p className="text-stone-500 font-medium mb-2">No stays match your filters</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-brand-600 hover:text-brand-800 flex items-center gap-1">
                <X size={13} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((h) => (
              <Link
                key={h.id}
                href={`/homestays/${h.slug}`}
                className="group bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                {/* Photo */}
                <div className="relative h-52 bg-stone-100 overflow-hidden">
                  {h.cover_image_url ? (
                    <Image
                      src={h.cover_image_url}
                      alt={h.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-100 to-stone-200 flex items-center justify-center">
                      <MapPin size={32} className="text-brand-300" />
                    </div>
                  )}
                  {h.is_verified && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-brand-700 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      <ShieldCheck size={10} /> Verified Host
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-stone-900 text-sm leading-snug mb-1.5">{h.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-stone-400 mb-3">
                    <MapPin size={10} />
                    <span>{h.village_name}, {h.location_district}</span>
                  </div>

                  {h.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {h.categories.slice(0, 2).map((c) => (
                        <span key={c.id} className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                          {c.name}
                        </span>
                      ))}
                      {h.categories.length > 2 && (
                        <span className="text-[10px] text-stone-400">+{h.categories.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1 pt-3 border-t border-stone-100">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold text-stone-700">4.8</span>
                    <span className="text-xs text-stone-400 ml-auto">Direct contact</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

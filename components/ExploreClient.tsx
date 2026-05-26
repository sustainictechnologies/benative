'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { HomestayWithCategories } from '@/types/blocks.types'
import FilterBar, { type NominatimPlace } from './FilterSidebar'
import HomestayCard from './HomestayCard'

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-stone-100 animate-pulse flex items-center justify-center">
      <span className="text-sm text-stone-400">Loading map…</span>
    </div>
  ),
})

interface Props {
  homestays: HomestayWithCategories[]
}

export default function ExploreClient({ homestays }: Props) {
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
    <div className="flex flex-col h-[calc(100vh-56px)]">
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

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <MapView homestays={filtered} selectedPlace={selectedPlace} />
        </div>

        <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-stone-200 bg-white overflow-y-auto">
          <div className="divide-y divide-stone-100">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-stone-400">
                No stays match your filters.
              </div>
            ) : (
              filtered.map((h) => <HomestayCard key={h.id} homestay={h} />)
            )}
          </div>
        </div>
      </div>

      <div className="lg:hidden h-52 overflow-y-auto border-t border-stone-200 bg-white">
        <div className="divide-y divide-stone-100">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-stone-400">No stays match your filters.</div>
          ) : (
            filtered.map((h) => <HomestayCard key={h.id} homestay={h} />)
          )}
        </div>
      </div>
    </div>
  )
}

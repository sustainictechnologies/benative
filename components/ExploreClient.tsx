'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { HomestayWithCategories } from '@/types/blocks.types'
import FilterBar, { type NominatimPlace } from './FilterSidebar'
import HomestayCard from './HomestayCard'
import type { MapBounds } from './MapView'
import { MapPin } from 'lucide-react'

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
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds)
  }, [])

  const filtered = useMemo(() => {
    return homestays.filter((h) => {
      // Place search bbox takes priority; fall back to live map viewport
      if (selectedPlace) {
        const [south, north, west, east] = selectedPlace.bbox
        if (h.latitude < south || h.latitude > north || h.longitude < west || h.longitude > east) return false
      } else if (mapBounds) {
        const { south, north, west, east } = mapBounds
        if (h.latitude < south || h.latitude > north || h.longitude < west || h.longitude > east) return false
      }
      if (selectedCategories.length > 0 && !h.categories.some((c) => selectedCategories.includes(c.slug))) return false
      if (verifiedOnly && !h.is_verified) return false
      return true
    })
  }, [homestays, selectedPlace, selectedCategories, verifiedOnly, mapBounds])

  function clearFilters() {
    setSelectedPlace(null)
    setSelectedCategories([])
    setVerifiedOnly(false)
  }

  const isFiltering = !!selectedPlace || !!mapBounds

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

      {/* Desktop: side-by-side — map 40%, list 60% */}
      <div className="hidden lg:flex flex-1 overflow-hidden">

        {/* Map — 40% width */}
        <div className="w-[40%] relative shrink-0">
          <MapView
            homestays={filtered}
            selectedPlace={selectedPlace}
            onBoundsChange={handleBoundsChange}
          />
        </div>

        {/* List — 60% width */}
        <div className="flex-1 flex flex-col overflow-hidden border-l border-stone-200 bg-white">
          {/* List header */}
          <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
            <MapPin size={14} className="text-brand-600 shrink-0" />
            <span className="text-sm font-semibold text-stone-700">
              {filtered.length === 0
                ? 'No stays in this area'
                : `${filtered.length} stay${filtered.length === 1 ? '' : 's'} ${isFiltering ? 'in this area' : 'across India'}`}
            </span>
            {isFiltering && filtered.length > 0 && (
              <span className="ml-auto text-xs text-stone-400">Pan or zoom map to update</span>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-4">
            {filtered.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-sm text-stone-400">No homestays visible in this map area.</p>
                <p className="text-xs text-stone-300">Try zooming out or panning the map.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((h) => <HomestayCard key={h.id} homestay={h} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: map on top, list below */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
        <div className="h-[45%] relative">
          <MapView
            homestays={filtered}
            selectedPlace={selectedPlace}
            onBoundsChange={handleBoundsChange}
          />
        </div>

        <div className="flex-1 overflow-y-auto border-t border-stone-200 bg-white">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center gap-2 sticky top-0 bg-white z-10">
            <MapPin size={13} className="text-brand-600 shrink-0" />
            <span className="text-xs font-semibold text-stone-700">
              {filtered.length === 0
                ? 'No stays in this area'
                : `${filtered.length} stay${filtered.length === 1 ? '' : 's'} in view`}
            </span>
          </div>
          <div className="p-3">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-stone-400">
                No stays visible. Pan or zoom the map.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((h) => <HomestayCard key={h.id} homestay={h} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

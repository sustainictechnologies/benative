'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import TravelIntentFilter from './TravelIntentFilter'
import LandscapeFilterRail from './LandscapeFilterRail'
import PracticalFiltersDrawer from './PracticalFiltersDrawer'
import PlaceGrid from './PlaceGrid'
import { TRAVEL_INTENTS, LANDSCAPES } from './mockData'
import { EMPTY_PRACTICAL_FILTERS, type TravelIntent, type Landscape, type PracticalFilters } from './types'
import type { HomestayWithCategories } from '@/types/blocks.types'

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
  const [selectedIntent, setSelectedIntent] = useState<TravelIntent | null>(null)
  const [selectedLandscapes, setSelectedLandscapes] = useState<Landscape[]>([])
  const [practicalFilters, setPracticalFilters] = useState<PracticalFilters>(EMPTY_PRACTICAL_FILTERS)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  function toggleLandscape(landscape: Landscape) {
    setSelectedLandscapes((prev) =>
      prev.some((l) => l.id === landscape.id)
        ? prev.filter((l) => l.id !== landscape.id)
        : [...prev, landscape]
    )
  }

  const availableLanguages = useMemo(
    () => Array.from(new Set(homestays.flatMap((h) => h.languages_spoken))).sort(),
    [homestays]
  )

  const filtered = useMemo(() => {
    return homestays.filter((h) => {
      const catSlugs = h.categories.map((c) => c.slug)

      // Layer 1: Travel Intent (single-select, exact match)
      if (selectedIntent && !catSlugs.includes(selectedIntent.slug)) return false

      // Layer 2: Landscape (multi-select, OR — show if any selected landscape matches)
      if (
        selectedLandscapes.length > 0 &&
        !selectedLandscapes.some((l) => catSlugs.includes(l.slug))
      )
        return false

      // Layer 3a: Practical categories (multi-select, OR — show if any selected practical matches)
      if (
        practicalFilters.practicalSlugs.length > 0 &&
        !practicalFilters.practicalSlugs.some((s) => catSlugs.includes(s))
      )
        return false

      // Layer 3b: Verified only
      if (practicalFilters.verifiedOnly && !h.is_verified) return false

      // Layer 3c: Languages spoken
      if (
        practicalFilters.languages.length > 0 &&
        !practicalFilters.languages.some((l) => h.languages_spoken.includes(l))
      )
        return false

      return true
    })
  }, [homestays, selectedIntent, selectedLandscapes, practicalFilters])

  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Three-layer filter bar */}
      <div className="shrink-0 bg-white">
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
        <PracticalFiltersDrawer
          filters={practicalFilters}
          availableLanguages={availableLanguages}
          onChange={setPracticalFilters}
        />
      </div>

      {/* Split: 40% list / 60% map */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-2/5 overflow-y-auto border-r border-stone-100 shrink-0">
          <PlaceGrid
            homestays={filtered}
            highlightedId={highlightedId}
            onHover={setHighlightedId}
          />
        </div>
        <div className="hidden md:block flex-1">
          <DiscoverMap
            homestays={filtered}
            highlightedId={highlightedId}
            onMarkerClick={setHighlightedId}
          />
        </div>
      </div>
    </div>
  )
}

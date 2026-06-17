'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import PlaceCard from './PlaceCard'
import type { HomestayWithCategories } from '@/types/blocks.types'

const PAGE_SIZE = 8

interface Props {
  homestays: HomestayWithCategories[]
  highlightedId?: string | null
  onHover?: (id: string | null) => void
}

export default function PlaceGrid({ homestays, highlightedId, onHover }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const visible = homestays.slice(0, visibleCount)
  const hasMore = visibleCount < homestays.length

  return (
    <div className="flex flex-col">
      {/* Count header */}
      <div className="px-4 py-2.5 border-b border-stone-100 bg-white sticky top-0 z-10">
        <p className="text-sm text-stone-700 font-medium">
          {homestays.length} {homestays.length === 1 ? 'homestay' : 'homestays'} found
        </p>
      </div>

      {homestays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="text-stone-400 text-sm">No homestays match these filters.</p>
          <p className="text-stone-300 text-xs mt-1">Try widening your selection.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 p-3">
            {visible.map((h) => (
              <PlaceCard
                key={h.id}
                homestay={h}
                isHighlighted={highlightedId === h.id}
                onMouseEnter={() => onHover?.(h.id)}
                onMouseLeave={() => onHover?.(null)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center px-4 pb-5">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-stone-200 rounded-full text-sm text-stone-600 hover:border-brand-400 hover:text-brand-700 transition-colors duration-200 bg-white"
              >
                Load more
                <ChevronDown size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

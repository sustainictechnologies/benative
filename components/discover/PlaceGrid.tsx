'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PlaceCard from './PlaceCard'
import type { HomestayWithCategories } from '@/types/blocks.types'

const PAGE_SIZE = 4

interface Props {
  homestays: HomestayWithCategories[]
  highlightedId?: string | null
  onHover?: (id: string | null) => void
}

export default function PlaceGrid({ homestays, highlightedId, onHover }: Props) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(homestays.length / PAGE_SIZE)
  const visible = homestays.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0) }, [homestays.length])

  return (
    <div className="flex flex-col">
      {homestays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="text-stone-400 text-sm">No homestays match these filters.</p>
          <p className="text-stone-300 text-xs mt-1">Try widening your selection.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pb-2 pt-0.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-0.5 px-2 py-1 border border-stone-200 rounded-full text-xs text-stone-500 hover:border-brand-400 hover:text-brand-700 transition-colors bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <span className="text-[11px] text-stone-400">{page + 1} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="inline-flex items-center gap-0.5 px-2 py-1 border border-stone-200 rounded-full text-xs text-stone-500 hover:border-brand-400 hover:text-brand-700 transition-colors bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

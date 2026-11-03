'use client'

import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import FiltersPanel from './FiltersPanel'
import type { PracticalFilters } from './types'

interface Props {
  filters: PracticalFilters
  availableLanguages: string[]
  onChange: (filters: PracticalFilters) => void
  filteredCount: number
  locationLabel?: string
  totalActiveFilters?: number
  onReset?: () => void
}

export default function PracticalFiltersDrawer({
  filters,
  availableLanguages,
  onChange,
  filteredCount,
  locationLabel,
  totalActiveFilters,
  onReset,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const activeCount =
    (filters.verifiedOnly ? 1 : 0) +
    filters.languages.length +
    filters.practicalSlugs.length

  return (
    <div className="bg-white">
      {/* Summary bar */}
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-6 py-2.5">
        {/* Count + location */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900 leading-none">
            {filteredCount} {filteredCount === 1 ? 'stay' : 'stays'} found
          </p>
          {locationLabel && (
            <p className="text-xs text-stone-400 mt-0.5 leading-none truncate">
              Showing stays in {locationLabel}
            </p>
          )}
        </div>

        {/* Reset filters */}
        {(totalActiveFilters ?? activeCount) > 0 && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-brand-600 font-medium hover:text-brand-800 transition-colors shrink-0"
          >
            Reset filters
          </button>
        )}

        {/* Filters button */}
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className={`inline-flex items-center gap-1.5 text-sm font-medium border rounded-full px-3.5 py-1.5 transition-colors shrink-0 ${
            activeCount > 0 || isOpen
              ? 'bg-brand-700 border-brand-700 text-white'
              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
          }`}
        >
          {!isOpen && <SlidersHorizontal size={13} />}
          {isOpen ? 'Close' : 'Filters'}
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-brand-700 text-[10px] font-bold">
              {activeCount}
            </span>
          )}
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expanded filter panel: choices take effect on Apply filters */}
      {isOpen && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 border-t border-stone-100 pt-3">
          <FiltersPanel
            filters={filters}
            availableLanguages={availableLanguages}
            onApply={(next) => { onChange(next); setIsOpen(false) }}
          />
        </div>
      )}
    </div>
  )
}

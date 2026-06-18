'use client'

import { SketchIcon } from './icons'
import type { Landscape } from './types'

interface Props {
  landscapes: Landscape[]
  selected: Landscape[]
  onToggle: (landscape: Landscape) => void
}

export default function LandscapeFilterRail({ landscapes, selected, onToggle }: Props) {
  return (
    <div className="bg-stone-50/50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start gap-2 md:gap-3 px-4 sm:px-6 py-3 border-b border-stone-100">
        <span className="text-sm text-stone-500 shrink-0 md:pt-1">Landscape</span>

        <div className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 md:flex-wrap md:overflow-x-visible flex-1">
          {landscapes.map((landscape) => {
            const isSelected = selected.some((l) => l.id === landscape.id)
            return (
              <button
                key={landscape.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(landscape)}
                className={`group inline-flex items-center gap-2 px-3 py-2 border rounded-full shrink-0 whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-brand-400 hover:text-brand-800'
                }`}
              >
                <SketchIcon
                  slug={landscape.slug}
                  className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                    isSelected ? 'text-white' : 'text-brand-800 group-hover:text-brand-800'
                  }`}
                />
                <span
                  className={`text-[13px] leading-none transition-colors duration-200 ${
                    isSelected ? 'text-white font-medium' : 'text-stone-600 group-hover:text-stone-800'
                  }`}
                >
                  {landscape.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

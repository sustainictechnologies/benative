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
    <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-stone-100 bg-stone-50/50">
      <div className="hidden md:flex flex-col shrink-0 whitespace-nowrap">
        <span className="text-[10px] tracking-[0.16em] uppercase text-stone-400 font-medium leading-none">
          Vibe Filters →
        </span>
        <span className="text-[11px] text-stone-400 mt-0.5 leading-none">What type of landscape inspires you?</span>
      </div>

      <div className="flex items-stretch gap-2 flex-1 overflow-x-auto scrollbar-hide">
        {landscapes.map((landscape) => {
          const isSelected = selected.some((l) => l.id === landscape.id)
          return (
            <button
              key={landscape.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(landscape)}
              className={`group flex flex-col items-center justify-center gap-2 px-3 py-3 border rounded-lg shrink-0 w-[88px] transition-all duration-200 ${
                isSelected
                  ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-brand-400 hover:text-brand-800'
              }`}
            >
              <SketchIcon
                slug={landscape.slug}
                className={`w-7 h-7 transition-colors duration-200 ${
                  isSelected ? 'text-white' : 'text-brand-800 group-hover:text-brand-800'
                }`}
              />
              <span
                className={`text-[10.5px] text-center leading-tight transition-colors duration-200 ${
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
  )
}

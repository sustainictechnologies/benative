'use client'

import { SketchIcon } from './icons'
import type { TravelIntent } from './types'

interface Props {
  intents: TravelIntent[]
  selected: TravelIntent | null
  onSelect: (intent: TravelIntent | null) => void
}

export default function TravelIntentFilter({ intents, selected, onSelect }: Props) {
  const selectedIdx = intents.findIndex((i) => i.id === selected?.id)

  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-stone-100">
      {/* Layer label */}
      <div className="hidden md:flex flex-col shrink-0 whitespace-nowrap">
        <span className="text-[10px] tracking-[0.16em] uppercase text-stone-400 font-medium leading-none">
          Intent Rail →
        </span>
        <span className="text-[11px] text-stone-400 mt-0.5 leading-none">Why are you traveling?</span>
      </div>

      {/* Pill row */}
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
        {intents.map((intent, idx) => {
          const isSelected = selected?.id === intent.id
          const isAfterSelected = idx === selectedIdx + 1

          return (
            <div key={intent.id} className="flex items-center shrink-0">
              {/* Arrow between active and next pill */}
              {isAfterSelected && selectedIdx >= 0 && (
                <span className="mr-1 text-stone-300 text-base leading-none select-none">›</span>
              )}

              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(isSelected ? null : intent)}
                className={`group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                    : 'bg-white border-stone-300 text-stone-700 hover:border-brand-400 hover:text-brand-800'
                }`}
              >
                <SketchIcon
                  slug={intent.slug}
                  className={`w-[18px] h-[18px] shrink-0 transition-colors duration-200 ${
                    isSelected ? 'text-white' : 'text-brand-700 group-hover:text-brand-800'
                  }`}
                />
                {intent.name}
              </button>
            </div>
          )
        })}
      </div>

    </div>
  )
}

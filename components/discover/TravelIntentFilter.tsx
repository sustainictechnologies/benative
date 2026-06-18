'use client'

import { Check } from 'lucide-react'
import { SketchIcon } from './icons'
import type { TravelIntent } from './types'

interface Props {
  intents: TravelIntent[]
  selected: TravelIntent | null
  onSelect: (intent: TravelIntent | null) => void
}

export default function TravelIntentFilter({ intents, selected, onSelect }: Props) {
  return (
    <div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 sm:px-6 py-2.5 border-b border-stone-100">
        <span className="text-sm text-stone-500 shrink-0">Why are you travelling?</span>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {intents.map((intent) => {
            const isSelected = selected?.id === intent.id
            return (
              <button
                key={intent.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(isSelected ? null : intent)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 ${
                  isSelected
                    ? 'bg-brand-700 border-brand-700 text-white'
                    : 'bg-white border-stone-300 text-stone-700 hover:border-brand-400 hover:text-brand-800'
                }`}
              >
                <SketchIcon
                  slug={intent.slug}
                  className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-brand-700'}`}
                />
                {intent.name}
                {isSelected && <Check size={13} strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

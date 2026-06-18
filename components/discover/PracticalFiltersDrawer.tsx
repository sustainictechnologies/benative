'use client'

import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import type { PracticalFilters } from './types'

const PRACTICAL_ITEMS = [
  { slug: 'spec_stable_network',       name: 'Stable Network'        },
  { slug: 'spec_gated_parking',        name: 'Gated Parking'         },
  { slug: 'spec_basic_toolkit',        name: 'Basic Toolkit'         },
  { slug: 'spec_pet_friendly',         name: 'Pet-Friendly'          },
  { slug: 'spec_wildlife_secure',      name: 'Wildlife-Proof Safety' },
  { slug: 'spec_shared_kitchen',       name: 'Shared Kitchen'        },
  { slug: 'spec_power_backup',         name: 'Power Backup'          },
  { slug: 'spec_laundry_access',       name: 'Laundry Access'        },
  { slug: 'spec_native_guide',         name: 'Native Guide'          },
  { slug: 'spec_plastic_free',         name: 'Plastic-Free Stay'     },
  { slug: 'spec_western_toilet',       name: 'Western Toilet'        },
  { slug: 'spec_hot_water',            name: 'Hot Water / Geyser'    },
  { slug: 'spec_no_stairs_access',     name: 'No-Stairs Access'      },
  { slug: 'spec_quiet_work_setup',     name: 'Quiet Work Setup'      },
  { slug: 'spec_solo_female_friendly', name: 'Solo-Female Friendly'  },
]

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

  function toggleLanguage(lang: string) {
    const next = filters.languages.includes(lang)
      ? filters.languages.filter((l) => l !== lang)
      : [...filters.languages, lang]
    onChange({ ...filters, languages: next })
  }

  function togglePractical(slug: string) {
    const next = filters.practicalSlugs.includes(slug)
      ? filters.practicalSlugs.filter((s) => s !== slug)
      : [...filters.practicalSlugs, slug]
    onChange({ ...filters, practicalSlugs: next })
  }

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
          {isOpen ? 'Done' : 'Filters'}
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-brand-700 text-[10px] font-bold">
              {activeCount}
            </span>
          )}
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expanded filter panel */}
      {isOpen && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 flex flex-col gap-4 border-t border-stone-100 pt-3">
          {/* Practical requirements */}
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-stone-400 mb-2">Requirements</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {PRACTICAL_ITEMS.map((item) => (
                <label key={item.slug} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.practicalSlugs.includes(item.slug)}
                    onChange={() => togglePractical(item.slug)}
                    className="w-3.5 h-3.5 border-stone-300 accent-brand-700 cursor-pointer"
                  />
                  <span className="text-xs text-stone-600 group-hover:text-stone-900 transition-colors">
                    {item.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Verified only */}
          <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => onChange({ ...filters, verifiedOnly: e.target.checked })}
              className="w-3.5 h-3.5 border-stone-300 accent-brand-700 cursor-pointer"
            />
            <span className="text-xs text-stone-600 group-hover:text-stone-900 transition-colors">
              Verified hosts only
            </span>
          </label>

          {/* Languages */}
          {availableLanguages.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-stone-400 mb-2">Languages spoken</p>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map((lang) => {
                  const active = filters.languages.includes(lang)
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors duration-150 ${
                        active
                          ? 'bg-brand-700 border-brand-700 text-white'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-brand-400 hover:text-brand-700'
                      }`}
                    >
                      {lang}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

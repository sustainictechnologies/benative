'use client'

import { useState } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import type { PracticalFilters } from './types'

const PRACTICAL_ITEMS = [
  { slug: 'spec_stable_network',      name: 'Stable Network'          },
  { slug: 'spec_gated_parking',       name: 'Gated Parking'           },
  { slug: 'spec_basic_toolkit',       name: 'Basic Toolkit'           },
  { slug: 'spec_pet_friendly',        name: 'Pet-Friendly'            },
  { slug: 'spec_wildlife_secure',     name: 'Wildlife-Proof Safety'   },
  { slug: 'spec_shared_kitchen',      name: 'Shared Kitchen'          },
  { slug: 'spec_power_backup',        name: 'Power Backup'            },
  { slug: 'spec_laundry_access',      name: 'Laundry Access'          },
  { slug: 'spec_native_guide',        name: 'Native Guide'            },
  { slug: 'spec_plastic_free',        name: 'Plastic-Free Stay'       },
  { slug: 'spec_western_toilet',      name: 'Western Toilet'          },
  { slug: 'spec_hot_water',           name: 'Hot Water / Geyser'      },
  { slug: 'spec_no_stairs_access',    name: 'No-Stairs Access'        },
  { slug: 'spec_quiet_work_setup',    name: 'Quiet Work Setup'        },
  { slug: 'spec_solo_female_friendly',name: 'Solo-Female Friendly'    },
]

interface Props {
  filters: PracticalFilters
  availableLanguages: string[]
  onChange: (filters: PracticalFilters) => void
}

export default function PracticalFiltersDrawer({ filters, availableLanguages, onChange }: Props) {
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

  const summaryParts = [
    filters.verifiedOnly ? 'Verified only' : null,
    ...filters.practicalSlugs.map(
      (s) => PRACTICAL_ITEMS.find((p) => p.slug === s)?.name ?? s
    ),
    ...filters.languages,
  ].filter(Boolean) as string[]

  return (
    <div className="border-b border-stone-100">
      <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
        <div className="hidden sm:block shrink-0">
          <p className="text-[10px] tracking-[0.16em] uppercase text-stone-400 font-medium leading-none">
            Practical Requirements →
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5 leading-none">Tell us what matters to you</p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="flex-1 flex items-center gap-2 border border-stone-200 px-3 py-2 text-left hover:border-stone-300 transition-colors duration-200"
        >
          <SlidersHorizontal size={14} className="text-stone-400 shrink-0" />
          {activeCount > 0 ? (
            <span className="text-sm text-stone-600 truncate">
              {summaryParts.join(', ')}
            </span>
          ) : (
            <span className="text-sm text-stone-400">
              Filter by requirements, languages…
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-200 text-sm text-stone-600 hover:text-brand-700 hover:border-brand-400 transition-colors duration-200 shrink-0 whitespace-nowrap"
        >
          Show Filters
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-brand-700 text-white text-[10px] font-medium">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="px-4 sm:px-6 pb-4 flex flex-col gap-4">
          {/* Practical requirements — 3-column grid */}
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

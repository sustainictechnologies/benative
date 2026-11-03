'use client'

import { useState } from 'react'
import { FACILITY_GROUPS } from '@/lib/facilities'
import { EMPTY_PRACTICAL_FILTERS, type PracticalFilters } from './types'

interface Props {
  filters:            PracticalFilters
  availableLanguages: string[]
  onApply:            (filters: PracticalFilters) => void
}

// The Filters panel on phones and computers. Choices are kept here and take effect on Apply filters.
export default function FiltersPanel({ filters, availableLanguages, onApply }: Props) {
  const [draft, setDraft] = useState<PracticalFilters>(filters)

  const selectedCount = (draft.verifiedOnly ? 1 : 0) + draft.languages.length + draft.practicalSlugs.length

  function toggle(key: 'languages' | 'practicalSlugs', value: string) {
    setDraft(d => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter(v => v !== value) : [...d[key], value],
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Facilities & Stay Preferences: all four groups shown at once */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-semibold text-stone-900">Facilities &amp; Stay Preferences</p>
          {draft.practicalSlugs.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-brand-700 text-white text-[11px] font-bold">
              {draft.practicalSlugs.length}
            </span>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FACILITY_GROUPS.map(group => {
            const picked = group.facilities.filter(f => draft.practicalSlugs.includes(f.slug)).length
            return (
              <div key={group.key}>
                <p className="text-[10px] tracking-[0.15em] uppercase text-stone-400 mb-2">
                  {group.label}
                  {picked > 0 && <span className="ml-1.5 normal-case tracking-normal font-semibold text-brand-700">{picked} selected</span>}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2">
                  {group.facilities.map(f => (
                    <label key={f.slug} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={draft.practicalSlugs.includes(f.slug)}
                        onChange={() => toggle('practicalSlugs', f.slug)}
                        className="w-3.5 h-3.5 border-stone-300 accent-brand-700 cursor-pointer"
                      />
                      <span className="text-xs text-stone-600 group-hover:text-stone-900 transition-colors">
                        {f.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Verified only */}
      <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
        <input
          type="checkbox"
          checked={draft.verifiedOnly}
          onChange={e => setDraft(d => ({ ...d, verifiedOnly: e.target.checked }))}
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
            {availableLanguages.map(lang => {
              const active = draft.languages.includes(lang)
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggle('languages', lang)}
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

      {/* Count, Clear all, Apply filters */}
      <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
        <span className="flex-1 text-xs text-stone-500">{selectedCount} selected</span>
        <button
          type="button"
          onClick={() => setDraft(EMPTY_PRACTICAL_FILTERS)}
          disabled={selectedCount === 0}
          className="text-xs font-medium text-brand-600 hover:text-brand-800 disabled:text-stone-300 transition-colors"
        >
          Clear all
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
        >
          Apply filters
        </button>
      </div>
    </div>
  )
}

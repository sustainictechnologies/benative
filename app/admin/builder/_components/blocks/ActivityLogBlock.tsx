'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { useBuilder } from '../BuilderContext'
import { ALL_ACTIVITIES } from '@/lib/activities'

const DEFAULT_IDS = ['birding', 'farm', 'monsoon']

interface Props { blockId: string }

export default function ActivityLogBlock({ blockId }: Props) {
  const { getText, updateText, previewMode } = useBuilder()
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Activities stored as JSON string in texts['activities']
  let selectedIds: string[] = DEFAULT_IDS
  try {
    const raw = getText(blockId, 'activities', JSON.stringify(DEFAULT_IDS))
    selectedIds = JSON.parse(raw)
  } catch {}

  const selected = ALL_ACTIVITIES.filter(a => selectedIds.includes(a.id))

  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]
    updateText(blockId, 'activities', JSON.stringify(next))
  }

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return
    const handler = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setShowPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPicker])

  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-white p-5 space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧭</span>
          <h2 className="font-semibold text-stone-900 text-sm">Activity Log</h2>
        </div>

        {/* + Add button */}
        {!previewMode && (
          <div className="relative" ref={pickerRef}>
            <button
              onClick={e => { e.stopPropagation(); setShowPicker(v => !v) }}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all ${
                showPicker
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-400 shadow-sm'
              }`}
            >
              <Plus size={11} strokeWidth={2.5} />
              Add Activity
            </button>

            {/* Picker dropdown */}
            {showPicker && (
              <div
                className="absolute right-0 top-9 z-50 w-72 bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 pt-3 pb-2 border-b border-stone-100">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Select Activities
                  </p>
                </div>

                <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
                  {ALL_ACTIVITIES.map(a => {
                    const active = selectedIds.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggle(a.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          active
                            ? 'bg-brand-50 border border-brand-200'
                            : 'hover:bg-stone-50 border border-transparent'
                        }`}
                      >
                        <span className="text-lg shrink-0">{a.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-800 leading-none">{a.label}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5 truncate">{a.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          active ? 'bg-brand-600' : 'border-2 border-stone-200'
                        }`}>
                          {active && <Check size={11} className="text-white" strokeWidth={2.5} />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="px-3 py-2 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
                  <button
                    onClick={() => setShowPicker(false)}
                    className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected activities grid */}
      {selected.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-brand-100 rounded-xl">
          <p className="text-sm text-stone-400">No activities added yet</p>
          {!previewMode && (
            <p className="text-xs text-stone-300 mt-1">Click "+ Add Activity" above to get started</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {selected.map(a => (
            <div
              key={a.id}
              className="relative group/act flex items-start gap-2.5 p-3 bg-white border border-stone-100 rounded-xl hover:border-brand-200 hover:shadow-sm transition-all"
            >
              <span className="text-xl shrink-0 mt-0.5">{a.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-stone-900 leading-tight">{a.label}</p>
                <p className="text-[10px] text-stone-400 mt-0.5 leading-tight">{a.desc}</p>
              </div>
              {/* Remove button */}
              {!previewMode && (
                <button
                  onClick={e => { e.stopPropagation(); toggle(a.id) }}
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover/act:opacity-100 transition-all flex items-center justify-center"
                >
                  <X size={9} strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

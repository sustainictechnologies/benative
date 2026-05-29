'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Undo2, Redo2, Smartphone, Monitor, Save, Leaf, Check } from 'lucide-react'
import Link from 'next/link'

interface Props {
  previewMode: boolean
  viewport: 'desktop' | 'mobile'
  blockCount: number
  onTogglePreview: () => void
  onViewportChange: (v: 'desktop' | 'mobile') => void
  onSave?: () => void
  savedAt?: Date | null
  onPublish?: () => void
}

export default function BuilderTopbar({
  previewMode, viewport, blockCount,
  onTogglePreview, onViewportChange, onSave, savedAt, onPublish,
}: Props) {
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (!savedAt) return
    setJustSaved(true)
    const t = setTimeout(() => setJustSaved(false), 2000)
    return () => clearTimeout(t)
  }, [savedAt])
  return (
    <header className="h-12 bg-stone-900 border-b border-stone-700 flex items-center gap-4 px-4 shrink-0 z-10">

      {/* Logo */}
      <Link href="/admin" className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 bg-brand-600 rounded-lg flex items-center justify-center">
          <Leaf size={13} className="text-white" />
        </div>
        <span className="text-xs font-bold text-white hidden sm:block">Builder</span>
      </Link>

      <div className="w-px h-5 bg-stone-700" />

      {/* Page name */}
      <div className="flex items-center gap-2">
        <div className="bg-stone-800 border border-stone-600 rounded-lg px-3 py-1 flex items-center gap-2">
          <span className="text-xs text-stone-300 font-medium">Your Homestay</span>
          <span className="text-[10px] text-stone-500 bg-stone-700 px-1.5 py-0.5 rounded-md">{blockCount} sections</span>
        </div>
      </div>

      {/* History */}
      <div className="flex items-center gap-1">
        <button className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
          <Undo2 size={13} />
        </button>
        <button className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
          <Redo2 size={13} />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Viewport toggle */}
      <div className="flex items-center bg-stone-800 rounded-lg p-0.5 gap-0.5">
        {(['desktop', 'mobile'] as const).map((v) => (
          <button
            key={v}
            onClick={() => onViewportChange(v)}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${
              viewport === v
                ? 'bg-stone-600 text-white'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            {v === 'desktop' ? <Monitor size={13} /> : <Smartphone size={13} />}
          </button>
        ))}
      </div>

      {/* Preview toggle */}
      <button
        onClick={onTogglePreview}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          previewMode
            ? 'bg-brand-600 text-white'
            : 'bg-stone-700 text-stone-300 hover:bg-stone-600 hover:text-white'
        }`}
      >
        {previewMode ? <EyeOff size={12} /> : <Eye size={12} />}
        {previewMode ? 'Edit' : 'Preview'}
      </button>

      {/* Save / Publish */}
      <button
        onClick={onSave}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${
          justSaved
            ? 'bg-emerald-600 text-white'
            : 'bg-brand-600 hover:bg-brand-500 text-white'
        }`}
      >
        {justSaved ? <Check size={12} /> : <Save size={12} />}
        {justSaved ? 'Saved!' : 'Save Draft'}
      </button>

      <button
        onClick={onPublish}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-colors shadow-sm"
      >
        Publish
      </button>
    </header>
  )
}

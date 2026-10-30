'use client'

import { X, Plus, Pencil } from 'lucide-react'

interface Props {
  open:        boolean
  liveTitle:   string
  pageName:    string
  onClose:     () => void
  onSaveAsNew: () => void
  onKeep:      () => void
}

// Asked on Save Draft when a live homestay's name was changed in the builder: without this,
// a new homestay started from a live one is saved over the live one's record.
export default function SaveAsNewModal({ open, liveTitle, pageName, onClose, onSaveAsNew, onKeep }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-white">Is this a new homestay?</p>
            <p className="text-brand-200 text-xs mt-0.5">The name of a live homestay was changed</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{liveTitle}</span> is live, but this page is now
            called <span className="font-semibold text-stone-900">{pageName}</span>.
          </p>

          <button
            onClick={onSaveAsNew}
            className="w-full flex items-start gap-3 text-left p-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors"
          >
            <Plus size={16} className="shrink-0 mt-0.5" />
            <span>
              <span className="block text-sm font-semibold">Save as a new homestay</span>
              <span className="block text-xs text-white/80 mt-0.5">{liveTitle} stays exactly as it is.</span>
            </span>
          </button>

          <button
            onClick={onKeep}
            className="w-full flex items-start gap-3 text-left p-3.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            <Pencil size={16} className="shrink-0 mt-0.5 text-stone-400" />
            <span>
              <span className="block text-sm font-semibold text-stone-900">Keep as a draft of {liveTitle}</span>
              <span className="block text-xs text-stone-500 mt-0.5">
                If you publish it with the new name, it becomes a separate homestay and {liveTitle} stays
                live until you delete it.
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

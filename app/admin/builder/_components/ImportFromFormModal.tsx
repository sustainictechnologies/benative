'use client'

import { useState } from 'react'
import { X, FileSpreadsheet, Loader2, Sparkles, Check, ChevronRight, User, MapPin } from 'lucide-react'
import { importFromSheet, type SheetRow } from '@/lib/actions/importFromSheet'
import { generateWithAI, type GeneratedBlocks } from '@/lib/actions/generateWithAI'

interface Props {
  open:    boolean
  onClose: () => void
  onImported: (data: GeneratedBlocks) => void
}

type Step = 'url' | 'select' | 'generating' | 'done'

export default function ImportFromFormModal({ open, onClose, onImported }: Props) {
  const [step, setStep]         = useState<Step>('url')
  const [sheetUrl, setSheetUrl] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [rows, setRows]         = useState<SheetRow[]>([])
  const [selectedRow, setSelectedRow] = useState<number>(0)

  if (!open) return null

  const handleClose = () => {
    setStep('url'); setSheetUrl(''); setError(null); setRows([])
    onClose()
  }

  const handleLoadSheet = async () => {
    if (!sheetUrl.trim()) { setError('Please paste your Google Sheet URL.'); return }
    setLoading(true); setError(null)
    const result = await importFromSheet(sheetUrl.trim())
    setLoading(false)
    if ('error' in result) { setError(result.error); return }
    setRows(result.rows)
    setSelectedRow(result.rows.length - 1) // default to latest response
    setStep('select')
  }

  const handleGenerate = async () => {
    const row = rows[selectedRow]
    if (!row) return
    setStep('generating')
    setError(null)
    const result = await generateWithAI(row)
    if ('error' in result) {
      setError(result.error)
      setStep('select')
      return
    }
    setStep('done')
    setTimeout(() => {
      onImported(result.result)
      handleClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
              <Sparkles size={16} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">AI Import from Google Form</h2>
              <p className="text-xs text-stone-400">Generate website content automatically</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100">
            <X size={14} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 px-6 py-3 bg-stone-50 border-b border-stone-100">
          {(['url', 'select', 'generating'] as const).map((s, i) => {
            const labels = ['Paste Sheet', 'Select Response', 'Generate']
            const active = step === s || (step === 'done' && i <= 2)
            const done   = (step === 'select' && i === 0) ||
                           (step === 'generating' && i <= 1) ||
                           (step === 'done')
            return (
              <div key={s} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} className="text-stone-300" />}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  done   ? 'bg-emerald-100 text-emerald-700' :
                  active ? 'bg-violet-100 text-violet-700' :
                           'text-stone-400'
                }`}>
                  {labels[i]}
                </span>
              </div>
            )
          })}
        </div>

        <div className="p-6 space-y-4">

          {/* Step: URL */}
          {step === 'url' && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
                <p className="font-semibold">Before you start:</p>
                <p>Open your Google Sheet → Share → Set to <strong>"Anyone with the link can view"</strong></p>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600 mb-1.5 block">Google Sheet URL</label>
                <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2.5 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
                  <FileSpreadsheet size={14} className="text-stone-400 shrink-0" />
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={e => { setSheetUrl(e.target.value); setError(null) }}
                    onKeyDown={e => e.key === 'Enter' && handleLoadSheet()}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 text-sm bg-transparent outline-none text-stone-800 placeholder:text-stone-400 min-w-0"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

              <button
                onClick={handleLoadSheet}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-sm text-sm"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Loading responses…</> : 'Load Responses'}
              </button>
            </>
          )}

          {/* Step: Select response */}
          {step === 'select' && (
            <>
              <p className="text-xs text-stone-500">{rows.length} response{rows.length !== 1 ? 's' : ''} found. Select which one to use:</p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {rows.map((row, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedRow(i)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedRow === i
                        ? 'border-violet-400 bg-violet-50'
                        : 'border-stone-100 bg-stone-50 hover:border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${selectedRow === i ? 'bg-violet-600' : 'bg-stone-300'}`}>
                        {selectedRow === i && <Check size={10} className="text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate flex items-center gap-1">
                          <User size={11} className="text-stone-400" /> {row.fullName || '(no name)'}
                          {row.homestayName && <span className="text-stone-400 font-normal">— {row.homestayName}</span>}
                        </p>
                        <p className="text-xs text-stone-400 truncate flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {[row.village, row.district].filter(Boolean).join(', ') || 'No location'}
                          {row.timestamp && <span className="ml-2">{row.timestamp}</span>}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

              <div className="flex gap-2">
                <button onClick={() => setStep('url')} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50">
                  ← Back
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-[2] flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-sm"
                >
                  <Sparkles size={14} /> Generate Website with AI
                </button>
              </div>
            </>
          )}

          {/* Step: Generating */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center">
                <Loader2 size={28} className="text-violet-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-stone-900">Generating your website…</p>
                <p className="text-xs text-stone-400 mt-1">AI is reading the form responses and writing content for each section.</p>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Check size={28} className="text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-stone-900">Website generated!</p>
                <p className="text-xs text-stone-400 mt-1">Loading your builder…</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

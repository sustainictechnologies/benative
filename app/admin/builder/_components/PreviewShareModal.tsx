'use client'

import { useState } from 'react'
import { X, Link2, Copy, Check, Loader2, Eye } from 'lucide-react'
import type { CanvasBlock } from './BuilderTypes'
import { savePreview } from '@/lib/actions/savePreview'

interface Props {
  open:      boolean
  onClose:   () => void
  blocks:    CanvasBlock[]
  slug?:     string | null
  pageName?:      string
  pageAddress?:   string
  pageLanguages?: string[]
}

export default function PreviewShareModal({ open, onClose, blocks, slug, pageName, pageAddress, pageLanguages }: Props) {
  const [loading, setLoading]   = useState(false)
  const [token, setToken]       = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  if (!open) return null

  const previewUrl = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/preview/${token}`
    : null

  const handleGenerate = async () => {
    setLoading(true); setError(null)
    const result = await savePreview(blocks, slug, {
      title:     pageName     ?? '',
      address:   pageAddress  ?? '',
      languages: pageLanguages ?? [],
    })
    if ('error' in result) {
      setError(result.error)
    } else {
      setToken(result.token)
    }
    setLoading(false)
  }

  const handleCopy = () => {
    if (!previewUrl) return
    navigator.clipboard.writeText(previewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setToken(null); setError(null); setCopied(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center">
              <Eye size={16} className="text-brand-600" />
            </div>
            <h2 className="text-base font-bold text-stone-900">Share Preview</h2>
          </div>
          <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-stone-500 leading-relaxed">
          Generate a read-only preview link to share with your host for approval before publishing.
          Anyone with the link can view the page but cannot edit anything.
        </p>

        {!token ? (
          <>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-md"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Generating link…</>
                : <><Link2 size={15} /> Generate Preview Link</>
              }
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">Preview Link</p>
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
              <span className="text-sm text-stone-700 flex-1 truncate">{previewUrl}</span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                  copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Note:</strong> This link shows your current draft. Regenerate it anytime to update the preview with latest changes.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold py-2.5 rounded-xl transition-all text-sm"
            >
              {loading ? <><Loader2 size={13} className="animate-spin" /> Updating…</> : '↻ Regenerate with latest changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

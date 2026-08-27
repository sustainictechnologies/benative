'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Send, Pencil, Trash2, X, Check } from 'lucide-react'
import { submitHostReply, deleteHostReply } from '@/lib/actions/reviews'

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  host_reply: string | null
  host_reply_at: string | null
  reviewerName: string | null
}

interface Props {
  review: Review
  homestaySlug: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} className={i < rating ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'} />
      ))}
    </div>
  )
}

export default function HostReviewCard({ review, homestaySlug }: Props) {
  const router = useRouter()
  const [mode, setMode]       = useState<'view' | 'reply' | 'edit' | 'confirmDel'>('view')
  const [text, setText]       = useState(review.host_reply ?? '')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const hasReply = !!review.host_reply

  async function handleSubmit() {
    setSaving(true)
    setError('')
    const res = await submitHostReply(review.id, text, homestaySlug)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setMode('view')
    router.refresh()
  }

  async function handleDelete() {
    setSaving(true)
    setError('')
    const res = await deleteHostReply(review.id, homestaySlug)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setMode('view')
    router.refresh()
  }

  function startEdit() {
    setText(review.host_reply ?? '')
    setMode('edit')
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 space-y-3">

        {/* Reviewer row */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0">
            {review.reviewerName?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-stone-900">{review.reviewerName ?? 'Traveler'}</p>
              <StarRating rating={review.rating} />
              <span className="text-xs text-stone-400">
                {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed mt-1">{review.comment}</p>
          </div>
        </div>

        {/* Existing reply */}
        {hasReply && mode === 'view' && (
          <div className="ml-11 pl-3 border-l-2 border-brand-200 space-y-1">
            <p className="text-xs font-semibold text-brand-700">Your reply</p>
            <p className="text-sm text-stone-600 leading-relaxed">{review.host_reply}</p>
            {review.host_reply_at && (
              <p className="text-[10px] text-stone-400">
                {new Date(review.host_reply_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={startEdit}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-brand-600 transition-colors"
              >
                <Pencil size={11} /> Edit
              </button>
              <button
                onClick={() => setMode('confirmDel')}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {mode === 'confirmDel' && (
          <div className="ml-11 flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
            <span className="text-xs text-rose-700 font-medium flex-1">Delete your reply?</span>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-1 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check size={11} /> Yes, delete
            </button>
            <button onClick={() => setMode('view')} className="text-rose-400 hover:text-rose-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Reply / edit form */}
        {(mode === 'reply' || mode === 'edit') && (
          <div className="ml-11 space-y-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write your reply…"
              rows={3}
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-400 text-stone-700 placeholder:text-stone-400 resize-none"
              autoFocus
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setMode('view'); setText(review.host_reply ?? '') }}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !text.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving
                  ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  : <Send size={11} />
                }
                {mode === 'edit' ? 'Update reply' : 'Post reply'}
              </button>
            </div>
          </div>
        )}

        {/* No reply yet — show button */}
        {!hasReply && mode === 'view' && (
          <div className="ml-11">
            <button
              onClick={() => { setText(''); setMode('reply') }}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              <Send size={11} /> Reply as host
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

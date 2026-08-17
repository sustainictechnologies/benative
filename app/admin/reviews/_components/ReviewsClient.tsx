'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Trash2, Check, X, MessageSquare, ExternalLink } from 'lucide-react'
import { deleteReview } from '@/lib/actions/reviews'
import Link from 'next/link'

export interface AdminReview {
  id: string
  rating: number
  comment: string
  createdAt: string
  homestayTitle: string
  homestaySlug: string
  reviewerName: string | null
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < rating ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'}
        />
      ))}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ReviewsClient({ reviews }: { reviews: AdminReview[] }) {
  const router = useRouter()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [working,   setWorking]   = useState<string | null>(null)
  const [expanded,  setExpanded]  = useState<string | null>(null)

  async function handleDelete(review: AdminReview) {
    setWorking(review.id)
    await deleteReview(review.id, review.homestaySlug)
    setConfirmId(null)
    setWorking(null)
    router.refresh()
  }

  if (reviews.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
          <MessageSquare size={26} className="text-stone-400" />
        </div>
        <p className="text-sm font-semibold text-stone-600">No reviews yet</p>
        <p className="text-xs text-stone-400">Community reviews submitted on homestay pages will appear here.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-3 max-w-4xl">
        {reviews.map((r) => {
          const isConfirm = confirmId === r.id
          const isExpanded = expanded === r.id
          const shortComment = r.comment.length > 120 ? r.comment.slice(0, 120) + '…' : r.comment

          return (
            <div key={r.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">

              {/* Row */}
              <div className="flex items-start gap-4 px-5 py-4">

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0 mt-0.5">
                  {r.reviewerName?.charAt(0).toUpperCase() ?? '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-stone-900">
                      {r.reviewerName ?? 'Anonymous'}
                    </p>
                    <StarRating rating={r.rating} />
                    <span className="text-xs text-stone-400">{timeAgo(r.createdAt)}</span>
                  </div>

                  {/* Homestay link */}
                  <Link
                    href={`/homestays/${r.homestaySlug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-700 mb-2"
                  >
                    {r.homestayTitle} <ExternalLink size={10} />
                  </Link>

                  {/* Comment */}
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {isExpanded ? r.comment : shortComment}
                  </p>
                  {r.comment.length > 120 && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : r.id)}
                      className="text-xs text-brand-600 hover:text-brand-700 mt-1"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                {/* Delete action */}
                <div className="shrink-0">
                  {isConfirm ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-2 py-1.5">
                      <span className="text-[11px] text-rose-700 font-medium">Delete?</span>
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={working === r.id}
                        className="w-5 h-5 flex items-center justify-center rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                      >
                        <Check size={10} />
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-rose-400 hover:text-rose-600"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(r.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl border border-stone-200 text-stone-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

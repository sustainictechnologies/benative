import type { GoogleRatingBlockData } from '@/types/blocks.types'

function GoogleLabel() {
  return <span className="text-xs font-bold text-stone-500 tracking-wide">Google</span>
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled  = rating >= star
        const partial = !filled && rating > star - 1
        const pct     = partial ? Math.round((rating - (star - 1)) * 100) : 0
        return (
          <span key={star} className="relative text-lg text-stone-200 leading-none select-none">
            ★
            {(filled || partial) && (
              <span
                className="absolute inset-0 text-amber-400 overflow-hidden"
                style={{ width: filled ? '100%' : `${pct}%` }}
              >★</span>
            )}
          </span>
        )
      })}
    </div>
  )
}

interface Props {
  data: GoogleRatingBlockData
}

export default function GoogleRatingBlock({ data }: Props) {
  const rating      = data.rating      ?? 0
  const reviewCount = data.review_count ?? 0

  if (!rating && !reviewCount) return null

  const inner = (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
        <GoogleLabel />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Google Reviews</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Stars rating={rating} />
          <span className="text-xl font-black text-stone-900">{rating.toFixed(1)}</span>
        </div>
        {reviewCount > 0 && (
          <p className="text-xs text-stone-400 mt-0.5">{reviewCount} reviews</p>
        )}
      </div>
      {data.maps_url && (
        <span className="text-xs font-semibold text-brand-600 shrink-0">View on Google →</span>
      )}
    </div>
  )

  if (data.maps_url) {
    return (
      <a href={data.maps_url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">
        {inner}
      </a>
    )
  }

  return inner
}

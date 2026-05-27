import { createClient } from '@/lib/supabase/server'
import ReviewList from './ReviewList'
import ReviewForm from './ReviewForm'
import type { ReviewWithProfile } from '@/types/blocks.types'
import { Star } from 'lucide-react'

interface Props {
  homestayId: string
  slug: string
}

export default async function ReviewSection({ homestayId, slug }: Props) {
  const supabase = createClient()

  const [{ data: { user } }, { data: reviews }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, profiles ( full_name )')
      .eq('homestay_id', homestayId)
      .order('created_at', { ascending: false }),
  ])

  const reviewList: ReviewWithProfile[] = (reviews ?? []) as any

  const avgRating =
    reviewList.length > 0
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
      : null

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-stone-900">Community Reviews</h2>
        {avgRating !== null && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-amber-800">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-amber-600">
              ({reviewList.length} {reviewList.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}
      </div>

      <ReviewForm homestayId={homestayId} slug={slug} user={user} />

      {reviewList.length === 0 ? (
        <p className="text-sm text-stone-400 italic">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <ReviewList reviews={reviewList} />
      )}
    </section>
  )
}
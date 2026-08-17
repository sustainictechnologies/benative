import { createAdminClient } from '@/lib/supabase/admin'
import Topbar from '../_components/Topbar'
import ReviewsClient from './_components/ReviewsClient'
import type { AdminReview } from './_components/ReviewsClient'

export const revalidate = 0

export default async function ReviewsPage() {
  const supabase = createAdminClient()

  const { data: raw } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, homestays ( title, slug ), profiles ( full_name )')
    .order('created_at', { ascending: false })

  const reviews: AdminReview[] = (raw ?? []).map((r: any) => ({
    id:             r.id,
    rating:         r.rating,
    comment:        r.comment,
    createdAt:      r.created_at,
    homestayTitle:  r.homestays?.title  ?? 'Unknown homestay',
    homestaySlug:   r.homestays?.slug   ?? '',
    reviewerName:   r.profiles?.full_name ?? null,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Reviews"
        subtitle={`${reviews.length} community ${reviews.length === 1 ? 'review' : 'reviews'}`}
      />
      <ReviewsClient reviews={reviews} />
    </div>
  )
}

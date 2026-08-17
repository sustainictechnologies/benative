'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitReview(
  homestayId: string,
  slug: string,
  rating: number,
  comment: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to leave a review.' }

  if (rating < 1 || rating > 5) return { error: 'Rating must be between 1 and 5.' }

  const sanitized = comment.trim().slice(0, 1000)
  if (!sanitized) return { error: 'Review comment cannot be empty.' }

  const { error } = await supabase.from('reviews').insert({
    homestay_id: homestayId,
    user_id: user.id,
    rating,
    comment: sanitized,
  })

  if (error) {
    if (error.code === '23505') return { error: 'You have already reviewed this homestay.' }
    return { error: 'Failed to submit review. Please try again.' }
  }

  revalidatePath(`/homestays/${slug}`)
  return { success: true }
}

export async function deleteReview(
  reviewId: string,
  slug: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  if (error) return { error: error.message }

  revalidatePath(`/homestays/${slug}`)
  revalidatePath('/admin/reviews')
  return { success: true }
}
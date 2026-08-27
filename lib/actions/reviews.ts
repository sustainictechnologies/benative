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

export async function submitHostReply(
  reviewId: string,
  reply: string,
  homestaySlug: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const sanitized = reply.trim().slice(0, 2000)
  if (!sanitized) return { error: 'Reply cannot be empty.' }

  const { data: review } = await supabase
    .from('reviews')
    .select('homestay_id')
    .eq('id', reviewId)
    .single()
  if (!review) return { error: 'Review not found.' }

  const { data: homestay } = await supabase
    .from('homestays')
    .select('host_user_id')
    .eq('id', review.homestay_id)
    .single()
  if (!homestay || homestay.host_user_id !== user.id) return { error: 'You are not the host of this homestay.' }

  const { error } = await supabase
    .from('reviews')
    .update({ host_reply: sanitized, host_reply_at: new Date().toISOString() })
    .eq('id', reviewId)

  if (error) return { error: error.message }

  revalidatePath(`/homestays/${homestaySlug}`)
  revalidatePath('/host/dashboard')
  return { success: true }
}

export async function deleteHostReply(
  reviewId: string,
  homestaySlug: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: review } = await supabase
    .from('reviews')
    .select('homestay_id')
    .eq('id', reviewId)
    .single()
  if (!review) return { error: 'Review not found.' }

  const { data: homestay } = await supabase
    .from('homestays')
    .select('host_user_id')
    .eq('id', review.homestay_id)
    .single()
  if (!homestay || homestay.host_user_id !== user.id) return { error: 'You are not the host.' }

  const { error } = await supabase
    .from('reviews')
    .update({ host_reply: null, host_reply_at: null })
    .eq('id', reviewId)

  if (error) return { error: error.message }

  revalidatePath(`/homestays/${homestaySlug}`)
  revalidatePath('/host/dashboard')
  return { success: true }
}
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateRecommendationStatus(id: string, status: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('homestay_recommendations')
    .update({ status })
    .eq('id', id)

  if (error) return { success: false as const, error: error.message }
  revalidatePath('/admin/recommendations')
  return { success: true as const }
}

export async function deleteRecommendation(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('homestay_recommendations')
    .delete()
    .eq('id', id)

  if (error) return { success: false as const, error: error.message }
  revalidatePath('/admin/recommendations')
  return { success: true as const }
}

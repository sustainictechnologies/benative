'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function submitRecommendation(payload: {
  recommender_name:  string
  recommender_phone: string
  recommender_email: string
  homestay_name:     string
  address:           string
  host_name:         string
  host_contact:      string
  description:       string
}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('homestay_recommendations')
    .insert({
      recommender_name:  payload.recommender_name  || null,
      recommender_phone: payload.recommender_phone || null,
      recommender_email: payload.recommender_email || null,
      homestay_name:     payload.homestay_name     || null,
      address:           payload.address           || null,
      host_name:         payload.host_name         || null,
      host_contact:      payload.host_contact      || null,
      description:       payload.description       || null,
    })

  if (error) return { success: false as const, error: error.message }
  return { success: true as const }
}

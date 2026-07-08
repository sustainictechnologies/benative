'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function createCustomActivity(payload: {
  label:       string
  description: string | null
  emoji:       string
  icon_url:    string | null
}) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_activities')
    .insert(payload)
    .select()
    .single()

  if (error) return { success: false as const, error: error.message }
  return { success: true as const, data }
}

'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/adminAuth'

// The builder needs every field of a homestay, including the contact details, address and
// draft that only admins may read, so it loads them here on the server, not in the browser.
export async function loadHomestayForBuilder(slug: string) {
  assertAdmin()
  const { data } = await createAdminClient()
    .from('homestays')
    .select('*, homestay_blocks ( id, block_type, sort_order, content_data )')
    .eq('slug', slug)
    .single()
  return { data }
}

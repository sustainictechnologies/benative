'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/adminAuth'
import { revalidatePath } from 'next/cache'
import { SUB_CATEGORY_KEYS } from '@/lib/subCategories'
import { FACILITIES } from '@/lib/facilities'

export async function linkHostAccount(
  homestayId: string,
  email: string,
): Promise<{ error?: string; success?: boolean; email?: string }> {
  assertAdmin()
  const supabase = createAdminClient()

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) return { error: error.message }

  const match = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase().trim())
  if (!match) return { error: `No account found with email: ${email}` }

  const { error: updateErr } = await supabase
    .from('homestays')
    .update({ host_user_id: match.id })
    .eq('id', homestayId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/admin/homestays')
  return { success: true, email: match.email }
}

export async function unlinkHostAccount(
  homestayId: string,
): Promise<{ error?: string; success?: boolean }> {
  assertAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('homestays')
    .update({ host_user_id: null })
    .eq('id', homestayId)

  if (error) return { error: error.message }

  revalidatePath('/admin/homestays')
  return { success: true }
}

// Delete in Admin → Homestays. A live homestay goes back to Drafts: taken off the site (no location = not live),
// with its page, photos, reviews and facilities kept and its location saved in the draft, so Publish or the
// host's Launch puts it back. A draft is deleted for good.
export async function removeHomestay(id: string): Promise<{ error?: string; result?: 'draft' | 'deleted' }> {
  assertAdmin()
  const supabase = createAdminClient()

  const { data: homestay, error } = await supabase
    .from('homestays')
    .select('latitude, longitude, draft_data')
    .eq('id', id)
    .single()
  if (error || !homestay) return { error: error?.message ?? 'Homestay not found' }

  if (homestay.latitude !== 0) {
    const draft_data = { ...(homestay.draft_data ?? {}), pageLocation: { lat: homestay.latitude, lng: homestay.longitude } }
    const { error: moveErr } = await supabase
      .from('homestays')
      .update({ latitude: 0, longitude: 0, draft_data })
      .eq('id', id)
    if (moveErr) return { error: moveErr.message }
    revalidatePath('/admin/homestays')
    revalidatePath('/admin/drafts')
    return { result: 'draft' }
  }

  const { error: deleteErr } = await supabase.from('homestays').delete().eq('id', id)
  if (deleteErr) return { error: deleteErr.message }
  revalidatePath('/admin/homestays')
  revalidatePath('/admin/drafts')
  return { result: 'deleted' }
}

export async function toggleShowOnHomepage(id: string, current: boolean) {
  assertAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('homestays')
    .update({ show_on_homepage: !current })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/homestays')
  revalidatePath('/')
  return { success: true }
}

// All valid taxonomy slugs — tags must already exist in the `tags` table
// (seeded by supabase/migrate_to_tags.sql)
const VALID_SLUGS = new Set([
  // Layer 1: Travel Intent
  'nature_habitat', 'rural_immersion', 'long_stay_retreat', 'transit_pitstop',
  // Layer 2: Environment / Landscape
  'env_forest_border', 'env_riverside', 'env_coastal', 'env_mountain_valley',
  'env_agricultural', 'env_rocky_plateau', 'env_sacred_grove', 'env_wetland',
  // Layer 3: Facilities & Stay Preferences
  ...FACILITIES.map(f => f.slug),
])

export async function saveCategories(homestayId: string, selectedSlugs: string[]) {
  assertAdmin()
  const supabase = createAdminClient()

  // Only keep known slugs
  const cleanSlugs = selectedSlugs.filter(s => VALID_SLUGS.has(s))

  // Delete existing tag assignments
  const { error: delErr } = await supabase
    .from('homestay_tags')
    .delete()
    .eq('homestay_id', homestayId)

  if (delErr) return { error: `Failed to clear tags: ${delErr.message}` }

  if (cleanSlugs.length === 0) {
    revalidatePath('/admin/homestays')
    revalidatePath('/discover')
    return { success: true, count: 0 }
  }

  // Look up tag IDs by slug
  const { data: tags, error: tagErr } = await supabase
    .from('tags')
    .select('id, slug')
    .in('slug', cleanSlugs)

  if (tagErr)              return { error: `Tag lookup failed: ${tagErr.message}` }
  if (!tags?.length)       return { error: 'Tags not found — run migrate_to_tags.sql first.' }

  // Insert junction rows
  const { error: insErr } = await supabase
    .from('homestay_tags')
    .insert(tags.map((t: any) => ({ homestay_id: homestayId, tag_id: t.id })))

  if (insErr) return { error: `Save failed: ${insErr.message}` }

  revalidatePath('/admin/homestays')
  revalidatePath('/discover')
  return { success: true, count: tags.length }
}

// Sets the Discover sub-categories of a homestay (homestays.sub_categories).
// The Discover page reads this column; see supabase/discover_sub_categories.sql.
export async function saveSubCategories(homestayId: string, selectedKeys: string[]) {
  assertAdmin()
  const supabase = createAdminClient()

  // Only keep known keys, each once
  const cleanKeys = Array.from(new Set(selectedKeys.filter(k => SUB_CATEGORY_KEYS.has(k)))).sort()

  const { error } = await supabase
    .from('homestays')
    .update({ sub_categories: cleanKeys })
    .eq('id', homestayId)

  if (error) return { error: `Failed to save sub-categories: ${error.message}` }

  revalidatePath('/admin/homestays')
  revalidatePath('/discover')
  return { success: true, count: cleanKeys.length }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// All valid taxonomy slugs — tags must already exist in the `tags` table
// (seeded by supabase/migrate_to_tags.sql)
const VALID_SLUGS = new Set([
  // Layer 1: Travel Intent
  'nature_habitat', 'rural_immersion', 'long_stay_retreat', 'transit_pitstop',
  // Layer 2: Environment / Landscape
  'env_forest_border', 'env_riverside', 'env_coastal', 'env_mountain_valley',
  'env_agricultural', 'env_rocky_plateau', 'env_sacred_grove', 'env_wetland',
  // Layer 3: Practical Requirements
  'spec_gated_parking', 'spec_basic_toolkit', 'spec_pet_friendly',
  'spec_wildlife_secure', 'spec_stable_network', 'spec_shared_kitchen',
  'spec_power_backup', 'spec_laundry_access', 'spec_native_guide',
  'spec_plastic_free', 'spec_western_toilet', 'spec_hot_water',
  'spec_no_stairs_access', 'spec_quiet_work_setup', 'spec_solo_female_friendly',
])

export async function saveCategories(homestayId: string, selectedSlugs: string[]) {
  const supabase = createClient()

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
    revalidatePath('/explore')
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
  revalidatePath('/explore')
  return { success: true, count: tags.length }
}

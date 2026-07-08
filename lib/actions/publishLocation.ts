'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CanvasBlock } from '@/app/admin/builder/_components/BuilderTypes'
import { serializeBlock } from '@/lib/blockSerializer'

export interface PublishPayload {
  slug:       string
  draftSlug?: string   // slug of the draft record to clean up (may differ from published slug)
  title:      string
  hostName:   string
  phone:      string
  whatsapp:   string
  email:      string
  address:    string
  languages:  string[]
  latitude:   number
  longitude:  number
  blocks:     CanvasBlock[]
}


export async function publishHomestay(payload: PublishPayload) {
  const supabase = createClient()

  const parts    = payload.address.split(',').map(s => s.trim())
  const village  = parts[0] ?? payload.address
  const district = parts[1] ?? village

  // Extract cover image from the hero block to store directly on homestay row
  const heroBlock     = payload.blocks.find(b => b.type === 'hero')
  const coverImageUrl = heroBlock?.props.images?.['cover'] ?? null

  // 1. Upsert homestay row, get back the id
  const { data: upserted, error: upsertErr } = await supabase
    .from('homestays')
    .upsert(
      {
        slug:              payload.slug,
        title:             payload.title,
        host_name:         payload.hostName,
        contact_phone:     payload.phone,
        languages_spoken:  payload.languages,
        village_name:      village,
        location_district: district,
        latitude:          payload.latitude,
        longitude:         payload.longitude,
        is_verified:       true,
        cover_image_url:   coverImageUrl,
      },
      { onConflict: 'slug' }
    )
    .select('id')
    .single()

  if (upsertErr || !upserted) {
    return { success: false as const, error: upsertErr?.message ?? 'Upsert failed' }
  }

  const homestayId = upserted.id

  // 2. Delete existing blocks for this homestay
  await supabase.from('homestay_blocks').delete().eq('homestay_id', homestayId)

  // 3. Insert builder blocks
  const blockRows = payload.blocks.map((block, i) => ({
    homestay_id:  homestayId,
    block_type:   block.type,
    sort_order:   i,
    content_data: serializeBlock(block),
  }))

  if (blockRows.length > 0) {
    const { error: blockErr } = await supabase.from('homestay_blocks').insert(blockRows)
    if (blockErr) return { success: false as const, error: blockErr.message }
  }

  // Clear draft_data on the published record, and delete orphan draft record if slugs differ
  const admin = createAdminClient()
  await admin.from('homestays').update({ draft_data: null }).eq('id', homestayId)
  if (payload.draftSlug && payload.draftSlug !== payload.slug) {
    await admin.from('homestays').delete().eq('slug', payload.draftSlug)
  }

  return { success: true as const }
}

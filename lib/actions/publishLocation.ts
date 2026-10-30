'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/adminAuth'
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
  assertAdmin()
  const supabase = createClient()

  // The page address comes from the name, so publishing under another homestay's name would
  // replace that homestay. Only the homestay being edited may publish to its own address.
  if (payload.slug !== payload.draftSlug) {
    const { data: taken, error: takenErr } = await createAdminClient()
      .from('homestays')
      .select('title')
      .eq('slug', payload.slug)
      .maybeSingle()

    if (takenErr) return { success: false as const, error: takenErr.message }
    if (taken) {
      return {
        success: false as const,
        error: `A homestay named "${taken.title}" already exists, so publishing would replace it. Change the name, or open that homestay to edit it.`,
      }
    }
  }

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

  // Clear draft_data on the published record, and delete orphan draft record if slugs differ.
  // Only an empty draft record is deleted: a record with sections or a location is a live homestay.
  const admin = createAdminClient()
  await admin.from('homestays').update({ draft_data: null }).eq('id', homestayId)
  if (payload.draftSlug && payload.draftSlug !== payload.slug) {
    const { data: source } = await admin
      .from('homestays')
      .select('id, latitude, homestay_blocks ( id )')
      .eq('slug', payload.draftSlug)
      .maybeSingle()

    if (source) {
      const isDraftOnly = source.homestay_blocks.length === 0 && source.latitude === 0
      if (isDraftOnly) await admin.from('homestays').delete().eq('id', source.id)
      else             await admin.from('homestays').update({ draft_data: null }).eq('id', source.id)   // its draft is what was just published
    }
  }

  return { success: true as const }
}

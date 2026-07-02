'use server'

import { createClient } from '@/lib/supabase/server'
import type { CanvasBlock } from '@/app/admin/builder/_components/BuilderTypes'
import { toContentData } from '@/lib/blockSerializer'

export interface PublishPayload {
  slug:       string
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

  const STYLE_SUFFIXES = ['-font', '-size', '-color', '-bold', '-italic', '-align', '-fit', '-bullet']

  // 3. Insert builder blocks
  const blockRows = payload.blocks.map((block, i) => {
    const content = toContentData(block)
    const txt = block.props.texts ?? {}

    // Save element styles generically
    const styles: Record<string, string> = {}
    for (const [k, v] of Object.entries(txt)) {
      if (STYLE_SUFFIXES.some(s => k.endsWith(s))) styles[k] = v
    }
    if (Object.keys(styles).length > 0) (content as any).styles = styles

    // Save layout rows generically
    const layoutRowsRaw = txt['layout-rows']
    if (layoutRowsRaw) {
      try {
        const rows = JSON.parse(layoutRowsRaw)
        const allCellIds: string[] = rows.flatMap((r: any) => (r.cells ?? []).map((c: any) => c.id as string))
        const cells: Record<string, string> = {}
        const layoutImages: Record<string, string> = {}
        const imgMap = block.props.images ?? {}
        for (const cellId of allCellIds) {
          if (txt[cellId])             cells[cellId] = txt[cellId]
          if (txt[`${cellId}-items`])  cells[`${cellId}-items`] = txt[`${cellId}-items`]
          STYLE_SUFFIXES.forEach(s => { if (txt[`${cellId}${s}`]) cells[`${cellId}${s}`] = txt[`${cellId}${s}`] })
          if (imgMap[cellId]) layoutImages[cellId] = imgMap[cellId]
        }
        if (rows.length > 0) (content as any).layout = { rows, cells, images: layoutImages }
      } catch {}
    }

    // Save sub-texts generically
    const subTextsRaw = txt['sub-texts']
    if (subTextsRaw) {
      try {
        const ids = JSON.parse(subTextsRaw) as string[]
        const sub_texts = ids
          .filter(id => txt[id] !== undefined)
          .map(id => ({ id, content: txt[id] ?? '' }))
        if (sub_texts.length > 0) (content as any).sub_texts = sub_texts
      } catch {}
    }

    return {
      homestay_id:  homestayId,
      block_type:   block.type,
      sort_order:   i,
      content_data: content,
    }
  })

  if (blockRows.length > 0) {
    const { error: blockErr } = await supabase.from('homestay_blocks').insert(blockRows)
    if (blockErr) return { success: false as const, error: blockErr.message }
  }

  return { success: true as const }
}

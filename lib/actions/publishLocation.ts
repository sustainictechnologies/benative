'use server'

import { createClient } from '@/lib/supabase/server'
import type { CanvasBlock } from '@/app/admin/builder/_components/BuilderTypes'

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

/** Extract YouTube video ID from a full URL or bare ID */
function extractYouTubeId(raw: string): string {
  try {
    const u = new URL(raw)
    if (u.hostname.includes('youtu.be'))   return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') ?? raw
  } catch {}
  return raw // already just an ID
}

/** Map a builder CanvasBlock → homestay_blocks content_data (field names match live block components) */
function toContentData(block: CanvasBlock): Record<string, unknown> {
  const img = block.props.images ?? {}
  const txt = block.props.texts  ?? {}

  switch (block.type) {
    case 'hero':
      return {
        cover_image_url: img['cover']      ?? null,
        tagline:         txt['tagline']    ?? null,
      }
    case 'host-story':
      return {
        host_image_url:       img['host-photo']      ?? null,
        host_photo_shape:     txt['host-shape']      ?? 'circle',
        host_photo_position:  txt['host-position']   ?? 'center',
        host_photo_zoom:      parseFloat(txt['host-zoom'] ?? '1'),
        story_title:          txt['story-title']     ?? null,
        story_text:           txt['story-body']      ?? null,
      }
    case 'activity-log': {
      let species: string[] = []
      try { species = JSON.parse(txt['activities'] ?? '[]') } catch {}
      return {
        highlight_species:    species,
        best_watching_hours:  txt['best-hours'] ?? '',
        nearby_hotspot_trail: txt['hotspot']    ?? '',
      }
    }
    case 'rules-block': {
      let rowsMeta: { rowId: string; cols: string[] }[] = []
      try { rowsMeta = JSON.parse(txt['rules-rows'] ?? '[]') } catch {}
      const sections = rowsMeta.map(row => ({
        rowId: row.rowId,
        cols:  row.cols.map(secId => ({
          id:    secId,
          title: txt[`${secId}-title`] ?? '',
          items: (() => { try { return JSON.parse(txt[`${secId}-items`] ?? '[]') } catch { return [] } })(),
        })),
      }))
      return { title: txt['rules-title'] ?? '', sections }
    }
    case 'how-to-reach': {
      let rowsMeta: { rowId: string; cols: string[] }[] = []
      try { rowsMeta = JSON.parse(txt['reach-rows'] ?? '[]') } catch {}
      const sections = rowsMeta.map(row => ({
        rowId: row.rowId,
        cols:  row.cols.map(secId => ({
          id:    secId,
          title: txt[`${secId}-title`] ?? '',
          items: (() => { try { return JSON.parse(txt[`${secId}-items`] ?? '[]') } catch { return [] } })(),
        })),
      }))
      return { title: txt['reach-title'] ?? '', sections }
    }
    case 'video': {
      const raw = txt['youtube-url'] ?? ''
      return { youtube_video_id: raw ? extractYouTubeId(raw) : null }  // live reads youtube_video_id
    }
    case 'gallery': {
      type GalleryItem = { key: string; ratio: string }
      let meta: GalleryItem[] = []
      try { meta = JSON.parse(txt['gallery-meta'] ?? '[]') } catch {}
      // Fall back to key scan if no meta
      if (meta.length === 0) {
        meta = Object.keys(img)
          .filter(k => k.startsWith('gallery-'))
          .sort()
          .map(k => ({ key: k, ratio: 'square' }))
      }
      const isValidUrl = (url: string | null) =>
        url !== null && !url.startsWith('blob:') && !url.startsWith('data:') && url.startsWith('http')

      const items = meta
        .map(m => ({ url: img[m.key] ?? null, ratio: m.ratio || 'square' }))
        .filter(item => isValidUrl(item.url))
      return { items }
    }
    case 'rooms': {
      let ids: string[] = []
      try { ids = JSON.parse(txt['rooms-meta'] ?? '[]') } catch {}
      const rooms = ids.map(rid => ({
        id:        rid,
        image_url: img[rid]                ?? null,
        name:      txt[`${rid}-name`]      ?? '',
        guests:    txt[`${rid}-guests`]    ?? '',
        price:     txt[`${rid}-price`]     ?? '',
        details:   txt[`${rid}-details`]   ?? '',
      }))
      return { title: txt['rooms-title'] ?? '', rooms }
    }
    case 'food': {
      let ids: string[] = []
      try { ids = JSON.parse(txt['food-meta'] ?? '[]') } catch {}
      return {
        label:       txt['food-label'] ?? '',
        title:       txt['food-title'] ?? '',
        description: txt['food-desc']  ?? '',
        items: ids.map(fid => ({
          id:        fid,
          image_url: img[fid]               ?? null,
          name:      txt[`${fid}-name`]     ?? '',
          desc:      txt[`${fid}-desc`]     ?? '',
        })),
      }
    }
    case 'map':
      return {
        location:    txt['map-location']     ?? '',
        region:      txt['map-region']       ?? '',
        nearest_town: txt['map-nearest-town'] ?? '',
      }
    case 'contact':
      return {
        host_name:          txt['contact-host-name']          ?? null,
        phone:              txt['contact-phone']              ?? null,
        phone_show:         txt['contact-phone-show']         !== 'false',
        whatsapp:           txt['contact-whatsapp']           ?? null,
        whatsapp_show:      txt['contact-whatsapp-show']      !== 'false',
        alt_phone:          txt['contact-alt-phone']          ?? null,
        alt_phone_show:     txt['contact-alt-phone-show']     !== 'false',
        alt_whatsapp:       txt['contact-alt-whatsapp']       ?? null,
        alt_whatsapp_show:  txt['contact-alt-whatsapp-show']  !== 'false',
        email:              txt['contact-email']              ?? null,
        email_show:         txt['contact-email-show']         !== 'false',
        address:            txt['contact-address']            ?? null,
        address_show:       txt['contact-address-show']       !== 'false',
        calling_window:     txt['contact-calling-window']     ?? null,
        calling_window_show: txt['contact-calling-window-show'] !== 'false',
        website:            txt['contact-website']            ?? null,
        website_show:       txt['contact-website-show']       !== 'false',
        instagram:          txt['contact-instagram']          ?? null,
        instagram_show:     txt['contact-instagram-show']     !== 'false',
        facebook:           txt['contact-facebook']           ?? null,
        facebook_show:      txt['contact-facebook-show']      !== 'false',
        youtube:            txt['contact-youtube']            ?? null,
        youtube_show:       txt['contact-youtube-show']       !== 'false',
      }
    default:
      return {}
  }
}

export async function publishHomestay(payload: PublishPayload) {
  const supabase = createClient()

  const parts    = payload.address.split(',').map(s => s.trim())
  const village  = parts[0] ?? payload.address
  const district = parts[1] ?? village

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

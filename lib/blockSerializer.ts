import type { CanvasBlock } from '@/app/admin/builder/_components/BuilderTypes'

function extractYouTubeId(raw: string): string {
  try {
    const u = new URL(raw)
    if (u.hostname.includes('youtu.be'))    return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') ?? raw
  } catch {}
  return raw
}

export function toContentData(block: CanvasBlock): Record<string, unknown> {
  const img = block.props.images ?? {}
  const txt = block.props.texts  ?? {}

  switch (block.type) {
    case 'hero':
      return {
        cover_image_url: img['cover']   ?? null,
        tagline:         txt['tagline'] ?? null,
      }
    case 'host-story':
      return {
        host_image_url:       img['host-photo']    ?? null,
        host_photo_shape:     txt['host-shape']    ?? 'circle',
        host_photo_position:  txt['host-position'] ?? 'center',
        host_photo_zoom:      parseFloat(txt['host-zoom'] ?? '1'),
        story_title:          txt['story-title']   ?? null,
        story_text:           txt['story-body']    ?? null,
      }
    case 'activity-log': {
      let activities: unknown[] = []
      try { activities = JSON.parse(txt['activities'] ?? '[]') } catch {}
      return {
        highlight_species:    activities,
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
      return { youtube_video_id: raw ? extractYouTubeId(raw) : null }
    }
    case 'gallery': {
      type GalleryItem = { key: string; ratio: string }
      let meta: GalleryItem[] = []
      try { meta = JSON.parse(txt['gallery-meta'] ?? '[]') } catch {}
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
        image_url: img[rid]             ?? null,
        name:      txt[`${rid}-name`]   ?? '',
        guests:    txt[`${rid}-guests`] ?? '',
        price:     txt[`${rid}-price`]  ?? '',
        details:   txt[`${rid}-details`] ?? '',
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
          image_url: img[fid]             ?? null,
          name:      txt[`${fid}-name`]   ?? '',
          desc:      txt[`${fid}-desc`]   ?? '',
        })),
      }
    }
    case 'map':
      return {
        location:     txt['map-location']     ?? '',
        region:       txt['map-region']       ?? '',
        nearest_town: txt['map-nearest-town'] ?? '',
      }
    case 'contact':
      return {
        host_name:           txt['contact-host-name']             ?? null,
        phone:               txt['contact-phone']                 ?? null,
        phone_show:          txt['contact-phone-show']            !== 'false',
        whatsapp:            txt['contact-whatsapp']              ?? null,
        whatsapp_show:       txt['contact-whatsapp-show']         !== 'false',
        alt_phone:           txt['contact-alt-phone']             ?? null,
        alt_phone_show:      txt['contact-alt-phone-show']        !== 'false',
        alt_whatsapp:        txt['contact-alt-whatsapp']          ?? null,
        alt_whatsapp_show:   txt['contact-alt-whatsapp-show']     !== 'false',
        email:               txt['contact-email']                 ?? null,
        email_show:          txt['contact-email-show']            !== 'false',
        address:             txt['contact-address']               ?? null,
        address_show:        txt['contact-address-show']          !== 'false',
        calling_window:      txt['contact-calling-window']        ?? null,
        calling_window_show: txt['contact-calling-window-show']   !== 'false',
        website:             txt['contact-website']               ?? null,
        website_show:        txt['contact-website-show']          !== 'false',
        instagram:           txt['contact-instagram']             ?? null,
        instagram_show:      txt['contact-instagram-show']        !== 'false',
        facebook:            txt['contact-facebook']              ?? null,
        facebook_show:       txt['contact-facebook-show']         !== 'false',
        youtube:             txt['contact-youtube']               ?? null,
        youtube_show:        txt['contact-youtube-show']          !== 'false',
      }
    default:
      return {}
  }
}

const STYLE_SUFFIXES = ['-font', '-size', '-color', '-bold', '-italic', '-align', '-fit', '-bullet']

/** Full serialization including styles, layout rows, and sub-texts */
export function serializeBlock(block: CanvasBlock): Record<string, unknown> {
  const content  = toContentData(block)
  const txt      = block.props.texts  ?? {}
  const imgMap   = block.props.images ?? {}

  // Styles
  const styles: Record<string, string> = {}
  for (const [k, v] of Object.entries(txt)) {
    if (STYLE_SUFFIXES.some(s => k.endsWith(s))) styles[k] = v
  }
  if (Object.keys(styles).length > 0) (content as any).styles = styles

  // Layout rows
  const layoutRowsRaw = txt['layout-rows']
  if (layoutRowsRaw) {
    try {
      const rows = JSON.parse(layoutRowsRaw)
      const allCellIds: string[] = rows.flatMap((r: any) => (r.cells ?? []).map((c: any) => c.id as string))
      const cells: Record<string, string> = {}
      const layoutImages: Record<string, string> = {}
      for (const cellId of allCellIds) {
        if (txt[cellId])            cells[cellId] = txt[cellId]
        if (txt[`${cellId}-items`]) cells[`${cellId}-items`] = txt[`${cellId}-items`]
        STYLE_SUFFIXES.forEach(s => { if (txt[`${cellId}${s}`]) cells[`${cellId}${s}`] = txt[`${cellId}${s}`] })
        if (imgMap[cellId]) layoutImages[cellId] = imgMap[cellId]
      }
      if (rows.length > 0) (content as any).layout = { rows, cells, images: layoutImages }
    } catch {}
  }

  // Sub-texts
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

  return content
}

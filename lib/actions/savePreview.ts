'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/adminAuth'
import type { CanvasBlock } from '@/app/admin/builder/_components/BuilderTypes'
import { serializeBlock } from '@/lib/blockSerializer'
import { toSlug } from '@/lib/homestaySlug'
import { isLive, saveLaunchLink } from '@/lib/launchLinks'
import type { PublishPayload } from '@/lib/publishHomestay'

export interface PreviewMeta {
  title:     string
  address:   string
  languages: string[]
}

export interface PreviewLocation {
  lat: number
  lng: number
}

// Whether the host can launch from this preview, or what is missing (shown to the admin).
// null: the homestay is already live, so its preview only shows the changes.
export type PreviewLaunch = { ready: true; email: string } | { ready: false; reason: string } | null

export async function savePreview(
  blocks:    CanvasBlock[],
  slug?:     string | null,
  pageMeta?: PreviewMeta,
  location?: PreviewLocation | null,
): Promise<{ token: string; launch: PreviewLaunch } | { error: string }> {
  assertAdmin()
  const supabase  = createAdminClient()
  const expiresAt = new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString()   // 4 days

  const blocksData = blocks.map(block => ({
    type:         block.type,
    content_data: serializeBlock(block),
  }))

  const payload = {
    blocks_data: blocksData,
    page_meta:   pageMeta ?? null,
    expires_at:  expiresAt,
  }

  let token: string | null = null

  // If slug provided, update existing preview for this homestay
  if (slug) {
    const { data: existing } = await supabase
      .from('homestay_previews')
      .select('token')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('homestay_previews')
        .update(payload)
        .eq('token', existing.token)
      if (error) return { error: error.message }
      token = existing.token
    }
  }

  if (!token) {
    const { data, error } = await supabase
      .from('homestay_previews')
      .insert({ slug: slug ?? null, ...payload })
      .select('token')
      .single()

    if (error) return { error: error.message }
    token = data.token as string
  }

  return { token, launch: await prepareLaunch(blocks, slug, pageMeta, location) }
}

// A new homestay's preview comes with its launch: the same page, its location and the host's details,
// so the host can tick "everything is correct" on the preview and launch it themselves.
async function prepareLaunch(
  blocks:    CanvasBlock[],
  draftSlug: string | null | undefined,
  meta:      PreviewMeta | undefined,
  location:  PreviewLocation | null | undefined,
): Promise<PreviewLaunch> {
  if (draftSlug && await isLive(draftSlug)) return null

  const title = meta?.title?.trim() ?? ''
  if (!toSlug(title)) return { ready: false, reason: 'Give the homestay a name, so the host can launch from this preview.' }
  if (!draftSlug)     return { ready: false, reason: 'Save the draft first, so the host can launch from this preview.' }
  if (!location)      return { ready: false, reason: 'Set the map location (📍 next to the address), so the host can launch from this preview.' }

  const contact = blocks.find(b => b.type === 'contact')?.props.texts ?? {}
  const launchPayload: PublishPayload = {
    slug:      toSlug(title),
    draftSlug,
    title,
    hostName:  contact['contact-host-name'] ?? '',
    phone:     contact['contact-phone']     ?? '',
    whatsapp:  contact['contact-whatsapp']  ?? '',
    email:     contact['contact-email']     ?? '',
    address:   meta?.address ?? '',
    languages: meta?.languages ?? [],
    latitude:  location.lat,
    longitude: location.lng,
    blocks,
  }

  const saved = await saveLaunchLink(launchPayload)
  return 'error' in saved ? { ready: false, reason: saved.error } : { ready: true, email: launchPayload.email.trim() }
}

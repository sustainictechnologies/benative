'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CanvasBlock } from '@/app/admin/builder/_components/BuilderTypes'
import { serializeBlock } from '@/lib/blockSerializer'

export interface PreviewMeta {
  title:     string
  address:   string
  languages: string[]
}

export async function savePreview(
  blocks:   CanvasBlock[],
  slug?:    string | null,
  pageMeta?: PreviewMeta,
): Promise<{ token: string } | { error: string }> {
  const supabase  = createAdminClient()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const blocksData = blocks.map(block => ({
    type:         block.type,
    content_data: serializeBlock(block),
  }))

  const payload = {
    blocks_data: blocksData,
    page_meta:   pageMeta ?? null,
    expires_at:  expiresAt,
  }

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
      return { token: existing.token }
    }
  }

  const { data, error } = await supabase
    .from('homestay_previews')
    .insert({ slug: slug ?? null, ...payload })
    .select('token')
    .single()

  if (error) return { error: error.message }
  return { token: data.token }
}

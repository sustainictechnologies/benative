'use server'

import { createClient } from '@/lib/supabase/server'
import type { CanvasBlock } from '@/app/admin/builder/_components/BuilderTypes'
import { serializeBlock } from '@/lib/blockSerializer'

export async function savePreview(
  blocks: CanvasBlock[],
  slug?: string | null,
): Promise<{ token: string } | { error: string }> {
  const supabase = createClient()

  const blocksData = blocks.map(block => ({
    type:         block.type,
    content_data: serializeBlock(block),
  }))

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
        .update({ blocks_data: blocksData })
        .eq('token', existing.token)
      if (error) return { error: error.message }
      return { token: existing.token }
    }
  }

  const { data, error } = await supabase
    .from('homestay_previews')
    .insert({ slug: slug ?? null, blocks_data: blocksData })
    .select('token')
    .single()

  if (error) return { error: error.message }
  return { token: data.token }
}

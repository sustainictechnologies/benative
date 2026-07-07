'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CanvasBlock } from '@/app/admin/builder/_components/BuilderTypes'

export interface DraftPayload {
  slug?:          string
  pageName:       string
  pageHighlights: string[]
  pageLanguages:  string[]
  pageAddress:    string
  blocks:         CanvasBlock[]
}

function toDraftSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'draft'
  return `${base}-${Date.now().toString(36)}`
}

export async function saveDraft(
  payload: DraftPayload
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const supabase = createAdminClient()

  const draft_data = {
    blocks:         payload.blocks,
    pageName:       payload.pageName,
    pageHighlights: payload.pageHighlights,
    pageLanguages:  payload.pageLanguages,
    pageAddress:    payload.pageAddress,
  }

  if (payload.slug) {
    const { error } = await supabase
      .from('homestays')
      .update({ draft_data })
      .eq('slug', payload.slug)

    if (error) return { success: false, error: error.message }
    return { success: true, slug: payload.slug }
  }

  // New homestay — create a minimal record to attach the draft to
  const slug = toDraftSlug(payload.pageName)
  const { error } = await supabase
    .from('homestays')
    .insert({
      slug,
      title:             payload.pageName || 'Draft Homestay',
      host_name:         '',
      contact_phone:     '',
      village_name:      '',
      location_district: '',
      latitude:          0,
      longitude:         0,
      draft_data,
    })

  if (error) return { success: false, error: error.message }
  return { success: true, slug }
}

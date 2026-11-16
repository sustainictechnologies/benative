// Launch links (table homestay_launches): what the host launches from their preview page.
// Not a server action itself: callers check who is allowed first (savePreview: the admin).

import { createAdminClient } from '@/lib/supabase/admin'
import { nameTakenError, type PublishPayload } from '@/lib/publishHomestay'

// A launch link works for 4 days, like the preview it comes with
const LINK_LIFETIME_MS = 96 * 60 * 60 * 1000

// Live = a homestay with a location at this address (a draft has none)
export async function isLive(slug: string) {
  const { data } = await createAdminClient().from('homestays').select('latitude').eq('slug', slug).maybeSingle()
  return !!data && data.latitude !== 0
}

// Saves everything publishing needs, so the host launches exactly the page in their preview.
// Saving again updates the same link, also one launched before and taken off the site since
// (Delete → Drafts): the host can then launch it again.
export async function saveLaunchLink(payload: PublishPayload): Promise<{ token: string } | { error: string }> {
  const supabase  = createAdminClient()
  const hostEmail = payload.email.trim().toLowerCase()

  if (!payload.draftSlug) return { error: 'Save the draft first, so the host can launch from the preview.' }
  if (!hostEmail)         return { error: "Add the host's email in the Contact section: the host signs in with it to launch." }

  const takenErr = await nameTakenError(payload)
  if (takenErr) return { error: takenErr }

  const { data: existing } = await supabase
    .from('homestay_launches')
    .select('launched_at, live_slug')
    .eq('draft_slug', payload.draftSlug)
    .maybeSingle()
  // Launched and on the site (or being launched this moment, before live_slug is saved): changes go live with Publish
  if (existing?.launched_at && (!existing.live_slug || await isLive(existing.live_slug))) {
    return { error: 'The host has already launched this homestay. Use Publish to update it.' }
  }

  const { data, error } = await supabase
    .from('homestay_launches')
    .upsert(
      {
        draft_slug: payload.draftSlug,
        payload,
        host_email: hostEmail,
        expires_at: new Date(Date.now() + LINK_LIFETIME_MS).toISOString(),
        updated_at: new Date().toISOString(),
        // Ready to launch: clears an earlier launch of a homestay since taken off the site
        launched_at: null,
        launched_by: null,
        live_slug:   null,
      },
      { onConflict: 'draft_slug' }
    )
    .select('token')
    .single()

  if (error) return { error: error.message }
  return { token: data.token }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { publishToSite, type PublishPayload } from '@/lib/publishHomestay'
import { isLive } from '@/lib/launchLinks'

export type LaunchResult =
  | { success: true; slug: string }
  | { success: false; reason: 'signin' | 'email' | 'expired' | 'missing' | 'publish' }

// The host's Launch button on /launch/[token] (reached from their preview page). Only the host, signed in
// with the email saved for the homestay, may launch; the link launches once. On launch the host's account
// is linked to the homestay (Host Dashboard). No email: Admin → Homestays shows it live like any other.
export async function launchHomestay(token: string): Promise<LaunchResult> {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return { success: false, reason: 'signin' }

  const supabase = createAdminClient()
  const { data: launch } = await supabase
    .from('homestay_launches')
    .select('payload, host_email, expires_at, launched_at, live_slug')
    .eq('token', token)
    .maybeSingle()

  if (!launch) return { success: false, reason: 'missing' }
  const payload = launch.payload as PublishPayload

  // Pressing Launch again (or a second tab) after it went live
  if (launch.launched_at) return { success: true, slug: launch.live_slug ?? payload.slug }
  if (new Date(launch.expires_at) < new Date()) return { success: false, reason: 'expired' }
  if (!user.email_confirmed_at || user.email?.toLowerCase() !== launch.host_email) return { success: false, reason: 'email' }

  // Published in the meantime with the admin's Publish button: nothing left to launch
  if (await isLive(payload.slug)) return { success: true, slug: payload.slug }

  // Claim the link, so two presses at once launch only once
  const { data: claimed } = await supabase
    .from('homestay_launches')
    .update({ launched_at: new Date().toISOString(), launched_by: user.id })
    .eq('token', token)
    .is('launched_at', null)
    .select('token')

  if (!claimed?.length) {
    const { data: again } = await supabase.from('homestay_launches').select('live_slug').eq('token', token).single()
    return { success: true, slug: again?.live_slug ?? payload.slug }
  }

  const result = await publishToSite(payload)
  if (!result.success) {
    console.error('[launch] publish failed:', result.error)
    await supabase.from('homestay_launches').update({ launched_at: null, launched_by: null }).eq('token', token)
    return { success: false, reason: 'publish' }
  }

  await Promise.all([
    supabase.from('homestay_launches').update({ live_slug: payload.slug }).eq('token', token),
    // The host's account now opens the Host Dashboard for this homestay (unless it is linked to someone already)
    supabase.from('homestays').update({ host_user_id: user.id }).eq('slug', payload.slug).is('host_user_id', null),
  ])

  // No revalidatePath, as with the admin's Publish: it would also refresh the launch page in the middle
  // of its sunrise, and the homepage and Discover read fresh data anyway
  return { success: true, slug: payload.slug }
}

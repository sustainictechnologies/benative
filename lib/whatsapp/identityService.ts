import { createAdminClient } from '@/lib/supabase/admin'

export interface WhatsAppIdentity {
  id:             string
  homestay_id:    string | null
  whatsapp_phone: string
  is_verified:    boolean
}

/**
 * Returns the existing identity for this phone number, or creates a new
 * (unlinked) one if this is the first time we've seen the number.
 */
export async function getOrCreateIdentity(
  phone: string,
): Promise<WhatsAppIdentity> {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('whatsapp_identities')
    .select('id, homestay_id, whatsapp_phone, is_verified')
    .eq('whatsapp_phone', phone)
    .maybeSingle()

  if (existing) return existing as WhatsAppIdentity

  const { data: created, error } = await supabase
    .from('whatsapp_identities')
    .insert({ whatsapp_phone: phone })
    .select('id, homestay_id, whatsapp_phone, is_verified')
    .single()

  if (error || !created) {
    throw new Error(`Failed to create WhatsApp identity for ${phone}: ${error?.message}`)
  }

  return created as WhatsAppIdentity
}

/**
 * Links an identity to the homestay its phone number was matched to.
 */
export async function linkIdentityToHomestay(
  identityId: string,
  homestayId: string,
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('whatsapp_identities')
    .update({ homestay_id: homestayId, is_verified: true })
    .eq('id', identityId)

  if (error) {
    throw new Error(`Failed to link WhatsApp identity ${identityId}: ${error.message}`)
  }
}

/**
 * Returns the unfinished action stored for this identity, or null if there
 * is none or it is older than maxAgeMinutes.
 */
export async function getPendingAction<T>(
  identityId:    string,
  maxAgeMinutes: number,
): Promise<T | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('whatsapp_identities')
    .select('pending_action, pending_updated_at')
    .eq('id', identityId)
    .single()

  if (error) {
    throw new Error(`Failed to read pending action for ${identityId}: ${error.message}`)
  }

  if (!data.pending_action || !data.pending_updated_at) return null

  const ageMs = Date.now() - new Date(data.pending_updated_at).getTime()
  if (ageMs > maxAgeMinutes * 60_000) return null

  return data.pending_action as T
}

/**
 * Stores the unfinished action for this identity. Pass null to clear it.
 */
export async function setPendingAction(
  identityId: string,
  action:     object | null,
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('whatsapp_identities')
    .update({
      pending_action:     action,
      pending_updated_at: action ? new Date().toISOString() : null,
    })
    .eq('id', identityId)

  if (error) {
    throw new Error(`Failed to store pending action for ${identityId}: ${error.message}`)
  }
}

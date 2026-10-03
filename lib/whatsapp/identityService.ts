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

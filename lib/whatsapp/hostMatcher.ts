import { createAdminClient } from '@/lib/supabase/admin'

export interface MatchedHomestay {
  id:        string
  title:     string
  host_name: string
}

/** Last 10 digits of each phone number found in a free-text field. */
function phoneKeys(raw: unknown): string[] {
  if (typeof raw !== 'string') return []
  return raw
    .split(/[\/,;|\n]/)
    .map(part => part.replace(/\D/g, ''))
    .filter(digits => digits.length >= 10)
    .map(digits => digits.slice(-10))
}

/**
 * Returns every homestay whose primary, WhatsApp or alternate number
 * matches the sender's phone.
 */
export async function findHomestaysByPhone(
  phone: string,
): Promise<MatchedHomestay[]> {
  const [senderKey] = phoneKeys(phone)
  if (!senderKey) return []

  const supabase = createAdminClient()

  const [homestays, blocks] = await Promise.all([
    supabase
      .from('homestays')
      .select('id, title, host_name, contact_phone, whatsapp_number'),
    supabase
      .from('homestay_blocks')
      .select('homestay_id, content_data')
      .eq('block_type', 'contact'),
  ])

  if (homestays.error) throw new Error(`Host lookup failed: ${homestays.error.message}`)
  if (blocks.error)    throw new Error(`Host lookup failed: ${blocks.error.message}`)

  const matchedIds = new Set<string>()

  for (const h of homestays.data ?? []) {
    const keys = [h.contact_phone, h.whatsapp_number].flatMap(phoneKeys)
    if (keys.includes(senderKey)) matchedIds.add(h.id)
  }

  for (const b of blocks.data ?? []) {
    const c    = b.content_data ?? {}
    const keys = [c.phone, c.whatsapp, c.alt_phone, c.alt_whatsapp].flatMap(phoneKeys)
    if (keys.includes(senderKey)) matchedIds.add(b.homestay_id)
  }

  return (homestays.data ?? [])
    .filter(h => matchedIds.has(h.id))
    .map(h => ({ id: h.id, title: h.title, host_name: h.host_name }))
}

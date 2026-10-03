import { createAdminClient } from '@/lib/supabase/admin'
import type { InboundMessage } from './types'

/**
 * Persists an inbound message.
 * If meta_message_id already exists the insert is silently skipped (idempotent).
 * Returns true if the message was newly inserted, false if it was a duplicate.
 */
export async function storeInboundMessage(
  identityId: string | null,
  msg:        InboundMessage,
): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('whatsapp_messages')
    .insert({
      identity_id:     identityId,
      meta_message_id: msg.metaMessageId,
      direction:       'inbound',
      message_type:    msg.messageType,
      message_text:    msg.messageText,
      raw_payload:     msg.rawPayload,
    })

  if (error) {
    // Unique constraint violation → duplicate delivery, not an error
    if (error.code === '23505') return false
    throw new Error(`Failed to store WhatsApp message ${msg.metaMessageId}: ${error.message}`)
  }

  return true
}

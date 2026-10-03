import { NextRequest, NextResponse } from 'next/server'
import { whatsappConfig } from '@/lib/whatsapp/config'
import { getOrCreateIdentity, linkIdentityToHomestay } from '@/lib/whatsapp/identityService'
import { storeInboundMessage } from '@/lib/whatsapp/messageStore'
import { sendTextMessage, sendButtonsMessage } from '@/lib/whatsapp/sender'
import { findHomestaysByPhone } from '@/lib/whatsapp/hostMatcher'
import { handleHostMessage } from '@/lib/whatsapp/assistant'
import type { MetaWebhookPayload, InboundMessage } from '@/lib/whatsapp/types'

// ── GET — Meta webhook verification ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (
    mode      === 'subscribe' &&
    token     === whatsappConfig.verifyToken &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ── POST — receive Meta webhook events ───────────────────────────────────────

export async function POST(req: NextRequest) {
  // Always return 200 quickly so Meta doesn't retry
  try {
    const body = (await req.json()) as MetaWebhookPayload

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ ok: true })
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue

        const messages = change.value.messages ?? []

        for (const metaMsg of messages) {
          const msg: InboundMessage = {
            metaMessageId: metaMsg.id,
            fromPhone:     metaMsg.from,
            messageType:   metaMsg.type,
            // A tapped reply button arrives as its title, the same as if it were typed
            messageText:   metaMsg.text?.body ?? metaMsg.interactive?.button_reply?.title ?? null,
            rawPayload:    body,
          }

          console.log(
            '[WhatsApp] inbound — id:', msg.metaMessageId,
            '| from:', msg.fromPhone,
            '| text:', msg.messageText,
          )

          const identity = await getOrCreateIdentity(msg.fromPhone)
          const isNew    = await storeInboundMessage(identity.id, msg)

          // Meta may deliver the same message twice — act on it only once
          if (!isNew) {
            console.log('[WhatsApp] duplicate delivery — skipped:', msg.metaMessageId)
            continue
          }

          if (msg.messageText !== null) {
            const matches = await findHomestaysByPhone(msg.fromPhone)
            console.log(
              '[WhatsApp] host match — count:', matches.length,
              '| homestays:', matches.map(m => m.title).join(', ') || 'none',
            )

            if (matches.length === 1 && identity.homestay_id !== matches[0].id) {
              await linkIdentityToHomestay(identity.id, matches[0].id)
            }

            const reply       = await handleHostMessage(identity.id, matches, msg.messageText)
            const replyStatus = reply.buttons
              ? await sendButtonsMessage(msg.fromPhone, reply.text, reply.buttons)
              : await sendTextMessage(msg.fromPhone, reply.text)
            console.log('[WhatsApp] reply sent — status:', replyStatus)
          }
        }
      }
    }
  } catch (err) {
    // Log but still return 200 — Meta must not retry
    console.error('[WhatsApp webhook] POST error:', err)
  }

  return NextResponse.json({ ok: true })
}

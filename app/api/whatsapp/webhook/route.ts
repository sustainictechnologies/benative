import { NextRequest, NextResponse } from 'next/server'
import { whatsappConfig } from '@/lib/whatsapp/config'
import { getOrCreateIdentity } from '@/lib/whatsapp/identityService'
import { storeInboundMessage } from '@/lib/whatsapp/messageStore'
import { sendTextMessage } from '@/lib/whatsapp/sender'
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
            messageText:   metaMsg.text?.body ?? null,
            rawPayload:    body,
          }

          console.log(
            '[WhatsApp] inbound — id:', msg.metaMessageId,
            '| from:', msg.fromPhone,
            '| text:', msg.messageText,
          )

          const identity = await getOrCreateIdentity(msg.fromPhone)
          await storeInboundMessage(identity.id, msg)

          if (msg.messageType === 'text') {
            const replyStatus = await sendTextMessage(msg.fromPhone, 'Hello from BeNative 👋')
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

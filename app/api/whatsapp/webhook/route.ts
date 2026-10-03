import { NextRequest, NextResponse } from 'next/server'
import { whatsappConfig } from '@/lib/whatsapp/config'
import { getOrCreateIdentity } from '@/lib/whatsapp/identityService'
import { storeInboundMessage } from '@/lib/whatsapp/messageStore'
import type { MetaWebhookPayload, InboundMessage } from '@/lib/whatsapp/types'

// ── GET — Meta webhook verification ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const storedToken = whatsappConfig.verifyToken
  console.log('[WhatsApp webhook] GET verify — received:', token, '| stored length:', storedToken.length, '| match:', token === storedToken)

  if (
    mode      === 'subscribe' &&
    token     === storedToken &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ── POST — receive Meta webhook events ───────────────────────────────────────

export async function POST(req: NextRequest) {
  // Always return 200 quickly so Meta doesn't retry
  console.log('[WhatsApp webhook] POST received from:', req.headers.get('x-forwarded-for') ?? 'unknown')
  try {
    const body = (await req.json()) as MetaWebhookPayload
    console.log('[WhatsApp webhook] POST body object:', body.object, '| entries:', body.entry?.length ?? 0)

    if (body.object !== 'whatsapp_business_account') {
      console.log('[WhatsApp webhook] POST skipped — unexpected object:', body.object)
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

          const identity = await getOrCreateIdentity(msg.fromPhone)
          await storeInboundMessage(identity.id, msg)
        }
      }
    }
  } catch (err) {
    // Log but still return 200 — Meta must not retry
    console.error('[WhatsApp webhook] POST error:', err)
  }

  return NextResponse.json({ ok: true })
}

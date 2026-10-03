import { whatsappConfig } from './config'

const GRAPH_API_VERSION = 'v20.0'

/**
 * Sends a plain-text WhatsApp message via Meta Cloud API.
 * Returns the HTTP status code from the Graph API response.
 */
export async function sendTextMessage(
  toPhone: string,
  text:    string,
): Promise<number> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappConfig.phoneNumberId}/messages`

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${whatsappConfig.accessToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to:                toPhone,
      type:              'text',
      text:              { body: text },
    }),
  })

  if (res.status !== 200) {
    const errBody = await res.text()
    console.error('[WhatsApp] reply error body:', errBody)
  }

  return res.status
}

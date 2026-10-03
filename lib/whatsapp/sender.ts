import { whatsappConfig } from './config'

const GRAPH_API_VERSION = 'v20.0'

/**
 * Posts one message to the Meta Cloud API.
 * Returns the HTTP status code from the Graph API response.
 */
async function postMessage(
  toPhone: string,
  message: Record<string, unknown>,
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
      ...message,
    }),
  })

  if (res.status !== 200) {
    const errBody = await res.text()
    console.error('[WhatsApp] reply error body:', errBody)
  }

  return res.status
}

/**
 * Sends a plain-text WhatsApp message via Meta Cloud API.
 * Returns the HTTP status code from the Graph API response.
 */
export async function sendTextMessage(
  toPhone: string,
  text:    string,
): Promise<number> {
  return postMessage(toPhone, {
    type: 'text',
    text: { body: text },
  })
}

/**
 * Sends a message with up to three tappable reply buttons.
 * Returns the HTTP status code from the Graph API response.
 */
export async function sendButtonsMessage(
  toPhone: string,
  text:    string,
  buttons: { id: string; title: string }[],
): Promise<number> {
  return postMessage(toPhone, {
    type:        'interactive',
    interactive: {
      type:   'button',
      body:   { text },
      action: {
        buttons: buttons.map(button => ({
          type:  'reply',
          reply: { id: button.id, title: button.title },
        })),
      },
    },
  })
}

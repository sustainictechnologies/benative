// Meta WhatsApp Cloud API webhook payload shapes (Phase 1 — messages only)

export interface MetaWebhookPayload {
  object: string
  entry:  MetaEntry[]
}

export interface MetaEntry {
  id:      string
  changes: MetaChange[]
}

export interface MetaChange {
  value: MetaChangeValue
  field: string
}

export interface MetaChangeValue {
  messaging_product: string
  metadata: {
    display_phone_number: string
    phone_number_id:      string
  }
  contacts?: MetaContact[]
  messages?: MetaMessage[]
  statuses?: MetaStatus[]
}

export interface MetaContact {
  profile: { name: string }
  wa_id:   string
}

export interface MetaMessage {
  id:        string
  from:      string   // sender's WhatsApp phone number
  timestamp: string
  type:      string   // 'text' | 'interactive' | 'image' | 'audio' | 'document' | ...
  text?:     { body: string }
  interactive?: {
    type:          string   // 'button_reply' when the user taps a reply button
    button_reply?: { id: string; title: string }
  }
}

export interface MetaStatus {
  id:          string
  status:      string
  timestamp:   string
  recipient_id: string
}

// Parsed, normalised inbound message (what our services work with)
export interface InboundMessage {
  metaMessageId: string
  fromPhone:     string
  messageType:   string
  messageText:   string | null
  rawPayload:    MetaWebhookPayload
}

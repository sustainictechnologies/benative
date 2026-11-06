'use server'

import { assertAdmin } from '@/lib/adminAuth'
import { publishToSite, type PublishPayload } from '@/lib/publishHomestay'

export type { PublishPayload }

// The admin's Publish button. The publishing itself is shared with the host's Launch button.
export async function publishHomestay(payload: PublishPayload) {
  assertAdmin()
  return publishToSite(payload)
}

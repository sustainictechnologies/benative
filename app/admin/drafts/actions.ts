'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function discardDraft(slug: string, deleteRecord: boolean) {
  const supabase = createAdminClient()

  if (deleteRecord) {
    await supabase.from('homestays').delete().eq('slug', slug)
  } else {
    await supabase.from('homestays').update({ draft_data: null }).eq('slug', slug)
  }

  revalidatePath('/admin/drafts')
}

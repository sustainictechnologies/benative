'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function uploadHomepageImage(
  formData: FormData,
): Promise<{ error?: string; success?: boolean; url?: string }> {
  const slot = formData.get('slot') as string
  const file = formData.get('file') as File
  if (!slot || !file) return { error: 'Missing slot or file' }

  const supabase = createAdminClient()
  const path = `${slot}.jpg`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('homepage')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('homepage').getPublicUrl(path)
  // strip any existing ?v= before adding fresh one
  const baseUrl = publicUrl.split('?')[0]
  const url = `${baseUrl}?v=${Date.now()}`

  const { error: dbError, data: upserted } = await supabase
    .from('homepage_images')
    .upsert(
      { slot, image_url: url, updated_at: new Date().toISOString() },
      { onConflict: 'slot', ignoreDuplicates: false }
    )
    .select('slot')

  if (dbError) return { error: dbError.message }
  if (!upserted || upserted.length === 0) return { error: `Slot "${slot}" not found in homepage_images table` }

  revalidatePath('/')
  revalidatePath('/discover')
  return { success: true, url }
}

export async function clearHomepageImage(
  slot: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('homepage_images')
    .upsert(
      { slot, image_url: null, updated_at: new Date().toISOString() },
      { onConflict: 'slot', ignoreDuplicates: false }
    )

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/discover')
  return { success: true }
}

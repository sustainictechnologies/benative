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

  const { error: dbError, data: updated } = await supabase
    .from('homepage_images')
    .update({ image_url: url, updated_at: new Date().toISOString() })
    .eq('slot', slot)
    .select('slot')

  if (dbError) return { error: dbError.message }
  if (!updated || updated.length === 0) return { error: `Slot "${slot}" not found — re-run the homepage_images SQL setup` }

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
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq('slot', slot)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/discover')
  return { success: true }
}

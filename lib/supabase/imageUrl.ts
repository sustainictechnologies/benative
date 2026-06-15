type ResizeMode = 'cover' | 'contain' | 'fill'

interface TransformOptions {
  width?: number
  quality?: number
  resize?: ResizeMode
}

/**
 * Converts a Supabase storage URL to use the built-in image transform endpoint.
 * Non-Supabase URLs are returned unchanged.
 */
export function supabaseImgUrl(
  url: string | null | undefined,
  options: TransformOptions = {}
): string {
  if (!url) return ''
  if (!url.includes('/storage/v1/object/public/')) return url

  const { width = 800, quality = 75, resize = 'cover' } = options
  const base = url.replace('/storage/v1/object/public/', '/storage/v1/render/v1/public/')
  return `${base}?width=${width}&quality=${quality}&resize=${resize}`
}

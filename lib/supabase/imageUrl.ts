type ResizeMode = 'cover' | 'contain' | 'fill'

interface TransformOptions {
  width?: number
  quality?: number
  resize?: ResizeMode
}

/**
 * Returns the original Supabase storage URL unchanged.
 * Transform params are kept in the signature so they can be enabled later
 * when upgrading to a Supabase plan that supports image transformations.
 */
export function supabaseImgUrl(
  url: string | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: TransformOptions = {}
): string {
  return url ?? ''
}

/**
 * A small JPEG of a stored photo for link previews: WhatsApp and others can skip big or WebP photos.
 * Only these previews use Supabase's resizing; the pages keep showing the originals.
 */
export function sharePreviewImgUrl(url: string): string {
  const storagePath = '/storage/v1/object/public/'
  return url.includes(storagePath)
    ? `${url.replace(storagePath, '/storage/v1/render/image/public/')}?width=1200&height=630&resize=cover&quality=70`
    : url
}

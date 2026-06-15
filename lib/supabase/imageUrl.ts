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

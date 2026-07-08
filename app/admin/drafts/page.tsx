import { createAdminClient } from '@/lib/supabase/admin'
import Topbar from '../_components/Topbar'
import DraftsClient from './_components/DraftsClient'

export const revalidate = 0

export default async function DraftsPage() {
  const supabase = createAdminClient()

  const { data: raw } = await supabase
    .from('homestays')
    .select(`
      id, title, slug, cover_image_url, updated_at, latitude, longitude,
      draft_data,
      homestay_blocks ( id )
    `)
    .not('draft_data', 'is', null)
    .order('updated_at', { ascending: false })

  const drafts = (raw ?? []).map((h: any) => ({
    id:             h.id,
    title:          h.title || 'Untitled Draft',
    slug:           h.slug,
    updatedAt:      h.updated_at,
    coverImage:     (() => {
      try {
        const blocks = h.draft_data?.blocks ?? []
        const hero   = blocks.find((b: any) => b.type === 'hero')
        return hero?.props?.images?.['cover'] ?? h.cover_image_url ?? null
      } catch { return h.cover_image_url ?? null }
    })(),
    isPublished:    (h.homestay_blocks ?? []).length > 0 && h.latitude !== 0,
    isDraftOnly:    h.latitude === 0,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Drafts"
        subtitle={`${drafts.length} draft${drafts.length !== 1 ? 's' : ''} in progress`}
      />
      <DraftsClient drafts={drafts} />
    </div>
  )
}

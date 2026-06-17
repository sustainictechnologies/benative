import { createClient } from '@/lib/supabase/server'
import Topbar from '../_components/Topbar'
import HomestaysClient from './_components/HomestaysClient'

export const revalidate = 0

export default async function HomestaysPage() {
  const supabase = createClient()

  const [{ data: raw }, { data: assignments }] = await Promise.all([
    supabase
      .from('homestays')
      .select(`
        id, title, slug, host_name, village_name, location_district,
        is_verified, latitude, longitude, created_at, updated_at, cover_image_url,
        homestay_blocks ( id )
      `)
      .order('created_at', { ascending: false }),

    supabase
      .from('homestay_tags')
      .select('homestay_id, tags ( id, slug )'),
  ])

  // Build a map: homestay_id → tag slugs[]
  const assignmentMap: Record<string, string[]> = {}
  for (const row of (assignments ?? []) as any[]) {
    const hid  = row.homestay_id
    const slug = row.tags?.slug
    if (hid && slug) {
      if (!assignmentMap[hid]) assignmentMap[hid] = []
      assignmentMap[hid].push(slug)
    }
  }

  const homestays = (raw ?? []).map((h: any) => ({
    id:                h.id,
    title:             h.title,
    slug:              h.slug,
    host_name:         h.host_name,
    village_name:      h.village_name,
    location_district: h.location_district,
    is_verified:       h.is_verified,
    has_location:      h.latitude != null && h.longitude != null,
    created_at:        h.created_at,
    updated_at:        h.updated_at ?? h.created_at,
    cover_image_url:   h.cover_image_url ?? null,
    block_count:       (h.homestay_blocks ?? []).length,
    category_slugs:    assignmentMap[h.id] ?? [],
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Homestays"
        subtitle={`${homestays.length} homestay${homestays.length !== 1 ? 's' : ''} in the network`}
      />
      <HomestaysClient homestays={homestays} />
    </div>
  )
}

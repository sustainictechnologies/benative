import { createClient } from '@/lib/supabase/server'
import Topbar from '../_components/Topbar'
import HomestaysClient from './_components/HomestaysClient'

export const revalidate = 0

export default async function HomestaysPage() {
  const supabase = createClient()

  const { data: raw } = await supabase
    .from('homestays')
    .select(`
      id, title, slug, host_name, village_name, location_district,
      is_verified, latitude, longitude, created_at,
      homestay_blocks ( block_type, content_data )
    `)
    .order('created_at', { ascending: false })

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
    cover_image_url:   (h.homestay_blocks ?? [])
      .find((b: any) => b.block_type === 'hero')
      ?.content_data?.cover_image_url ?? null,
    block_count: (h.homestay_blocks ?? []).length,
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

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PreviewClient from './PreviewClient'

export const dynamic = 'force-dynamic'
// Read the preview fresh on every visit: without this, Next keeps the first database answer
// (the link stays the same when the preview is made again, so it would show old photos)
export const revalidate = 0

interface Props {
  params: { token: string }
}

export default async function PreviewPage({ params }: Props) {
  // Read on the server with the private key, so the database does not have to let
  // everyone list all previews (they hold draft content, contact details included)
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('homestay_previews')
    .select('blocks_data, page_meta, expires_at')
    .eq('token', params.token)
    .single()

  if (!data) notFound()

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="text-5xl">⏰</div>
          <h1 className="text-xl font-bold text-stone-900">Preview Link Expired</h1>
          <p className="text-sm text-stone-500">This preview link was valid for 4 days. Ask the host to generate a new one.</p>
        </div>
      </div>
    )
  }

  return (
    <PreviewClient
      blocksData={data.blocks_data}
      pageMeta={data.page_meta}
    />
  )
}

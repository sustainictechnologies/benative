import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PreviewClient from './PreviewClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: { token: string }
}

export default async function PreviewPage({ params }: Props) {
  const supabase = createClient()

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
          <p className="text-sm text-stone-500">This preview link was valid for 24 hours. Ask the host to generate a new one.</p>
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

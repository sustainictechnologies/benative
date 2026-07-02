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
    .select('blocks_data, slug, created_at')
    .eq('token', params.token)
    .single()

  if (!data) notFound()

  return <PreviewClient blocksData={data.blocks_data} />
}

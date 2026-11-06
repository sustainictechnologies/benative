import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { maskEmail } from '@/lib/maskEmail'
import LaunchClient from '@/app/launch/[token]/LaunchClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Launch Your Homestay · BeNative',
  robots: { index: false, follow: false },
}

// A demo of the launch page, to send to anyone (and for how-to videos): a live homestay's real name and
// page link, a pretend sign-in, the whole night-to-sunrise launch, and nothing published.
// Reached from the demo preview (/preview/demo/[slug]). Live homestays only: their pages are public anyway.
export default async function LaunchDemoPage({ params }: { params: { slug: string } }) {
  const { data: homestay } = await createAdminClient()
    .from('homestays')
    .select('title, slug, host_name, latitude, email, homestay_blocks ( block_type, content_data )')
    .eq('slug', params.slug)
    .maybeSingle()
  if (!homestay || homestay.latitude === 0) notFound()

  // The email the host would sign in with, partly hidden: only the hidden form reaches the browser
  const contact = (homestay.homestay_blocks ?? []).find(b => b.block_type === 'contact')?.content_data as Record<string, unknown> | undefined
  const email   = String(contact?.email || homestay.email || '').trim()

  return (
    <LaunchClient
      token=""
      name={homestay.title}
      hostInitial={(homestay.host_name || homestay.title).trim().charAt(0).toUpperCase()}
      slug={homestay.slug}
      live={false}
      gate={email ? { kind: 'signin', hostEmail: maskEmail(email) } : null}
      demo
    />
  )
}

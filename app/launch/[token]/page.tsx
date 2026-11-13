import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PublishPayload } from '@/lib/publishHomestay'
import { maskEmail } from '@/lib/maskEmail'
import LaunchClient, { type LaunchGate } from './LaunchClient'

export const dynamic = 'force-dynamic'
// Read fresh on every visit: the link changes from ready to live, and the admin can update it
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Launch Your Homestay · BeNative',
  robots: { index: false, follow: false },
}

interface Props {
  params: { token: string }
}

export default async function LaunchPage({ params }: Props) {
  // Read on the server with the private key: launch links hold the host's details
  const admin = createAdminClient()
  const { data: launch } = await admin
    .from('homestay_launches')
    .select('payload, host_email, expires_at, launched_at, live_slug')
    .eq('token', params.token)
    .maybeSingle()

  if (!launch) notFound()
  const payload = launch.payload as PublishPayload

  const [{ data: { user } }, { data: target }] = await Promise.all([
    createClient().auth.getUser(),
    admin.from('homestays').select('latitude').eq('slug', payload.slug).maybeSingle(),
  ])

  const onSite  = !!target && target.latitude !== 0
  // Live: on the site now (launched from this link, or published by the admin), or being launched from this link
  // this moment (it goes live in a moment: live_slug is saved once it has)
  const live    = onSite || (!!launch.launched_at && !launch.live_slug)
  const expired = new Date(launch.expires_at) < new Date()

  // Launched from this link, then taken off the site (Delete in Admin → Homestays moves it back to Drafts)
  if (launch.launched_at && !live) {
    return (
      <div className="fixed inset-0 z-[1100] bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="text-5xl">🏡</div>
          <h1 className="text-xl font-bold text-stone-900">Your homestay isn&apos;t on BeNative right now</h1>
          <p className="text-sm text-stone-500">
            It has been taken off the site for now.{' '}
            <Link href="/contact" className="underline underline-offset-2 hover:text-stone-700">Message us</Link> to put it back.
          </p>
        </div>
      </div>
    )
  }

  if (!live && expired) {
    return (
      <div className="fixed inset-0 z-[1100] bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="text-5xl">⏰</div>
          <h1 className="text-xl font-bold text-stone-900">Launch Link Expired</h1>
          <p className="text-sm text-stone-500">This launch link was valid for 4 days. Ask BeNative for a new one.</p>
        </div>
      </div>
    )
  }

  let gate: LaunchGate = null
  if (!live) {
    if (!user) gate = { kind: 'signin', hostEmail: maskEmail(launch.host_email) }
    else if (!user.email_confirmed_at || user.email?.toLowerCase() !== launch.host_email) {
      gate = { kind: 'email', hostEmail: maskEmail(launch.host_email), signedInAs: user.email ?? '' }
    }
  }

  return (
    <LaunchClient
      token={params.token}
      name={payload.title}
      hostInitial={(payload.hostName || payload.title).trim().charAt(0).toUpperCase()}
      slug={launch.live_slug ?? payload.slug}
      live={live}
      gate={gate}
    />
  )
}

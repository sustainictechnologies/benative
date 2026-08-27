import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Home, LogOut, Star, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import HostReviewCard from './_components/HostReviewCard'

export const revalidate = 0

export const metadata = { title: 'Host Dashboard · BeNative' }

export default async function HostDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: homestay } = await supabase
    .from('homestays')
    .select('id, title, slug, village_name, location_district')
    .eq('host_user_id', user.id)
    .single()

  if (!homestay) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-stone-200 p-10 text-center space-y-4">
          <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
            <Home size={24} className="text-stone-400" />
          </div>
          <h1 className="text-lg font-bold text-stone-900">Account not linked</h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            Your account isn't linked to a homestay yet. Contact the BeNative admin to get linked.
          </p>
          <p className="text-xs text-stone-400 bg-stone-50 rounded-xl px-4 py-2">
            Logged in as <span className="font-medium text-stone-600">{user.email}</span>
          </p>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-stone-400 hover:text-stone-600 underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    )
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, host_reply, host_reply_at, profiles ( full_name )')
    .eq('homestay_id', homestay.id)
    .order('created_at', { ascending: false })

  const reviewList = (reviews ?? []).map((r: any) => ({
    id:           r.id,
    rating:       r.rating,
    comment:      r.comment,
    created_at:   r.created_at,
    host_reply:   r.host_reply ?? null,
    host_reply_at: r.host_reply_at ?? null,
    reviewerName: r.profiles?.full_name ?? null,
  }))

  const avgRating = reviewList.length > 0
    ? reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length
    : null

  const repliedCount   = reviewList.filter(r => r.host_reply).length
  const unrepliedCount = reviewList.length - repliedCount

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Nav */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-stone-900">BeNative</span>
            <span className="text-stone-300">/</span>
            <span className="text-sm text-stone-500">Host Dashboard</span>
          </div>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors">
              <LogOut size={13} /> Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Homestay header */}
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{homestay.title}</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {homestay.village_name}, {homestay.location_district}
          </p>
          <Link
            href={`/homestays/${homestay.slug}`}
            target="_blank"
            className="text-xs text-brand-600 hover:text-brand-700 underline"
          >
            View public page →
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Total reviews',
              value: reviewList.length,
              icon: <MessageSquare size={16} className="text-stone-400" />,
            },
            {
              label: 'Average rating',
              value: avgRating !== null ? `${avgRating.toFixed(1)}★` : '—',
              icon: <Star size={16} className="text-amber-400" />,
            },
            {
              label: 'Awaiting reply',
              value: unrepliedCount,
              icon: <MessageSquare size={16} className="text-brand-500" />,
            },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white border border-stone-200 rounded-2xl px-4 py-4">
              <div className="flex items-center gap-2 mb-1">{icon}</div>
              <p className="text-2xl font-bold text-stone-900">{value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Review list */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">
            Reviews ({reviewList.length})
          </h2>

          {reviewList.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center py-16 gap-3 text-center">
              <MessageSquare size={28} className="text-stone-300" />
              <p className="text-sm font-semibold text-stone-600">No reviews yet</p>
              <p className="text-xs text-stone-400">Reviews from guests will appear here for you to reply to.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewList.map(r => (
                <HostReviewCard
                  key={r.id}
                  review={r}
                  homestaySlug={homestay.slug}
                />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}

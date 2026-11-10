import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from './_components/ProfileForm'
import { CalendarX } from 'lucide-react'
import type { Metadata } from 'next'
import { NO_INDEX } from '@/lib/site'

export const metadata: Metadata = {
  title: 'My Profile · BeNative',
  robots: NO_INDEX,
}

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#f8f7f2]">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-stone-900">My Profile</h1>
          <p className="text-sm text-stone-400 mt-1">Manage your account details and preferences</p>
        </div>

        {/* Profile edit card */}
        <ProfileForm
          userId={user.id}
          email={user.email ?? ''}
          initialName={profile?.full_name ?? ''}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />

        {/* Booking history */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-stone-900 mb-5">Booking History</h2>
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
              <CalendarX size={22} className="text-stone-300" />
            </div>
            <p className="text-sm font-medium text-stone-400">No bookings yet</p>
            <p className="text-xs text-stone-300 text-center max-w-xs">
              Once you book a homestay, your history will appear here.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

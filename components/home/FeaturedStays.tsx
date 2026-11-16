import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PlaceCard from '@/components/discover/PlaceCard'
import { createClient } from '@/lib/supabase/server'
import { toDiscoverCard } from '@/lib/discoverStays'

const MAX_STAYS = 8

// Laptops: one tidy row for up to five stays, then rows of three (six) or four (seven, eight)
const COLUMNS: Record<number, string> = {
  1: 'lg:grid-cols-3', 2: 'lg:grid-cols-3', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-3', 7: 'lg:grid-cols-4', 8: 'lg:grid-cols-4',
}

// The stays switched on with "Show on homepage" in Admin → Homestays, newest first. Their links also
// lead search engines from the homepage to the homestay pages.
export default async function FeaturedStays() {
  const { data } = await createClient()
    .from('homestays')
    .select('id, title, slug, location_district, village_name, host_name, is_verified, latitude, longitude, calling_window, languages_spoken, cover_image_url')
    .eq('show_on_homepage', true)
    .neq('latitude', 0)
    .order('created_at', { ascending: false })
    .limit(MAX_STAYS)

  if (!data?.length) return null
  const stays = data.map(toDiscoverCard)

  return (
    <section className="bg-[#f8f7f2] px-4 sm:px-6 pt-10 sm:pt-12">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Stays to discover</h2>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1 shrink-0 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
          >
            See all <ArrowRight size={15} aria-hidden />
          </Link>
        </div>

        {/* Phones and tablets: one row to scroll sideways. Laptops: a grid. */}
        <div className={`flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 pt-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:gap-5 lg:overflow-visible lg:mx-0 lg:px-0 ${COLUMNS[stays.length]}`}>
          {stays.map(stay => (
            <div key={stay.id} className="w-[72%] sm:w-[40%] shrink-0 snap-start lg:w-auto">
              <PlaceCard homestay={stay} />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

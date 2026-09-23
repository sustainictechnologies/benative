import Link from 'next/link'
import { MapPin, Home, Compass, Sparkles, Star } from 'lucide-react'

/* ── Data ────────────────────────────────────────────────────── */

const MAIN_CATEGORIES = [
  {
    label: 'By the Place',
    icon: MapPin,
    href: '/discover',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=70',
    alt: 'Coastal place',
  },
  {
    label: 'By the Home',
    icon: Home,
    href: '/discover',
    img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=70',
    alt: 'Family home',
  },
  {
    label: 'By the Trip',
    icon: Compass,
    href: '/discover',
    img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=70',
    alt: 'Travel and trip',
  },
  {
    label: 'By the Experience',
    icon: Sparkles,
    href: '/discover',
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70',
    alt: 'Local experience',
  },
  {
    label: 'Recently Added',
    icon: Star,
    href: '/discover',
    img: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=70',
    alt: 'Newly added homestays',
  },
]

const SUB_CATEGORIES = [
  {
    group: 'By Place',
    items: [
      'By the Sea',
      'Beside the Water',
      'In the Hills',
      'Among the Green',
      'In the Countryside',
      'Away from It All',
    ],
  },
  {
    group: 'By Type of Home',
    items: [
      'Family Homes',
      'Farm Stays',
      'Heritage Homes',
      'Village Homes',
      'Eco & Nature Homes',
      'Homesteads',
    ],
  },
  {
    group: 'By Kind of Trip',
    items: [
      'Slow Escapes',
      'Weekend Getaways',
      'Long Stays',
      'Family Time',
      'For Two',
      'Solo Stays',
      'Work From Somewhere Else',
    ],
  },
  {
    group: 'By What You Want to Experience',
    items: [
      'Eat Like a Local',
      'Wake Up in Nature',
      'Live Like a Local',
      'Learn Something New',
      'Go Offline',
      'Meet the People',
      'Do Absolutely Nothing',
    ],
  },
]

/* ── Category card ───────────────────────────────────────────── */

function CategoryCard({
  label, icon: Icon, href, img, alt, wide,
}: {
  label: string
  icon: React.ElementType
  href: string
  img: string
  alt: string
  wide?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group relative rounded-xl overflow-hidden aspect-[3/4] block ${wide ? 'col-span-2 sm:col-span-1' : ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Icon size={13} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm leading-tight">{label}</span>
        </div>
      </div>
    </Link>
  )
}

/* ── Section ─────────────────────────────────────────────────── */

export default function CategorySection() {
  return (
    <section className="bg-[#f8f7f2] px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Explore by Categories</h2>
        </div>

        {/* Main category cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-14">
          {MAIN_CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.label}
              {...cat}
              wide={i === 4}
            />
          ))}
        </div>

        {/* Sub-category lists */}
        <div className="divide-y divide-stone-200">
          {SUB_CATEGORIES.map(({ group, items }) => (
            <div
              key={group}
              className="py-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-10"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 sm:w-56 shrink-0 mt-0.5">
                {group}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {items.map(item => (
                  <Link
                    key={item}
                    href="/discover"
                    className="text-sm text-stone-600 hover:text-brand-700 transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Newly Added */}
        <div className="mt-8 pt-5 border-t border-stone-200 flex items-center gap-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Newly Added</p>
          <Link
            href="/discover"
            className="text-sm text-brand-700 hover:text-brand-800 font-medium transition-colors"
          >
            See recently listed homestays →
          </Link>
        </div>

      </div>
    </section>
  )
}

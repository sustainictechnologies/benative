import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  MapPin, ShieldCheck, Leaf, Bird, Bike, Phone, Star,
  ArrowRight, Users, Heart, Sprout, Map
} from 'lucide-react'

const categories = [
  {
    icon: Bird,
    label: 'Bird Watching',
    desc: 'Spot rare birds in their natural habitat',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    iconColor: 'text-teal-500',
    textColor: 'text-teal-700',
  },
  {
    icon: Bike,
    label: 'Rider Friendly',
    desc: 'Perfect stays for solo riders',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconColor: 'text-orange-500',
    textColor: 'text-orange-700',
  },
  {
    icon: ShieldCheck,
    label: 'Solo Female Safe',
    desc: 'Safe, comfortable and welcoming',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    iconColor: 'text-rose-500',
    textColor: 'text-rose-700',
  },
  {
    icon: Leaf,
    label: 'Agriculture Immersion',
    desc: 'Live the village life and connect deeper',
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-600',
    textColor: 'text-green-700',
  },
]

const trustMetrics = [
  { icon: Leaf,        label: 'No Booking Fees',   sub: 'Pay directly to hosts' },
  { icon: ShieldCheck, label: 'Verified Hosts',     sub: 'Community verified' },
  { icon: Phone,       label: 'Direct Contact',     sub: 'Call or WhatsApp' },
  { icon: Users,       label: 'Community Trusted',  sub: 'By travelers like you' },
]

const values = [
  { icon: Sprout, label: 'Local Experiences',     sub: 'Activities, food, and stories rooted in the culture of each region.' },
  { icon: Heart,  label: 'Support Local Families', sub: 'Your travel directly puts money into the hands of rural communities.' },
  { icon: Leaf,   label: 'Responsible Travel',    sub: 'Travel respectfully. Preserve nature, culture, and way of life.' },
  { icon: Users,  label: 'Real Connections',      sub: 'Real people, real stories, real hospitality — across India.' },
]

export default async function HomePage() {
  const supabase = createClient()
  const { data: rawHomestays } = await supabase
    .from('homestays')
    .select(`
      id, title, slug, village_name, location_district, is_verified,
      homestay_categories ( categories ( name, slug ) ),
      homestay_blocks ( block_type, content_data )
    `)
    .eq('is_verified', true)
    .limit(4)

  const homestays = (rawHomestays ?? []).map((h: any) => ({
    id: h.id,
    title: h.title,
    slug: h.slug,
    village_name: h.village_name,
    location_district: h.location_district,
    is_verified: h.is_verified,
    categories: (h.homestay_categories ?? []).map((hc: any) => hc.categories).filter(Boolean),
    cover_image_url: (h.homestay_blocks ?? [])
      .find((b: any) => b.block_type === 'hero')?.content_data?.cover_image_url ?? null,
  }))

  return (
    <div className="bg-white">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex overflow-hidden">
        {/* BG image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.jpg"
            alt="Konkan coast"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" style={{backgroundSize: '55% 100%', backgroundRepeat: 'no-repeat'}} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-2 gap-0">

          {/* Left: text — full height flex column */}
          <div className="flex flex-col justify-center py-24 pr-8">
            <div className="inline-flex items-center gap-2 bg-stone-100 border border-stone-200 text-stone-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 w-fit">
              <MapPin size={11} /> Himalayas · Forests · Villages · Coastlines · Deserts
            </div>

            <h1 className="text-[72px] font-black text-stone-900 leading-[1.0] mb-6 tracking-tight">
              Stay With<br />
              <span className="text-brand-600">Local Families</span><br />
              Across India
            </h1>

            <p className="text-lg text-stone-500 leading-relaxed mb-10 max-w-sm">
              Authentic community stays, direct host connections, and
              meaningful travel experiences across rural and culturally
              rich regions of India.
            </p>

            <div className="flex flex-wrap gap-3 mb-14">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-7 py-3.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
              >
                <MapPin size={15} /> Explore Homestays
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-stone-100 border-2 border-stone-400 text-stone-800 hover:bg-brand-50 hover:border-brand-600 hover:text-brand-700 font-semibold px-7 py-3.5 rounded-full transition-all text-sm"
              >
                <Users size={15} /> Become a Host
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex items-start gap-8">
              {trustMetrics.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-start gap-1">
                  <Icon size={20} className="text-brand-600 mb-1" />
                  <span className="text-stone-900 text-sm font-bold">{label}</span>
                  <span className="text-stone-900 text-xs font-semibold">{sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 4 category cards pinned to bottom-right */}
          <div className="hidden lg:flex flex-col justify-end pb-14 pl-4">
            <div className="flex gap-3">
              {categories.map(({ icon: Icon, label, desc, bg, border, iconColor, textColor }) => (
                <Link
                  key={label}
                  href="/explore"
                  className={`group w-36 h-36 shrink-0 ${bg} border ${border} rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.03] transition-all duration-300 shadow-md hover:shadow-xl`}
                >
                  <div>
                    <Icon size={22} className={`${iconColor} mb-3`} />
                    <div className={`font-bold text-[13px] leading-snug mb-1 ${textColor}`}>{label}</div>
                    <div className="text-[10px] text-stone-500 leading-relaxed">{desc}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${border} flex items-center justify-center mt-3 bg-white/50`}>
                    <ArrowRight size={11} className={iconColor} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Handpicked Homestays ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-stone-900 flex items-center gap-2 mb-1">
              Handpicked Homestays
              <span className="text-2xl">✦</span>
            </h2>
            <p className="text-stone-500">Personally verified stays across rural India</p>
          </div>
          <Link href="/explore" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors">
            View all stays <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* Homestay cards */}
          <div className="lg:col-span-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {homestays.length > 0 ? homestays.map((h) => (
              <Link
                key={h.id}
                href={`/homestays/${h.slug}`}
                className="group bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-44 bg-stone-100 overflow-hidden">
                  {h.cover_image_url ? (
                    <Image
                      src={h.cover_image_url}
                      alt={h.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="300px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-100 to-stone-200 flex items-center justify-center">
                      <MapPin size={28} className="text-brand-300" />
                    </div>
                  )}
                  {h.is_verified && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-brand-700 text-[10px] font-semibold px-2 py-1 rounded-full">
                      <ShieldCheck size={9} /> Verified Host
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-stone-900 text-sm leading-snug mb-1">{h.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-stone-400 mb-2.5">
                    <MapPin size={10} />
                    <span>{h.village_name}, {h.location_district}</span>
                  </div>
                  {h.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {h.categories.slice(0, 2).map((c: any) => (
                        <span key={c.slug} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1 pt-3 border-t border-stone-100">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold text-stone-700">4.8</span>
                    <span className="text-xs text-stone-400 ml-auto">Direct contact</span>
                  </div>
                </div>
              </Link>
            )) : (
              [1,2,3,4].map((i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-stone-100">
                  <div className="h-44 bg-gradient-to-br from-brand-50 to-stone-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-stone-100 rounded-full animate-pulse" />
                    <div className="h-3 bg-stone-100 rounded-full w-2/3 animate-pulse" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Map widget */}
          <div className="lg:col-span-1 bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-card flex flex-col">
            <div className="flex-1 relative min-h-52">
              <Image
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80"
                alt="Map"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-brand-900/10" />
              {[
                { top: '28%', left: '48%' },
                { top: '43%', left: '33%' },
                { top: '54%', left: '58%' },
                { top: '66%', left: '42%' },
              ].map((pos, i) => (
                <div key={i} style={{ position: 'absolute', ...pos }}>
                  <div className="w-5 h-5 bg-brand-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-stone-800 mb-0.5">Explore on Map</p>
              <p className="text-xs text-stone-400 mb-3 leading-relaxed">See all stays across rural India</p>
              <Link
                href="/map"
                className="flex items-center justify-center gap-2 w-full bg-stone-50 hover:bg-brand-50 border border-stone-200 hover:border-brand-200 text-stone-700 hover:text-brand-700 text-xs font-semibold py-2.5 rounded-xl transition-all"
              >
                <Map size={13} /> Open Full Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values strip ─────────────────────────────────────── */}
      <section className="border-t border-stone-100 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-brand-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900 mb-0.5">{label}</div>
                <div className="text-xs text-stone-500 leading-relaxed">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="relative bg-brand-700 rounded-3xl overflow-hidden px-8 py-16 text-center">
          <div className="absolute inset-0 opacity-15">
            <Image src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=60" alt="" fill className="object-cover" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to experience real India?</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto text-lg">Browse verified homestays across mountains, forests, villages, and coastlines. Call the host directly. Pay zero fees.</p>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-3.5 rounded-full hover:bg-cream-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <MapPin size={16} /> Browse the Map
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

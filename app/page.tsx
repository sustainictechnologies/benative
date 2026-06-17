import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  MapPin, Users, Bird, Bike, ShieldCheck, Leaf,
  ArrowRight, Phone, Star, Heart, Sprout,
  Home, UtensilsCrossed, Compass,
} from 'lucide-react'

/* ── Data ─────────────────────────────────────────────────── */

const valueCards = [
  {
    icon: Compass,
    title: 'Discover',
    desc: 'Find hidden villages, forests, and landscapes far off the beaten path.',
  },
  {
    icon: Users,
    title: 'Connect',
    desc: 'Meet local families and build genuine, lasting relationships.',
  },
  {
    icon: Home,
    title: 'Visit',
    desc: 'Stay in verified homes with trusted, welcoming hosts.',
  },
  {
    icon: Sprout,
    title: 'Support',
    desc: 'Your travel directly funds rural families and local communities.',
  },
]

const categories = [
  {
    icon: Bird,
    label: 'Bird Watching',
    desc: 'For those who find peace in every flutter.',
    bg: '/bird_waching.jpg',
    slug: 'bird-watching',
  },
  {
    icon: Bike,
    label: 'Rider Friendly',
    desc: 'Built for explorers who ride free.',
    bg: '/Rider_Friendly.jpeg',
    slug: 'rider-friendly',
  },
  {
    icon: ShieldCheck,
    label: 'Solo Female Safe',
    desc: 'Safe, respectful and welcoming stays.',
    bg: '/Solo_Female_Safe.jpeg',
    slug: 'solo-female-friendly',
  },
  {
    icon: Leaf,
    label: 'Agri Immersion',
    desc: 'Live the village life. Get your hands dirty.',
    bg: '/Agri_Immersion.jpeg',
    slug: 'agri-immersion',
  },
]

type TrustItem =
  | { kind: 'symbol'; symbol: string; label: string; sub: string }
  | { kind: 'icon'; Icon: React.ElementType; label: string; sub: string }

const trustMetrics: TrustItem[] = [
  { kind: 'symbol', symbol: '₹',    label: 'No Booking Fees',   sub: 'Pay directly to hosts'      },
  { kind: 'icon',   Icon: ShieldCheck, label: 'Verified Hosts',  sub: 'Community verified'          },
  { kind: 'icon',   Icon: Phone,       label: 'Direct Contact',  sub: 'Call or WhatsApp'            },
  { kind: 'icon',   Icon: Users,       label: 'Community Trusted', sub: 'By travelers like you'     },
]


const values = [
  { icon: Heart,   label: 'Local Connection',   sub: 'Genuine stays with families rooted in their land.'               },
  { icon: Leaf,    label: 'Travel Responsibly', sub: 'Respect nature, culture, and the communities you visit.'         },
  { icon: Compass, label: 'Curated Knowledge',  sub: 'Handpicked places guided by deep local insight.'                 },
  { icon: Users,   label: 'Community First',    sub: 'Built by and for people who travel with intention.'              },
]

/* ── Page ─────────────────────────────────────────────────── */

export const revalidate = 3600 // revalidate homepage every hour

export default async function HomePage() {
  const supabase = createClient()
  const { data: rawHomestays } = await supabase
    .from('homestays')
    .select(`
      id, title, slug, village_name, location_district, is_verified,
      cover_image_url,
      homestay_tags ( tags ( name, slug ) )
    `)
    .limit(6)

  const homestays = (rawHomestays ?? []).map((h: any) => ({
    id: h.id,
    title: h.title,
    slug: h.slug,
    village_name: h.village_name,
    location_district: h.location_district,
    is_verified: h.is_verified,
    categories: (h.homestay_tags ?? []).map((ht: any) => ht.tags).filter(Boolean),
    cover_image_url: h.cover_image_url ?? null,
  }))

  return (
    <div className="bg-[#f8f7f2]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

        {/* Left: headline */}
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-stone-900 leading-snug lg:leading-[1.45] mb-3 tracking-tight">
            <span className="block text-2xl lg:text-4xl font-bold text-brand-600">Find places that still belong to themselves.</span>
          </h1>
          <div className="w-12 h-[3px] bg-brand-600 rounded-full mt-3 mb-7" />
          <p className="text-stone-500 text-base leading-relaxed mb-4 max-w-[480px]">
            Discover villages, mountains, wetlands, forests, birding habitats, and landscapes that remain deeply connected to the communities around them. Access local knowledge, trusted contacts, and opportunities to experience these places beyond the usual tourist routes.
          </p>
          <p className="text-stone-800 text-sm font-semibold max-w-[480px]">
            Travel with curiosity. Leave with perspective.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-12">
            <span className="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2 text-sm font-medium text-stone-600">
              <Home size={14} className="text-brand-600" /> Homestay
            </span>
            <span className="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2 text-sm font-medium text-stone-600">
              <UtensilsCrossed size={14} className="text-brand-600" /> Eat Local
            </span>
            <span className="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2 text-sm font-medium text-stone-600">
              <Compass size={14} className="text-brand-600" /> Native Guides
            </span>
          </div>
        </div>

        {/* Right: why choose + value cards */}
        <div>
          <h2 className="text-brand-600 font-black text-xl text-center mb-5 tracking-tight">
            How BeNative Works
          </h2>
          <div className="relative grid grid-cols-2">
            {/* Centre + divider */}
            <div className="absolute left-1/2 top-[25%] bottom-[25%] w-px bg-stone-400 -translate-x-px pointer-events-none" />
            <div className="absolute top-1/2 left-[25%] right-[25%] h-px bg-stone-400 -translate-y-px pointer-events-none" />
            {valueCards.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center px-3 py-6">
                <Icon size={28} className="text-brand-600 mb-1" strokeWidth={1.5} />
                <h3 className="font-bold text-stone-900 text-sm leading-snug min-h-[2.5rem] flex items-center justify-center mb-2">{title}</h3>
                <p className="text-stone-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Cards ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-stone-900 tracking-tight">Explore Homestays</h2>
          <Link href="/explore" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map(({ icon: Icon, label, desc, bg, slug }) => (
          <Link
            key={label}
            href={`/explore?category=${slug}`}
            className="group relative rounded-2xl overflow-hidden aspect-[4/3]"
          >
            <Image
              src={bg}
              alt={label}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-sm">{label}</h3>
              </div>
              <p className="text-white/70 text-xs leading-snug">{desc}</p>
            </div>
          </Link>
        ))}
        </div>
      </section>

      {/* ── Trust Metrics ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 my-6">
        <div className="bg-brand-100 rounded-3xl px-8 py-12 text-center">
          <div>
            <h2 className="text-2xl font-black text-brand-700 tracking-tight mb-2">Why travelers choose BeNative</h2>
            <div className="w-10 h-[3px] bg-brand-400 rounded-full mx-auto mb-10" />
            <div className="relative grid grid-cols-2 lg:grid-cols-4">
              {/* Mobile 2×2: centre cross */}
              <div className="lg:hidden absolute left-1/2 top-[10%] bottom-[10%] w-px bg-brand-200 -translate-x-px pointer-events-none" />
              <div className="lg:hidden absolute top-1/2 left-[10%] right-[10%] h-px bg-brand-200 -translate-y-px pointer-events-none" />
              {/* Desktop 4-col: three vertical dividers */}
              <div className="hidden lg:block absolute left-1/4 top-[15%] bottom-[15%] w-px bg-brand-200 -translate-x-px pointer-events-none" />
              <div className="hidden lg:block absolute left-2/4 top-[15%] bottom-[15%] w-px bg-brand-200 -translate-x-px pointer-events-none" />
              <div className="hidden lg:block absolute left-3/4 top-[15%] bottom-[15%] w-px bg-brand-200 -translate-x-px pointer-events-none" />
              {trustMetrics.map((m) => (
                <div key={m.label} className="flex flex-col items-center text-center px-6 py-4 gap-2">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                    {m.kind === 'symbol' ? (
                      <span className="text-brand-600 font-bold text-base">{m.symbol}</span>
                    ) : (
                      <m.Icon size={18} className="text-brand-600" />
                    )}
                  </div>
                  <p className="text-stone-900 font-bold text-sm">{m.label}</p>
                  <p className="text-stone-500 text-xs">{m.sub}</p>
                </div>
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
              Liked Homestays
            </h2>
            <p className="text-stone-500">Where hospitality feels like home</p>
          </div>
          <Link href="/explore" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors">
            View all stays <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to experience Hidden India?</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto text-lg">Browse verified homestays across mountains, forests, villages, and coastlines. Call the host directly. Pay zero fees.</p>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-3.5 rounded-full hover:bg-stone-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <MapPin size={16} /> Browse the Map
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Home, Compass, UtensilsCrossed, Star, ShieldCheck, Phone, Users } from 'lucide-react'
import HeroCarousel from '@/components/home/HeroCarousel'

/* ── Category data ───────────────────────────────────────────── */

const MAIN_CATEGORIES = [
  {
    label: 'By the Place',
    icon: MapPin,
    href: '/discover',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=70',
  },
  {
    label: 'By the Home',
    icon: Home,
    href: '/discover',
    img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=70',
  },
  {
    label: 'By the Trip',
    icon: Compass,
    href: '/discover',
    img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=70',
  },
  {
    label: 'By the Experience',
    icon: UtensilsCrossed,
    href: '/discover',
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70',
  },
  {
    label: 'Recently Added',
    icon: Star,
    href: '/discover',
    img: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&q=70',
  },
]

const SUB_CATEGORIES = [
  {
    group: 'By Place',
    items: [
      'By the Sea', 'Beside the Water', 'In the Hills',
      'Among the Green', 'In the Countryside', 'Away from It All',
    ],
  },
  {
    group: 'By Type of Home',
    items: [
      'Family Homes', 'Farm Stays', 'Heritage Homes',
      'Village Homes', 'Eco & Nature Homes', 'Homesteads',
    ],
  },
  {
    group: 'By Kind of Trip',
    items: [
      'Slow Escapes', 'Weekend Getaways', 'Long Stays',
      'Family Time', 'For Two', 'Solo Stays', 'Work From Somewhere Else',
    ],
  },
  {
    group: 'By What You Want to Experience',
    items: [
      'Eat Like a Local', 'Wake Up in Nature', 'Live Like a Local',
      'Learn Something New', 'Go Offline', 'Meet the People', 'Do Absolutely Nothing',
    ],
  },
]

/* ── Why BeNative metrics ────────────────────────────────────── */

type TrustItem =
  | { kind: 'symbol'; symbol: string; label: string; sub: string }
  | { kind: 'icon'; Icon: React.ElementType; label: string; sub: string }

const TRUST_METRICS: TrustItem[] = [
  { kind: 'symbol', symbol: '₹',      label: 'No Booking Fees',   sub: 'Pay directly to hosts'    },
  { kind: 'icon',   Icon: ShieldCheck, label: 'Verified Hosts',    sub: 'Community verified'        },
  { kind: 'icon',   Icon: Phone,       label: 'Direct Contact',    sub: 'Call or WhatsApp'          },
  { kind: 'icon',   Icon: Users,       label: 'Community Trusted', sub: 'By travellers like you'   },
]

/* ── How it works steps ──────────────────────────────────────── */

const HOW_STEPS = [
  {
    word: 'Find',
    body: 'Look around. Browse homes by where they are, what they\'re like, the kind of trip you\'re planning or simply the feeling you\'re looking for.',
  },
  {
    word: 'Know',
    body: 'Take a little time to get to know the place. See the home, meet the hosts, discover the food and find out what\'s around.',
  },
  {
    word: 'Talk',
    body: 'Then talk to the person who knows it best. Ask about the rooms, the food, the journey, the weather — whatever you\'re curious about.',
  },
  {
    word: 'Go',
    body: 'Make your plans, pack your bags and go.',
  },
]

/* ── Page ────────────────────────────────────────────────────── */

export const revalidate = 3600

export default function HomePage() {
  return (
    <div className="bg-[#f8f7f2]">

      {/* ── 01 Full-screen carousel ─────────────────────────── */}
      <HeroCarousel />

      {/* ── 02 Introduction ─────────────────────────────────── */}
      <section className="bg-[#f8f7f2] px-6 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
            Travel a little closer to the place.
          </h2>
          <div className="space-y-4 text-stone-500 text-base sm:text-lg leading-relaxed">
            <p>
              Some of the best stays aren't the ones you find everywhere.
              They're the homes you hear about from someone who has been there. The family that welcomes you in,
              the food that comes from their kitchen, the quiet road you wouldn't have found on your own.
            </p>
            <p>
              BeNative is a collection of such places — homes and stays rooted in their surroundings
              and run by people who know them best.
            </p>
            <p className="text-stone-700 font-medium">
              Come find a different side of India.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-brand-700 font-semibold text-sm hover:gap-3 transition-all"
            >
              Explore Homestays <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 03 Explore by Categories ─────────────────────────── */}
      <section className="bg-white px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2">Explore by Categories</h2>
            <p className="text-stone-500 text-sm sm:text-base">Find the perfect stay, your way.</p>
          </div>

          {/* 5 main category cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-12">
            {MAIN_CATEGORIES.map(({ label, icon: Icon, href, img }, i) => (
              <Link
                key={label}
                href={href}
                className={`group relative rounded-2xl overflow-hidden aspect-[3/4] ${
                  i === 4 ? 'col-span-2 lg:col-span-1' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                      <Icon size={13} className="text-white" />
                    </div>
                    <h3 className="text-white font-bold text-sm leading-tight">{label}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Sub-category list */}
          <div className="divide-y divide-stone-100">
            {SUB_CATEGORIES.map(({ group, items }) => (
              <div key={group} className="py-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-8">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 sm:w-52 shrink-0 pt-0.5">
                  {group}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => (
                    <Link
                      key={item}
                      href="/discover"
                      className="text-sm text-stone-600 hover:text-brand-700 hover:underline underline-offset-2 transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Newly Added link */}
          <div className="pt-6">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              <Star size={14} className="fill-brand-600 text-brand-600" />
              See newly added homestays
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </section>

      {/* ── 04 Why BeNative? ─────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-[#f8f7f2]">
        <div className="max-w-5xl mx-auto">
          <div className="bg-brand-100 rounded-3xl px-8 py-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-800 mb-2">Why stay with BeNative?</h2>
            <div className="w-10 h-[3px] bg-brand-400 rounded-full mx-auto mb-8" />
            <div className="relative grid grid-cols-2 lg:grid-cols-4">
              {/* Dividers */}
              <div className="lg:hidden absolute left-1/2 top-[10%] bottom-[10%] w-px bg-brand-200 -translate-x-px pointer-events-none" />
              <div className="lg:hidden absolute top-1/2 left-[10%] right-[10%] h-px bg-brand-200 -translate-y-px pointer-events-none" />
              <div className="hidden lg:block absolute left-1/4 top-[15%] bottom-[15%] w-px bg-brand-200 pointer-events-none" />
              <div className="hidden lg:block absolute left-2/4 top-[15%] bottom-[15%] w-px bg-brand-200 pointer-events-none" />
              <div className="hidden lg:block absolute left-3/4 top-[15%] bottom-[15%] w-px bg-brand-200 pointer-events-none" />
              {TRUST_METRICS.map((m) => (
                <div key={m.label} className="flex flex-col items-center text-center px-4 py-6 gap-2">
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

      {/* ── 05 How it Works ──────────────────────────────────── */}
      <section className="bg-stone-900 px-6 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto">

          {/* Heading */}
          <div className="mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Find. Know. Talk. Go.
            </h2>
            <p className="text-stone-400 text-base sm:text-lg">
              Finding a place to stay can be simple.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-10 border-l border-stone-700 pl-8">
            {HOW_STEPS.map(({ word, body }) => (
              <div key={word} className="relative">
                {/* Dash marker */}
                <div className="absolute -left-[2.15rem] top-1 w-4 h-px bg-stone-600" />
                <p className="text-white font-bold text-base mb-1.5">— {word}</p>
                <p className="text-stone-400 text-sm sm:text-base leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* Closing quote */}
          <div className="mt-14 pt-10 border-t border-stone-800 space-y-1">
            <p className="text-stone-300 text-base sm:text-lg leading-relaxed italic">
              Arrive as a traveller.
            </p>
            <p className="text-stone-400 text-sm sm:text-base leading-relaxed italic">
              Leave knowing a little more about the place — and perhaps knowing someone there too.
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-white font-semibold text-sm border border-stone-600 hover:border-white hover:bg-white hover:text-stone-900 px-6 py-3 rounded-full transition-all"
            >
              Explore Homestays <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 06 Final full-screen image ───────────────────────── */}
      <section className="relative h-[70vh] min-h-[460px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=75"
            alt="Hidden India"
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4 max-w-2xl">
            Ready to experience hidden India?
          </h2>
          <p className="text-white/70 text-sm sm:text-base mb-8 max-w-md">
            Browse homes run by people who know the place best.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 bg-white text-stone-900 font-bold px-8 py-3.5 rounded-full hover:bg-brand-50 transition-colors shadow-lg"
          >
            <MapPin size={15} /> Explore Homestays
          </Link>
        </div>
      </section>

    </div>
  )
}

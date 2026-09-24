import Link from 'next/link'
import { ArrowRight, Users, Heart, ShieldCheck, Compass } from 'lucide-react'

const WHY_ITEMS = [
  { icon: Users,       title: 'Stay With Local Families',  desc: 'Live with locals and experience real hospitality.' },
  { icon: Heart,       title: 'Support Local Communities', desc: 'Your stay helps rural families and local communities.' },
  { icon: ShieldCheck, title: 'Safe & Verified',           desc: 'Verified hosts and stays you can trust.' },
  { icon: Compass,     title: 'Explore Offbeat India',     desc: 'Discover hidden places, nature, culture and local life.' },
]

export default function IntroductionSection() {
  return (
    <section className="bg-cream-200 px-6 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 lg:gap-24 items-start">

        {/* Left — Introduction */}
        <div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-800 leading-tight">
            Travel a little closer to the place.
          </h2>
          <div className="w-12 h-[3px] bg-brand-500 mt-5 mb-8 rounded-full" />

          <div className="space-y-4 text-stone-600 text-base sm:text-lg leading-relaxed">
            <p>Some of the best stays aren't the ones you find everywhere.</p>
            <p>
              They're the homes you hear about from someone who has been there. The family that welcomes
              you in, the food that comes from their kitchen, the quiet road you wouldn't have found on
              your own.
            </p>
            <p>
              BeNative is a collection of such places, homes and stays rooted in their surroundings and
              run by people who know them best.
            </p>
            <p className="font-semibold text-brand-800">Come find a different side of India.</p>
          </div>

          <div className="mt-8">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-brand-700 font-semibold text-base hover:gap-3 transition-all duration-200 group"
            >
              Explore Homestays
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right — Why BeNative */}
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-brand-800 mb-8 text-center">
            Why BeNative?
          </h3>

          {/* 2×2 grid with short cross dividers */}
          <div className="relative grid grid-cols-2">
            {/* Vertical divider — short, centred */}
            <div className="absolute left-1/2 top-10 bottom-10 w-px bg-stone-400 -translate-x-1/2" />
            {/* Horizontal divider — short, centred */}
            <div className="absolute top-1/2 left-10 right-10 h-px bg-stone-400 -translate-y-1/2" />

            {WHY_ITEMS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3 py-7 px-5">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-brand-700" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-brand-900 text-base mb-1.5">{title}</p>
                  <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

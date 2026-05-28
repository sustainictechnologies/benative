import type { Metadata } from 'next'
import { Leaf, ShieldCheck, Phone, MapPin, Heart, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us · Be Native',
  description: 'Learn about Be Native — India\'s slow-travel community network connecting conscious travelers directly with local families across mountains, forests, villages, and coastlines.',
}

const values = [
  {
    icon: Phone,
    title: 'No Middleman',
    body: 'We connect you directly with host families. No booking engine, no commission, no chatbot. Just a real phone call.',
  },
  {
    icon: Leaf,
    title: 'Zero Fees — Always',
    body: 'Be Native does not charge travelers or hosts a booking fee. Every rupee you pay goes directly to the family hosting you.',
  },
  {
    icon: ShieldCheck,
    title: 'Personally Verified',
    body: 'Every host on Be Native is personally visited and verified. Solo female travelers get an explicit safety badge backed by real checks.',
  },
  {
    icon: Heart,
    title: 'Community First',
    body: 'Guests read and accept a community code of conduct before receiving host contact details. Respect is non-negotiable.',
  },
  {
    icon: Users,
    title: 'Local Livelihoods',
    body: 'Tourism income staying within the village — not flowing to an OTA headquartered elsewhere — is the whole point of this platform.',
  },
  {
    icon: MapPin,
    title: 'Rooted Across India',
    body: 'From the Himalayas to coastal villages, from desert hamlets to forest retreats — we are building a network of real homes across every landscape of India.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <MapPin size={12} /> Himalayas · Forests · Villages · Coastlines · Deserts
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 leading-tight mb-6">
            Shed the tourist mindset.<br />
            <span className="text-brand-600">Blend into the local ecosystem with respect.</span>
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed max-w-2xl mx-auto">
            Be Native is India's slow-travel community network — a directory of verified rural stays connecting
            conscious travelers directly with local families across mountains, forests, coastlines, deserts,
            and culturally rich villages. We exist to keep tourism money inside the communities that make
            India worth exploring.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed space-y-5">
          <p>
            Be Native didn't start as a business plan; it started as a realization that modern tourism is leaving
            the most genuine people behind.
          </p>
          <p>
            While traveling, we noticed a painful divide: major booking platforms are crowded with commercialized,
            hotel-style spaces optimized by algorithms. Meanwhile, the real families — the ones living deep in
            jungles, remote mountain tracks, or isolated rural villages — remain completely invisible. These are
            families who offer unmatched, deeply loving hospitality but cannot navigate the internet, manage
            digital dashboards, or afford online marketing.
          </p>
          <p>
            We built Be Native to act as their bridge to the conscious world.
          </p>
          <p>
            Our mission is to connect urban travelers directly with hosts who live a simple life. When you stay
            here, you are not buying a curated luxury package. You might sleep in a single rustic room or pitch
            a tent in a host's backyard. You won't get a designed menu; you will share whatever wholesome,
            region-specific meal the family is eating that day.
          </p>
          <p>
            This is an economy of empathy — a pure give-and-take opportunity to share thoughts, respect
            lifestyles, and become family. Because we believe in true community empowerment, Be Native charges
            zero fees to travelers and takes zero commission from hosts. <strong>100% of your money goes
            straight into the hands of families who preserve our lands and traditions</strong>, creating an
            equal ground where city and village meet.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-stone-100 border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">What we stand for</h2>
          <p className="text-stone-500 mb-12">Six principles that shape every decision we make.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6 flex flex-col gap-4 border border-stone-200">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon size={20} className="text-brand-600" />
                </div>
                <h3 className="font-semibold text-stone-900">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-4">Get in touch</h2>
        <p className="text-stone-500 mb-2">
          Want to list your homestay, report an issue, or just say hello?
        </p>
        <a
          href="mailto:sustainic.technologies@gmail.com"
          className="text-brand-600 hover:text-brand-800 font-medium transition-colors"
        >
          sustainic.technologies@gmail.com
        </a>
      </section>
    </>
  )
}
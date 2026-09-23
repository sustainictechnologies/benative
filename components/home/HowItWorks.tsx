import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const STEPS = [
  {
    word: 'Find',
    body: [
      'Look around. Browse homes by where they are, what they\'re like, the kind of trip you\'re planning or simply the feeling you\'re looking for.',
    ],
  },
  {
    word: 'Know',
    body: [
      'Take a little time to get to know the place. See the home, meet the hosts, discover the food and find out what\'s around.',
    ],
  },
  {
    word: 'Talk',
    body: [
      'Then talk to the person who knows it best. Ask about the rooms, the food, the journey, the weather, whatever you\'re curious about.',
    ],
  },
  {
    word: 'Go',
    body: [
      'Make your plans, pack your bags and go.',
      'Arrive as a traveller.',
      'Leave knowing a little more about the place and perhaps knowing someone there too.',
    ],
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-[#f8f7f2] px-6 py-20 sm:py-28">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
            Find. Know. Talk. Go.
          </h2>
          <p className="text-stone-500 text-base sm:text-lg">
            Finding a place to stay can be simple.
          </p>
        </div>

        {/* Steps — horizontal on desktop, vertical on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {STEPS.map(({ word, body }, i) => (
            <div
              key={word}
              className={`flex flex-col gap-3 py-8 sm:py-0 sm:px-8 ${
                i < STEPS.length - 1
                  ? 'border-b sm:border-b-0 sm:border-r border-stone-200'
                  : ''
              } ${i === 0 ? 'sm:pl-0' : ''} ${i === STEPS.length - 1 ? 'sm:pr-0' : ''}`}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                — {word}
              </p>
              <div className="space-y-3">
                {body.map((line, j) => (
                  <p
                    key={j}
                    className={`text-sm sm:text-base leading-relaxed ${
                      j === 0 ? 'text-stone-700' : 'text-stone-500 italic'
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 pt-10 border-t border-stone-200">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-brand-700 font-semibold text-base hover:gap-3 transition-all duration-200 group"
          >
            Explore Homestays
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  )
}

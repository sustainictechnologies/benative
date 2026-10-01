import { MapPin, Home, MessageCircle, Navigation } from 'lucide-react'

const STEPS = [
  {
    icon: MapPin,
    word: 'Find',
    body: [
      'Look around. Browse homes by where they are, what they\'re like, the kind of trip you\'re planning or simply the feeling you\'re looking for.',
    ],
  },
  {
    icon: Home,
    word: 'Know',
    body: [
      'Take a little time to get to know the place. See the home, meet the hosts, discover the food and find out what\'s around.',
    ],
  },
  {
    icon: MessageCircle,
    word: 'Talk',
    body: [
      'Then talk to the person who knows it best. Ask about the rooms, the food, the journey, the weather, whatever you\'re curious about.',
    ],
  },
  {
    icon: Navigation,
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
    <section className="bg-[#f8f7f2] px-4 sm:px-6 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-800 mb-3">
            How it Works
          </h2>
          <p className="text-lg sm:text-xl font-semibold text-stone-700 mb-1">
            Find. Know. Talk. Go.
          </p>
          <p className="text-stone-500 text-base sm:text-lg">
            Finding a place to stay can be simple.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 lg:gap-y-0">
          {STEPS.map(({ icon: Icon, word, body }, i) => (
            <div key={word} className="flex flex-col pr-8 last:pr-0">
              {/* Icon + connector line */}
              <div className="flex items-center mb-6">
                <Icon size={28} className="text-brand-800 shrink-0" strokeWidth={1.5} />
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-stone-300 ml-4 hidden lg:block" />
                )}
              </div>

              {/* Step number */}
              <p className="text-4xl font-bold text-brand-800 mb-1 leading-none">
                0{i + 1}
              </p>

              {/* Step label */}
              <p className="text-xs font-bold uppercase tracking-widest text-stone-600 mb-4">
                {word}
              </p>

              {/* Body */}
              <div className="space-y-2">
                {body.map((line, j) => (
                  <p
                    key={j}
                    className={`text-sm leading-relaxed ${
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

      </div>
    </section>
  )
}

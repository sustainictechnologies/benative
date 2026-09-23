import { Users, Heart, ShieldCheck, Compass } from 'lucide-react'

const ITEMS = [
  {
    icon: Users,
    title: 'Stay With Local Families',
    desc: 'Live with locals and experience real hospitality.',
  },
  {
    icon: Heart,
    title: 'Support Local Communities',
    desc: 'Your stay helps rural families and local communities.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe & Verified',
    desc: 'Verified hosts and stays you can trust.',
  },
  {
    icon: Compass,
    title: 'Explore Offbeat India',
    desc: 'Discover hidden places, nature, culture and local life.',
  },
]

export default function WhyBeNative() {
  return (
    <section className="bg-white px-6 py-20 sm:py-24">
      <div className="max-w-5xl mx-auto">

        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-14 text-center">
          Why BeNative?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {ITEMS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-brand-700" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-semibold text-stone-900 text-sm mb-1.5">{title}</p>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

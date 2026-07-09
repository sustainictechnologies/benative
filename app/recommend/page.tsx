import type { Metadata } from 'next'
import { Heart, Gem, Users, Map, Shield, Leaf, ClipboardList, Mail, Home } from 'lucide-react'
import RecommendForm from './RecommendForm'

export const metadata: Metadata = {
  title: 'Recommend a Homestay · BeNative',
  description: 'Know a hidden gem homestay? Recommend it to BeNative and help conscious travelers discover authentic rural India.',
}

const benefits = [
  {
    icon: Gem,
    title: 'Hidden gems',
    body: "You know places that aren't online yet.",
  },
  {
    icon: Users,
    title: 'Support local families',
    body: 'Your tip can bring guests and income to a family.',
  },
  {
    icon: Map,
    title: 'Grow the map',
    body: 'Every recommendation helps build authentic rural India.',
  },
]

const steps = [
  {
    num: '1',
    icon: ClipboardList,
    title: 'We review',
    body: 'Our team carefully reviews your recommendation.',
  },
  {
    num: '2',
    icon: Mail,
    title: 'We reach out',
    body: 'We contact the host (if possible) and learn more about the place.',
  },
  {
    num: '3',
    icon: Home,
    title: 'We invite to join',
    body: "If it's a good fit, we invite them to join BeNative.",
  },
]

export default function RecommendPage() {
  return (
    <div className="min-h-screen bg-stone-50">

      {/* Hero */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Heart size={11} className="text-brand-600 fill-brand-600" /> Know a great place?
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 leading-tight mb-4">
                Recommend a<br />
                <span className="text-brand-600">Homestay</span>
              </h1>
              <p className="text-stone-500 text-base leading-relaxed">
                Many of India's best homestays aren't listed online.<br className="hidden sm:block" />
                Your recommendation helps us discover authentic places<br className="hidden sm:block" />
                and support local families.
              </p>
            </div>

            {/* Right - benefit cards */}
            <div className="space-y-3">
              {benefits.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex items-start gap-4 p-4 bg-white border border-stone-100 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-full border-2 border-brand-100 flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-brand-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-700 text-sm">{title}</p>
                    <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <div className="bg-stone-100 border-y border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-2">
          <Shield size={14} className="text-brand-600 shrink-0" />
          <p className="text-sm text-stone-600 font-medium">We review every recommendation personally before contacting any host.</p>
        </div>
      </div>

      {/* Form card */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-3xl border border-stone-100 shadow-card overflow-hidden">
          <div className="grid md:grid-cols-[260px_1fr]">

            {/* Sidebar */}
            <div className="bg-stone-50 border-r border-stone-100 p-8 flex flex-col gap-6">

              {/* Icon + heading */}
              <div>
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center mb-4">
                  <Leaf size={18} className="text-brand-600" />
                </div>
                <h2 className="text-lg font-bold text-brand-700 mb-2">Share what you know</h2>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Every recommendation helps us discover genuine homestays.
                </p>
              </div>

              {/* Quote */}
              <div className="mt-auto bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
                <span className="text-4xl text-brand-100 font-serif leading-none select-none">&ldquo;</span>
                <p className="text-sm text-stone-600 italic leading-relaxed -mt-1">
                  Together, we can help travelers find real places and real people.
                </p>
                <div className="flex justify-end mt-3">
                  <Heart size={16} className="text-brand-200 fill-brand-200" />
                </div>
              </div>
            </div>

            {/* Form area */}
            <div className="p-8">
              <RecommendForm />
            </div>
          </div>
        </div>
      </section>

      {/* What happens next */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-white rounded-3xl border border-stone-100 shadow-card p-8 sm:p-10">
          <div className="flex items-center justify-center gap-2 mb-10">
            <span className="text-lg">🌿</span>
            <h2 className="text-xl font-bold text-stone-900">What happens next?</h2>
            <span className="text-lg">🌿</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Dashed connector lines */}
            <div className="hidden sm:block absolute top-4 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px border-t-2 border-dashed border-stone-200" />

            {steps.map(({ num, icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-sm mb-3 relative z-10">
                  {num}
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-brand-600" />
                </div>
                <p className="font-semibold text-stone-900 text-sm mb-1">{title}</p>
                <p className="text-xs text-stone-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

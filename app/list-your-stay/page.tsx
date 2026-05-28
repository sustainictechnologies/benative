import type { Metadata } from 'next'
import HostRegistrationForm from './HostRegistrationForm'
import { Home, ShieldCheck, Phone, Leaf } from 'lucide-react'

export const metadata: Metadata = {
  title: 'List Your Homestay · Be Native',
  description: 'Register your homestay on Be Native. Connect with conscious travelers across India. Zero commission, direct contact.',
}

const perks = [
  { icon: Leaf,        title: 'Zero Commission',   body: 'JALAD never takes a cut. 100% of what guests pay goes directly to you.' },
  { icon: Phone,       title: 'Direct Contact',    body: 'Guests call or WhatsApp you directly. No middleman, no chatbot.' },
  { icon: ShieldCheck, title: 'Verified Badge',    body: 'We personally visit and verify hosts. A verified badge builds trust fast.' },
  { icon: Home,        title: 'Your Own Page',     body: 'A beautiful dedicated page for your homestay, photos, and story.' },
]

export default function ListYourStayPage() {
  return (
    <div className="min-h-screen bg-stone-50">

      {/* Hero */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Home size={12} /> For Host Families
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 leading-tight mb-4">
            Share your home.<br />
            <span className="text-brand-600">Welcome the world.</span>
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed max-w-xl mx-auto">
            Join India's slow-travel community. List your homestay on JALAD and connect directly with
            conscious travelers — at zero cost to you.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {perks.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
                <Icon size={18} className="text-brand-600" />
              </div>
              <h3 className="font-semibold text-stone-900 text-sm mb-1">{title}</h3>
              <p className="text-xs text-stone-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-white rounded-3xl border border-stone-100 shadow-card p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-stone-900 mb-1">Register your homestay</h2>
          <p className="text-stone-500 text-sm mb-8">Fill in the details below and we'll get in touch within 48 hours.</p>
          <HostRegistrationForm />
        </div>
      </section>

    </div>
  )
}

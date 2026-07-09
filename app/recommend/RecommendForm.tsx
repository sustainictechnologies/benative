'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, User, Home, MessageCircle, Lock, Send } from 'lucide-react'
import { submitRecommendation } from './actions'

export default function RecommendForm() {
  const [form, setForm] = useState({
    recommender_name:  '',
    recommender_phone: '',
    recommender_email: '',
    homestay_name:     '',
    address:           '',
    host_name:         '',
    host_contact:      '',
    description:       '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await submitRecommendation(form)
    setLoading(false)
    if (!result.success) {
      setError('Something went wrong. Please try again.')
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-brand-600" />
        </div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Thank you!</h3>
        <p className="text-stone-500 text-sm leading-relaxed max-w-sm mx-auto">
          Your recommendation has been received. We'll explore the homestay and reach out if we need more details.
        </p>
      </div>
    )
  }

  const inputCls = "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-all bg-stone-50"
  const labelCls = "block text-xs font-semibold text-stone-500 mb-1.5"

  function SectionHeader({ icon: Icon, label, optional = true }: { icon: React.ElementType; label: string; optional?: boolean }) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Icon size={15} className="text-brand-600 shrink-0" />
        <span className="text-sm font-semibold text-stone-900">{label}</span>
        {optional && <span className="text-sm text-stone-400">(Optional)</span>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">

      {/* About You */}
      <div>
        <SectionHeader icon={User} label="About You" />
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Your Name</label>
              <input className={inputCls} placeholder="Full name"
                value={form.recommender_name}
                onChange={(e) => set('recommender_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Phone or WhatsApp</label>
              <input className={inputCls} placeholder="+91 XXXXX XXXXX" type="tel"
                value={form.recommender_phone}
                onChange={(e) => set('recommender_phone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Your Email</label>
            <input className={inputCls} placeholder="your@email.com" type="email"
              value={form.recommender_email}
              onChange={(e) => set('recommender_email', e.target.value)} />
          </div>
        </div>
      </div>

      {/* About the Homestay */}
      <div className="border-t border-stone-100 pt-7">
        <SectionHeader icon={Home} label="About the Homestay" optional={false} />
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Homestay Name (if known)</label>
            <input className={inputCls} placeholder="What is it called?"
              value={form.homestay_name}
              onChange={(e) => set('homestay_name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Location / Address</label>
            <input className={inputCls} placeholder="Village, district, state — any details help"
              value={form.address}
              onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Host Name (if known)</label>
              <input className={inputCls} placeholder="Owner's name"
                value={form.host_name}
                onChange={(e) => set('host_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Host Contact (if known)</label>
              <input className={inputCls} placeholder="Phone or email"
                value={form.host_contact}
                onChange={(e) => set('host_contact', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Tell us more */}
      <div className="border-t border-stone-100 pt-7">
        <SectionHeader icon={MessageCircle} label="Tell us more" />
        <div>
          <label className={labelCls}>Why do you recommend this place?</label>
          <textarea
            rows={4}
            className={inputCls}
            placeholder="Tell us what makes it special — the experience, food, hospitality, surroundings, or anything else…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-70 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
          : <><Send size={15} /> Recommend this Homestay</>}
      </button>

      <p className="text-center text-xs text-stone-400 flex items-center justify-center gap-1.5">
        <Lock size={11} /> All information is safe with us and used only for this purpose.
      </p>

    </form>
  )
}

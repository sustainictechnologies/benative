'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendListingEmails } from './actions'

const STAY_TYPES = [
  'Room in family home',
  'Entire house / cottage',
  'Farm stay',
  'Forest / nature stay',
  'Tent / camping',
  'Mountain stay',
  'Beach stay',
  'Other',
]

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

export default function HostRegistrationForm() {
  const [form, setForm] = useState({
    host_name: '',
    phone: '',
    email: '',
    village: '',
    district: '',
    state: '',
    stay_type: '',
    rooms: '',
    description: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: dbError } = await supabase
      .from('host_applications')
      .insert({
        host_name:   form.host_name,
        phone:       form.phone,
        email:       form.email,
        village:     form.village,
        district:    form.district,
        state:       form.state,
        stay_type:   form.stay_type,
        rooms:       parseInt(form.rooms),
        description: form.description,
      })
      // no .select() — anon role can insert but not read back (RLS)

    if (dbError) {
      console.error('host_applications insert error:', dbError)
      setLoading(false)
      setError('Something went wrong. Please try again or email us directly at sustainic.technologies@gmail.com')
      return
    }

    const emailResult = await sendListingEmails(form)
    setLoading(false)

    if (emailResult?.error) {
      setError(emailResult.error)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-brand-600" />
        </div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Application received!</h3>
        <p className="text-stone-500 text-sm leading-relaxed max-w-sm mx-auto">
          Thank you, <strong>{form.host_name}</strong>. We've saved your listing request and will
          contact you at <strong>{form.phone}</strong> within 48 hours.
        </p>
      </div>
    )
  }

  const inputCls = "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-all bg-stone-50"
  const labelCls = "block text-xs font-semibold text-stone-600 mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Name + Phone */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Your Name *</label>
          <input required className={inputCls} placeholder="Full name" value={form.host_name}
            onChange={(e) => set('host_name', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Phone / WhatsApp *</label>
          <input required className={inputCls} placeholder="+91 XXXXX XXXXX" type="tel" value={form.phone}
            onChange={(e) => set('phone', e.target.value)} />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className={labelCls}>Email *</label>
        <input required className={inputCls} placeholder="your@email.com" type="email" value={form.email}
          onChange={(e) => set('email', e.target.value)} />
      </div>

      {/* Village + District */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Village / Town *</label>
          <input required className={inputCls} placeholder="e.g. Malvan" value={form.village}
            onChange={(e) => set('village', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>District *</label>
          <input required className={inputCls} placeholder="e.g. Sindhudurg" value={form.district}
            onChange={(e) => set('district', e.target.value)} />
        </div>
      </div>

      {/* State */}
      <div>
        <label className={labelCls}>State *</label>
        <select required className={inputCls} value={form.state}
          onChange={(e) => set('state', e.target.value)}>
          <option value="">Select state…</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Stay type + Rooms */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Type of Stay *</label>
          <select required className={inputCls} value={form.stay_type}
            onChange={(e) => set('stay_type', e.target.value)}>
            <option value="">Select type…</option>
            {STAY_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Number of Guest Rooms *</label>
          <input required className={inputCls} placeholder="e.g. 2" type="number" min="1" max="50"
            value={form.rooms} onChange={(e) => set('rooms', e.target.value)} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Tell us about your home *</label>
        <textarea required rows={4} className={inputCls} value={form.description}
          placeholder="Describe your home, surroundings, what makes it special, nearby attractions, food you offer, etc."
          onChange={(e) => set('description', e.target.value)} />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white font-semibold py-3 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
          : 'Submit Listing Request'}
      </button>

      <p className="text-center text-xs text-stone-400">
        Once reviewed, we'll contact you.
      </p>
    </form>
  )
}

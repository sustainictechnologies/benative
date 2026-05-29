'use client'

import { useState } from 'react'
import { ShieldCheck, Clock, Eye, EyeOff } from 'lucide-react'

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) return '91' + digits.slice(1)
  if (digits.length === 10) return '91' + digits
  return digits
}

function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{4})/g, '•')
}

function waUrl(phone: string, message: string) {
  return `https://wa.me/${formatPhone(phone)}?text=${encodeURIComponent(message)}`
}

interface Props {
  hostName: string
  phone: string
  callingWindow?: string
}

export default function WhatsAppContactButton({ hostName, phone, callingWindow }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const msgAvailability = `Hello ${hostName}, I found your homestay on Be Native and wanted to check availability.`

  return (
    <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-5 space-y-4">

      {/* Verified host + response time */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-green-600" />
          <span className="text-sm font-semibold text-green-800">Verified Host</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
          Usually responds within 2 hrs
        </div>
      </div>

      {/* CTA */}
      <a
        href={waUrl(phone, msgAvailability)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-3 px-5 rounded-xl shadow-md shadow-green-200/60 transition-colors"
      >
        <WhatsAppIcon size={20} />
        <span className="flex-1">Chat with Host on WhatsApp</span>
      </a>

      {/* Calling window */}
      {callingWindow && (
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <Clock size={12} />
          <span>Best time to reach: {callingWindow}</span>
        </div>
      )}

      {/* Reveal number fallback */}
      <div className="border-t border-green-100 pt-3">
        {!showConfirm && !revealed && (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
          >
            Prefer to call? Reveal number
          </button>
        )}

        {showConfirm && !revealed && (
          <div className="flex items-center gap-3">
            <p className="text-xs text-stone-500 flex-1">Use WhatsApp to keep the community safe. Still reveal?</p>
            <button
              onClick={() => { setRevealed(true); setShowConfirm(false) }}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 shrink-0"
            >
              Yes
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-xs text-stone-400 hover:text-stone-600 shrink-0"
            >
              Cancel
            </button>
          </div>
        )}

        {revealed && (
          <RevealedNumber phone={phone} onHide={() => setRevealed(false)} />
        )}
      </div>
    </div>
  )
}

function RevealedNumber({ phone, onHide }: { phone: string; onHide: () => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-mono tracking-wide ${show ? 'text-stone-800' : 'text-stone-400 select-none'}`}>
        {show ? phone : maskPhone(phone)}
      </span>
      <button onClick={() => setShow(v => !v)} className="text-stone-400 hover:text-brand-600 transition-colors">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
      <button onClick={onHide} className="text-xs text-stone-300 hover:text-stone-500 transition-colors ml-auto">
        Hide
      </button>
    </div>
  )
}

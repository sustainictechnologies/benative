'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Lock, Phone, Mail, MapPin, Clock, MessageCircle, Globe } from 'lucide-react'
import { FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa'
import WhatsAppContactButton from '@/components/WhatsAppContactButton'
import type { ContactBlockData } from '@/types/blocks.types'

interface Props {
  data: ContactBlockData
  hostName: string
  phone: string
  callingWindow: string
  isLoggedIn: boolean
  slug: string
}

function shown(val: string | undefined | null, flag: boolean | undefined): val is string {
  return !!val && flag !== false
}

export default function ContactBlock({ data, hostName, phone, callingWindow, isLoggedIn, slug }: Props) {
  const [accepted, setAccepted] = useState(false)

  const displayName    = data.host_name || hostName
  const waPhone        = (shown(data.whatsapp, data.whatsapp_show) ? data.whatsapp : null)
                      ?? (shown(data.phone, data.phone_show) ? data.phone : null)
                      ?? phone
  const displayWindow  = shown(data.calling_window, data.calling_window_show)
                        ? data.calling_window
                        : callingWindow

  const contactItems: { Icon: React.ElementType; label: string }[] = []
  if (shown(data.phone, data.phone_show))               contactItems.push({ Icon: Phone,         label: data.phone })
  if (shown(data.whatsapp, data.whatsapp_show))         contactItems.push({ Icon: MessageCircle, label: data.whatsapp })
  if (shown(data.alt_phone, data.alt_phone_show))       contactItems.push({ Icon: Phone,         label: `Alt: ${data.alt_phone}` })
  if (shown(data.alt_whatsapp, data.alt_whatsapp_show)) contactItems.push({ Icon: MessageCircle, label: `Alt: ${data.alt_whatsapp}` })
  if (shown(data.email, data.email_show))               contactItems.push({ Icon: Mail,          label: data.email })
  if (shown(data.address, data.address_show))           contactItems.push({ Icon: MapPin,        label: data.address })
  if (shown(data.calling_window, data.calling_window_show)) contactItems.push({ Icon: Clock,    label: `Best time: ${data.calling_window}` })

  const socialLinks: { href: string; Icon: React.ElementType; label: string; color: string }[] = []
  if (shown(data.website,   data.website_show))   socialLinks.push({ href: data.website,   Icon: Globe,        label: 'Website',   color: '#1e6b1e' })
  if (shown(data.instagram, data.instagram_show)) socialLinks.push({ href: data.instagram, Icon: FaInstagram,  label: 'Instagram', color: '#E1306C' })
  if (shown(data.facebook,  data.facebook_show))  socialLinks.push({ href: data.facebook,  Icon: FaFacebookF,  label: 'Facebook',  color: '#1877F2' })
  if (shown(data.youtube,   data.youtube_show))   socialLinks.push({ href: data.youtube,   Icon: FaYoutube,    label: 'YouTube',   color: '#FF0000' })

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
      <p className="font-semibold text-stone-900 text-base">{displayName}</p>

      {!isLoggedIn ? (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
            <Lock size={20} className="text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-1">Login to view contact details</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              Create a free account to connect directly with this host family.
            </p>
          </div>
          <Link
            href={`/login?next=/homestays/${slug}`}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-full transition-all shadow-md text-sm"
          >
            Login / Create Account
          </Link>
        </div>
      ) : !accepted ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-600" />
            <h3 className="font-semibold text-amber-900 text-sm">Community Code of Conduct</h3>
          </div>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>Respect the host family's home, culture, and privacy.</li>
            <li>No single-use plastic. Carry a reusable bottle.</li>
            <li>Quiet hours after 10:00 PM. Early morning birding is welcome.</li>
            <li>Traditional attire expected near temples and prayer areas.</li>
            <li>Do not share the host's contact number publicly.</li>
          </ul>
          <label className="flex items-start gap-2.5 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-400 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-amber-900 font-medium">
              I have read and agree to the Be Native community code of conduct.
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <WhatsAppContactButton
            hostName={displayName}
            phone={waPhone}
            callingWindow={displayWindow}
          />

          {contactItems.length > 0 && (
            <div className="space-y-2 pt-1">
              {contactItems.map(({ Icon, label }, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                  <Icon size={14} className="text-stone-400 shrink-0 mt-0.5" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3 border-t border-stone-100 pt-4">
              {socialLinks.map(({ href, Icon, label, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="w-9 h-9 rounded-full bg-stone-100 hover:opacity-80 flex items-center justify-center transition-opacity"
                  style={{ color }}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

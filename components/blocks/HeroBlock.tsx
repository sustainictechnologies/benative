'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Lock } from 'lucide-react'
import type { HeroBlockData } from '@/types/blocks.types'
import WhatsAppContactButton from '@/components/WhatsAppContactButton'

interface Props {
  data: HeroBlockData
  hostName: string
  phone: string
  callingWindow: string
  isLoggedIn: boolean
  slug: string
}

export default function HeroBlock({ data, hostName, phone, callingWindow, isLoggedIn, slug }: Props) {
  const [accepted, setAccepted] = useState(false)

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white">
      {/* Cover image */}
      {data.cover_image_url && (
        <div className="relative w-full h-56 sm:h-72 bg-stone-100">
          <Image
            src={data.cover_image_url}
            alt={`${hostName}'s homestay`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      <div className="p-6 space-y-5">
        {data.tagline && (
          <p className="text-base text-stone-600 italic">"{data.tagline}"</p>
        )}

        {/* Auth gate — must be logged in first */}
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
          <WhatsAppContactButton
            hostName={hostName}
            phone={phone}
            callingWindow={callingWindow}
          />
        )}
      </div>
    </div>
  )
}
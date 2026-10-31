'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, Link2, Check } from 'lucide-react'
import { FaWhatsapp, FaFacebookF } from 'react-icons/fa'

interface Props {
  title: string
  place: string
  slug:  string
}

export default function ShareButton({ title, place, slug }: Props) {
  const [open, setOpen]     = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)

  // The menu closes on a click outside it, or Esc
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => { if (!wrapper.current?.contains(e.target as Node)) setOpen(false) }
    const onKey   = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const link    = () => `${window.location.origin}/homestays/${slug}`
  const message = `Have a look at ${title.trim()} in ${place} on BeNative`

  // Phones open their own share list; computers (and phones without one) get the small menu
  const share = async () => {
    if (window.matchMedia('(pointer: coarse)').matches && navigator.share) {
      try {
        await navigator.share({ title: title.trim(), text: message, url: link() })
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setOpen(true)   // AbortError: closed without sharing
      }
      return
    }
    setOpen(o => !o)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link())
    } catch {
      window.prompt('Copy this link', link())   // the browser refused the clipboard
      return
    }
    setCopied(true)
    setTimeout(() => { setCopied(false); setOpen(false) }, 1500)
  }

  const item = 'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors'

  return (
    <div ref={wrapper} className="relative shrink-0">
      <button
        type="button"
        onClick={share}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm font-semibold px-3.5 py-2 rounded-full transition-colors"
      >
        <Share2 size={15} /> Share
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 z-20 w-44 bg-white border border-stone-200 rounded-xl shadow-lg py-1 overflow-hidden">
          <a
            role="menuitem"
            href={`https://wa.me/?text=${encodeURIComponent(`${message}: ${link()}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={item}
          >
            <FaWhatsapp size={16} style={{ color: '#25D366' }} /> WhatsApp
          </a>
          <a
            role="menuitem"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link())}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={item}
          >
            <FaFacebookF size={15} style={{ color: '#1877F2' }} /> Facebook
          </a>
          <button type="button" role="menuitem" onClick={copyLink} className={item}>
            {copied ? <Check size={16} className="text-brand-600" /> : <Link2 size={16} className="text-stone-400" />}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}

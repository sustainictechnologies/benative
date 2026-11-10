'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, Link2, Check } from 'lucide-react'
import { FaWhatsapp, FaFacebookF } from 'react-icons/fa'

interface Props {
  title:   string
  place:   string
  slug:    string
  isHost?: boolean   // a host shares their own homestay with their own message
}

// Also used on the host's launch page (app/launch/[token])
export const hostMessage = (link: string) => `🌿 Happy to share that my homestay is now featured on BeNative!

I've shared a little about my home, the surroundings and the experiences you can enjoy here.

Have a look and do share it with anyone who might be interested in visiting!

🔗 ${link}

Looking forward to welcoming you! 😊`

export default function ShareButton({ title, place, slug, isHost = false }: Props) {
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
  const fullMessage = () => (isHost ? hostMessage(link()) : `${message}: ${link()}`)

  // Phones open their own share list; computers (and phones without one) get the small menu
  const share = async () => {
    if (window.matchMedia('(pointer: coarse)').matches && navigator.share) {
      try {
        // The host's message has the link inside it, so it goes as one text
        await navigator.share(isHost
          ? { title: title.trim(), text: fullMessage() }
          : { title: title.trim(), text: message, url: link() })
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setOpen(true)   // AbortError: closed without sharing
      }
      return
    }
    setOpen(o => !o)
  }

  const copy = async () => {
    const text = isHost ? fullMessage() : link()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      window.prompt('Copy this', text)   // the browser refused the clipboard
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
            href={`https://wa.me/?text=${encodeURIComponent(fullMessage())}`}
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
          <button type="button" role="menuitem" onClick={copy} className={item}>
            {copied ? <Check size={16} className="text-brand-600" /> : <Link2 size={16} className="text-stone-400" />}
            {copied ? (isHost ? 'Message copied' : 'Link copied') : (isHost ? 'Copy message' : 'Copy link')}
          </button>
        </div>
      )}
    </div>
  )
}

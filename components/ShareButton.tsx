'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, Link2, Check } from 'lucide-react'
import { FaWhatsapp, FaFacebookF, FaInstagram } from 'react-icons/fa'
import { makeStoryImage } from '@/lib/storyImage'

interface Props {
  title:   string
  place:   string
  slug:    string
  photo?:  string | null   // the homestay's main photo, for the Instagram Story picture
  isHost?: boolean         // a host shares their own homestay with their own message
}

// Also used on the host's launch page (app/launch/[token])
export const hostMessage = (link: string) => `🌿 Happy to share that my homestay is now featured on BeNative!

I've shared a little about my home, the surroundings and the experiences you can enjoy here.

Have a look and do share it with anyone who might be interested in visiting!

🔗 ${link}

Looking forward to welcoming you! 😊`

export default function ShareButton({ title, place, slug, photo = null, isHost = false }: Props) {
  const [open, setOpen]       = useState(false)
  const [copied, setCopied]   = useState(false)
  const [phone, setPhone]     = useState(false)   // phones get Instagram Story and their own share list
  const [classic, setClassic] = useState(false)   // the WhatsApp, Facebook and Copy link choices
  const [story, setStory]     = useState<'idle' | 'making' | 'again' | 'failed'>('idle')
  const [picture, setPicture] = useState<string | null>(null)   // shown when the browser can't pass a picture on
  const wrapper  = useRef<HTMLDivElement>(null)
  const storyPic = useRef<{ file?: File | null; making: Promise<File | null> } | null>(null)

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

  // Phones get Instagram Story and "More ways to share" (the phone's own share list).
  // Computers, and phones without a share list, get WhatsApp, Facebook and Copy link.
  const toggle = () => {
    if (open) { setOpen(false); return }
    const onPhone = window.matchMedia('(pointer: coarse)').matches
    setPhone(onPhone)
    setClassic(!onPhone || !navigator.share)
    setStory('idle')
    if (onPhone) makePicture()
    setOpen(true)
  }

  // The Story picture is made once, as soon as the phone menu opens, so it is ready when chosen
  const makePicture = () => {
    if (!storyPic.current) {
      const entry = {} as { file?: File | null; making: Promise<File | null> }
      entry.making = makeStoryImage({ photo, title, place, slug })
        .catch(() => null)
        .then((file) => (entry.file = file))
      storyPic.current = entry
    }
    return storyPic.current
  }

  // Instagram offers Story only for a picture. The page link is copied too, for Instagram's Link sticker.
  const shareStory = async () => {
    navigator.clipboard?.writeText(link()).catch(() => {})
    const entry = makePicture()
    let file = entry.file
    if (file === undefined) {   // still being made
      setStory('making')
      file = await entry.making
    }
    if (!file) { storyPic.current = null; setStory('failed'); return }
    if (!navigator.canShare?.({ files: [file] })) { showPicture(file); return }
    try {
      await navigator.share({ files: [file] })
      setOpen(false)
    } catch (e) {
      const name = (e as Error).name
      // Phones share only straight after a tap: when the picture took a moment, the next tap shares it at once
      if (name === 'NotAllowedError' && story !== 'again') { setStory('again'); return }
      if (name === 'AbortError') setOpen(false)   // closed without sharing
      else showPicture(file)
    }
    setStory('idle')
  }

  // In browsers that can't pass a picture on (such as some apps' own browsers), the picture is shown to save
  const showPicture = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => { setPicture(reader.result as string); setOpen(false); setStory('idle') }
    reader.readAsDataURL(file)
  }

  const shareNative = async () => {
    try {
      // The host's message has the link inside it, so it goes as one text
      await navigator.share(isHost
        ? { title: title.trim(), text: fullMessage() }
        : { title: title.trim(), text: message, url: link() })
      setOpen(false)
    } catch (e) {
      if ((e as Error).name === 'AbortError') setOpen(false)   // closed without sharing
      else setClassic(true)                                     // the share list failed: WhatsApp, Facebook, Copy link
    }
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

  const storyLabel = { idle: 'Instagram Story', making: 'Making the picture…', again: 'Picture ready: tap to share', failed: 'Instagram Story' }[story]
  const storyHint  = story === 'failed'
    ? "Couldn't make the picture. Please try again."
    : "Shares a picture. The page link is copied for Instagram's Link sticker."

  return (
    <div ref={wrapper} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm font-semibold px-3.5 py-2 rounded-full transition-colors"
      >
        <Share2 size={15} /> Share
      </button>

      {open && (
        <div role="menu" className={`absolute right-0 top-full mt-2 z-20 ${phone ? 'w-64' : 'w-44'} bg-white border border-stone-200 rounded-xl shadow-lg py-1 overflow-hidden`}>
          {phone && (
            <button
              type="button"
              role="menuitem"
              onClick={shareStory}
              disabled={story === 'making'}
              className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-sm text-left text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-70"
            >
              <FaInstagram size={16} className="mt-0.5 shrink-0" style={{ color: '#E1306C' }} />
              <span>
                {storyLabel}
                <span className="block text-xs text-stone-400 mt-0.5">{storyHint}</span>
              </span>
            </button>
          )}
          {phone && !classic && (
            <button type="button" role="menuitem" onClick={shareNative} className={item}>
              <Share2 size={16} className="text-stone-400" /> More ways to share
            </button>
          )}
          {classic && (
            <>
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
            </>
          )}
        </div>
      )}

      {picture && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Picture for your Instagram Story"
          onClick={() => setPicture(null)}
          className="fixed inset-0 z-[1100] bg-black/90 flex flex-col items-center justify-center gap-4 p-4 text-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={picture} alt={`${title.trim()} on BeNative`} onClick={(e) => e.stopPropagation()} className="max-h-[62vh] w-auto rounded-xl shadow-2xl" />
          <p className="text-sm text-white/90 max-w-xs">
            Press and hold the picture to save it, then add it to your Instagram Story. The page link is copied for the Link sticker.
          </p>
          <div className="flex gap-2">
            <a
              href={picture}
              download={`${slug}-benative-story.jpg`}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-stone-800 text-sm font-semibold px-4 py-2 rounded-full"
            >
              Save picture
            </a>
            <button type="button" onClick={() => setPicture(null)} className="border border-white/40 text-white text-sm font-semibold px-4 py-2 rounded-full">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

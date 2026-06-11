'use client'

import { useRef, useState, useTransition } from 'react'
import { sendContactEmail } from './actions'
import { Send } from 'lucide-react'

export default function ContactForm() {
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await sendContactEmail(formData)
      setResult(res)
      if (res.success) formRef.current?.reset()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
        <input
          name="name"
          type="text"
          required
          placeholder="Your name"
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Message</label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Write your message here..."
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition resize-none"
        />
      </div>

      {result?.error && (
        <p className="text-red-500 text-sm">{result.error}</p>
      )}
      {result?.success && (
        <p className="text-green-600 text-sm font-medium">Message sent! We'll get back to you soon.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
      >
        <Send size={15} />
        {isPending ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}

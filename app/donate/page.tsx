import Link from 'next/link'
import { Heart } from 'lucide-react'

export const metadata = {
  title: 'Donate | BeNative',
}

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-10 text-center space-y-5">
        <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
          <Heart size={26} className="text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Support Sustainable Traveling</h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          Your contribution helps us keep this platform free for rural host families and conscious travellers across India.
        </p>
        <p className="text-xs text-stone-400 bg-stone-50 rounded-xl px-4 py-3">
          Payment coming soon. Get in touch at{' '}
          <a href="mailto:sustainic.technologies@gmail.com" className="text-brand-600 underline">
            sustainic.technologies@gmail.com
          </a>
        </p>
        <Link
          href="/"
          className="inline-block text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}

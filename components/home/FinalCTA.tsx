import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'

export default function FinalCTA({ imageMap = {} }: { imageMap?: Record<string, string> }) {
  return (
    <section className="bg-[#f8f7f2] px-4 sm:px-6 py-10 sm:py-12">
      <div className="max-w-7xl mx-auto relative bg-brand-700 rounded-3xl overflow-hidden px-8 py-16 text-center">
        {/* The admin's CTA image, shown as a faint texture behind the green */}
        <div className="absolute inset-0 opacity-15">
          <Image
            src={imageMap['cta_background'] ?? 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=60'}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to experience Hidden India?
          </h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto text-lg">
            Browse verified homestays across mountains, forests, villages, and coastlines. Call the host directly. Pay zero fees.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-3.5 rounded-full hover:bg-stone-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <MapPin size={16} /> Discover
          </Link>
        </div>
      </div>
    </section>
  )
}

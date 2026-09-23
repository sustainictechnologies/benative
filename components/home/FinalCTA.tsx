import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="relative h-[75vh] min-h-[480px] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=75"
          alt="Hidden India"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-8 max-w-2xl">
          Ready to experience hidden India?
        </h2>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 bg-white text-stone-900 font-semibold text-sm px-7 py-3 rounded-full hover:bg-stone-100 transition-colors"
        >
          Explore Homestays <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  )
}

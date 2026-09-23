import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function IntroductionSection() {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="max-w-2xl mx-auto">

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 leading-snug mb-10">
          Travel a little closer to the place.
        </h2>

        <div className="space-y-5 text-stone-600 text-base sm:text-lg leading-relaxed">
          <p>
            Some of the best stays aren't the ones you find everywhere.
          </p>
          <p>
            They're the homes you hear about from someone who has been there. The family that welcomes
            you in, the food that comes from their kitchen, the quiet road you wouldn't have found on
            your own.
          </p>
          <p>
            BeNative is a collection of such places, homes and stays rooted in their surroundings and
            run by people who know them best.
          </p>
          <p className="text-stone-800 font-medium">
            Come find a different side of India.
          </p>
        </div>

        <div className="mt-10">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-brand-700 font-semibold text-base hover:gap-3 transition-all duration-200 group"
          >
            Explore Homestays
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  )
}

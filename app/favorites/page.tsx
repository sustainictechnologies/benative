import Link from 'next/link'
import { Heart, MapPin } from 'lucide-react'

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f2]">
      <div className="max-w-3xl mx-auto px-4 py-12">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Heart size={22} className="text-red-400" /> Favourite Homestays
          </h1>
          <p className="text-sm text-stone-400 mt-1">Homestays you've saved will appear here</p>
        </div>

        {/* Empty state */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <Heart size={28} className="text-red-300" />
          </div>
          <div className="text-center">
            <p className="text-stone-600 font-semibold">No favourites yet</p>
            <p className="text-stone-400 text-sm mt-1">Start exploring and save homestays you love</p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors mt-2"
          >
            <MapPin size={14} /> Explore Homestays
          </Link>
        </div>

      </div>
    </div>
  )
}

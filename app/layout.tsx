import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Search, Menu, Heart } from 'lucide-react'
import NavLinks from '@/components/NavLinks'
import UserButton from '@/components/UserButton'
import BeNativeLogo from '@/components/BeNativeLogo'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Be Native | Community Travel Across India',
  description:
    'Discover verified homestays from conscious local families across India â€” mountains, forests, villages, coastlines, and deserts. Direct host contact. Zero fees.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-stone-900 antialiased`}>

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-end pb-2 gap-5">

            {/* Logo */}
            <Link href="/" className="flex items-end gap-2 shrink-0">
              <BeNativeLogo height={36} markOnly={true} />
              <div className="leading-none pb-0.5">
                <p className="text-base font-bold tracking-tight" style={{ color: '#2d4520' }}>BeNative</p>
                <p className="text-[9px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#2d4520' }}>Travel Beyond the Guidebook</p>
              </div>
            </Link>

            {/* Search bar */}
            <div className="flex-1 max-w-sm hidden md:flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-full px-4 py-2 hover:border-brand-300 transition-colors cursor-text">
              <Search size={14} className="text-stone-400 shrink-0" />
              <span className="text-sm text-stone-400 flex-1 select-none">Where do you want to go?</span>
              <div className="w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center shrink-0">
                <Search size={11} className="text-white" />
              </div>
            </div>

            {/* Nav links */}
            <NavLinks />

            {/* Top-right icons */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <Link
                href="/favorites"
                className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
                title="Favourite Homestays"
              >
                <Heart size={18} className="text-stone-500 hover:text-red-500 transition-colors" />
              </Link>
              <UserButton />
              <button className="lg:hidden p-2 rounded-xl hover:bg-stone-100 transition-colors">
                <Menu size={20} className="text-stone-600" />
              </button>
            </div>

          </div>
        </header>

        <main>{children}</main>

        <footer className="bg-stone-900 text-stone-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <BeNativeLogo height={64} color="#ffffff" />
              </div>
              <p className="text-sm leading-relaxed">India's slow-travel community network. Real homes, real families, zero fees.</p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Discover</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/explore" className="hover:text-white transition-colors">Explore Stays</Link></li>
                <li><Link href="/map" className="hover:text-white transition-colors">Map View</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Be Native</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">For Hosts</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/list-your-stay" className="hover:text-white transition-colors">List Your Stay</Link></li>
                <li><Link href="/list-your-stay" className="hover:text-white transition-colors">Host Guidelines</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Contact</h4>
              <p className="text-sm">sustainic.technologies@gmail.com</p>
            </div>
          </div>

          {/* Donate strip */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white font-medium">Support the Be Native mission</p>
              <p className="text-xs text-stone-500 mt-0.5">Help us keep this platform free for hosts and travellers.</p>
            </div>
            <Link
              href="/donate"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shrink-0"
            >
              Donate
            </Link>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
            <p className="text-xs text-stone-600">© 2026 Be Native · Sustainic Technologies</p>
          </div>
        </footer>

      </body>
    </html>
  )
}

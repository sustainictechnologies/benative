import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Home, Search, Menu } from 'lucide-react'
import NavLinks from '@/components/NavLinks'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JALAD Homestays | Authentic Konkan Experiences',
  description:
    'Discover verified homestays from conscious local families across Ratnagiri, Sindhudurg, and Raigad. Direct host contact. No booking fees.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-stone-900 antialiased`}>

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-5">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
                <Home size={17} className="text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-base font-bold text-stone-900 tracking-tight">JALAD</div>
                <div className="text-[9px] text-brand-600 font-semibold tracking-widest uppercase -mt-0.5">Community Homestays</div>
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

            {/* CTA button */}
            <div className="ml-auto flex items-center gap-3 shrink-0">
              <Link
                href="/about"
                className="hidden sm:flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-colors shadow-sm whitespace-nowrap"
              >
                <Home size={14} />
                List Your Homestay
              </Link>
              <button className="lg:hidden p-2 rounded-xl hover:bg-stone-100 transition-colors">
                <Menu size={20} className="text-stone-600" />
              </button>
            </div>

          </div>
        </header>

        <main>{children}</main>

        <footer className="bg-stone-900 text-stone-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <Home size={15} className="text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">JALAD</div>
                  <div className="text-[9px] text-brand-400 font-medium tracking-widest uppercase">Community Homestays</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed">Community-driven homestays across the Konkan coast. No middlemen, no fees.</p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Discover</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/explore" className="hover:text-white transition-colors">Explore Stays</Link></li>
                <li><Link href="/map" className="hover:text-white transition-colors">Map View</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About JALAD</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">For Hosts</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">List Your Stay</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">Host Guidelines</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Contact</h4>
              <p className="text-sm">sustainic.technologies@gmail.com</p>
              <p className="text-xs mt-6 text-stone-600">© 2026 JALAD Homestays · Sustainic Technologies</p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  )
}

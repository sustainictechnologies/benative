import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import MenuDropdown from '@/components/MenuDropdown'
import NavLinks from '@/components/NavLinks'
import UserButton from '@/components/UserButton'
import BeNativeLogo from '@/components/BeNativeLogo'
import PageViewTracker from '@/components/PageViewTracker'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'BeNative | Community Travel Across India',
  description:
    'Discover verified homestays from conscious local families across India — mountains, forests, villages, coastlines, and deserts. Direct host contact. Zero fees.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className} bg-white text-stone-900 antialiased`}>

        <header className="sticky top-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-end pb-2 gap-5">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <BeNativeLogo height={36} markOnly={true} />
              <div className="leading-none">
                <p className="text-xl font-bold tracking-tight" style={{ color: '#2d4520', fontFamily: "Georgia, 'Times New Roman', serif" }}>BeNative</p>
                <p className="text-[7px] tracking-[0.18em] uppercase" style={{ color: '#2d4520' }}>Travel Beyond the Guidebook</p>
              </div>
            </Link>

            {/* Right: nav links + profile + mobile menu */}
            <div className="ml-auto flex items-center gap-4 shrink-0">
              <NavLinks />
              <UserButton />
              <div className="lg:hidden">
                <MenuDropdown />
              </div>
            </div>

          </div>
        </header>

        <PageViewTracker />
        <main>{children}</main>

        <footer className="bg-stone-900 text-stone-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Logo — full width on mobile */}
            <div className="col-span-2 lg:col-span-1">
              <div className="mb-3">
                <div className="flex items-center gap-2.5 mb-1">
                  <BeNativeLogo height={36} markOnly={true} color="#ffffff" />
                  <span className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>BeNative</span>
                </div>
                <p className="text-[8px] tracking-[0.2em] uppercase text-white/60">Travel Beyond the Guidebook</p>
              </div>
              <p className="text-xs leading-relaxed">India's slow-travel community network. Real homes, real families, zero fees.</p>
            </div>

            {/* Nav links */}
            <div>
              <ul className="space-y-2 text-sm">
                <li><Link href="/discover" className="font-semibold text-white hover:text-stone-300 transition-colors">Discover</Link></li>
                <li><Link href="/map" className="font-semibold text-white hover:text-stone-300 transition-colors">Map</Link></li>
                <li><Link href="/about" className="font-semibold text-white hover:text-stone-300 transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="font-semibold text-white hover:text-stone-300 transition-colors">Blog</Link></li>
                <li><Link href="/faq" className="font-semibold text-white hover:text-stone-300 transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="font-semibold text-white hover:text-stone-300 transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            {/* For Hosts */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">For Hosts</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/list-your-stay" className="hover:text-white transition-colors">List Your Stay</Link></li>
                <li><Link href="/list-your-stay" className="hover:text-white transition-colors">Host Guidelines</Link></li>
              </ul>
            </div>

          </div>

          {/* Donate strip */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 border-t border-stone-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-white font-medium">Support the BeNative mission</p>
              <p className="text-[10px] text-stone-500 mt-0.5 hidden sm:block">Help us keep this platform free for hosts and travellers.</p>
            </div>
            <Link
              href="/donate"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shrink-0"
            >
              Donate
            </Link>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
            <p className="text-xs text-stone-600">© 2026 BeNative · Sustainic Technologies</p>
          </div>
        </footer>

      </body>
    </html>
  )
}

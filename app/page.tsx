import HeroCarousel        from '@/components/home/HeroCarousel'
import HomeSearch          from '@/components/home/HomeSearch'
import IntroductionSection from '@/components/home/IntroductionSection'
import CategorySection     from '@/components/home/CategorySection'
import HowItWorks          from '@/components/home/HowItWorks'
import FinalCTA            from '@/components/home/FinalCTA'
import { createClient }    from '@/lib/supabase/server'
import JsonLd              from '@/components/JsonLd'
import { pageMetadata, SITE_URL, SITE_NAME } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Discover Genuine Homestays in India | BeNative',
  description:
    'Discover genuine family run homestays across India. Explore village stays, nature homes, local food and authentic experiences. Connect directly with hosts through BeNative.',
  path: '/',
})

// Who runs the site, for search engines: only facts already shown on the site
const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  slogan: 'Travel Beyond the Guidebook',
  email: 'support.benative@gmail.com',
  sameAs: ['https://www.instagram.com/benative.in'],
}

const WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'en-IN',
  publisher: { '@id': `${SITE_URL}/#organization` },
}

export const revalidate = 0

async function getImageMap(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data } = await supabase
    .from('homepage_images')
    .select('slot, image_url')
  if (!data) return {}
  return Object.fromEntries(
    data.filter(r => r.image_url).map(r => [r.slot, r.image_url as string])
  )
}

export default async function HomePage() {
  const imageMap = await getImageMap()

  return (
    <div>
      <JsonLd data={ORGANIZATION} />
      <JsonLd data={WEBSITE} />

      {/* 01 — Full-screen carousel */}
      <HeroCarousel imageMap={imageMap} />

      {/* 02 — Search: name, place or experience */}
      <HomeSearch />

      {/* 03 — Explore by Categories */}
      <CategorySection imageMap={imageMap} />

      {/* 04 — Introduction / BeNative proposition */}
      <IntroductionSection />

      {/* 05 — Final full-screen image */}
      <FinalCTA imageMap={imageMap} />

      {/* 06 — How it Works */}
      <HowItWorks />
    </div>
  )
}

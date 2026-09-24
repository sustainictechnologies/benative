import HeroCarousel        from '@/components/home/HeroCarousel'
import IntroductionSection from '@/components/home/IntroductionSection'
import CategorySection     from '@/components/home/CategorySection'
import HowItWorks          from '@/components/home/HowItWorks'
import FinalCTA            from '@/components/home/FinalCTA'
import { createClient }    from '@/lib/supabase/server'

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
      {/* 01 — Full-screen carousel */}
      <HeroCarousel imageMap={imageMap} />

      {/* 02 — Explore by Categories */}
      <CategorySection imageMap={imageMap} />

      {/* 03 — Introduction / BeNative proposition */}
      <IntroductionSection />

      {/* 04 — How it Works */}
      <HowItWorks />

      {/* 06 — Final full-screen image */}
      <FinalCTA imageMap={imageMap} />
    </div>
  )
}

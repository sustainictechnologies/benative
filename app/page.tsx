import HeroCarousel        from '@/components/home/HeroCarousel'
import IntroductionSection from '@/components/home/IntroductionSection'
import CategorySection     from '@/components/home/CategorySection'
import WhyBeNative         from '@/components/home/WhyBeNative'
import HowItWorks          from '@/components/home/HowItWorks'
import FinalCTA            from '@/components/home/FinalCTA'

export const revalidate = 3600

export default function HomePage() {
  return (
    <div>
      {/* 01 — Full-screen carousel */}
      <HeroCarousel />

      {/* 02 — Explore by Categories */}
      <CategorySection />

      {/* 03 — Introduction / BeNative proposition */}
      <IntroductionSection />

      {/* 04 — Why BeNative? */}
      <WhyBeNative />

      {/* 05 — How it Works */}
      <HowItWorks />

      {/* 06 — Final full-screen image */}
      <FinalCTA />
    </div>
  )
}

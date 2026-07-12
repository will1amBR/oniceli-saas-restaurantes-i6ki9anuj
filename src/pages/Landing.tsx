import { LandingHero } from '@/components/landing-hero'
import { LandingFeatures } from '@/components/landing-features'
import { LandingShowcase } from '@/components/landing-showcase'
import { LandingHowItWorks } from '@/components/landing-how-it-works'
import { LandingCTA } from '@/components/landing-cta'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <LandingHero />
      <LandingFeatures />
      <LandingShowcase />
      <LandingHowItWorks />
      <LandingCTA />
    </div>
  )
}

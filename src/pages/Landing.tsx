import { LandingHeader } from '@/components/landing-header'
import { LandingHero } from '@/components/landing-hero'
import { LandingFeatures } from '@/components/landing-features'
import { LandingShowcase } from '@/components/landing-showcase'
import { LandingSocialProof } from '@/components/landing-social-proof'
import { LandingHowItWorks } from '@/components/landing-how-it-works'
import { LandingCTA } from '@/components/landing-cta'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-background overflow-x-hidden">
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingShowcase />
      <LandingSocialProof />
      <LandingHowItWorks />
      <LandingCTA />
    </div>
  )
}

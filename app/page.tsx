import HeroSection from '@/components/sections/hero-section'
import ServicesSection from '@/components/sections/services-section'
import TestimonialsSection from '@/components/sections/testimonials-section'
import CTASection from '@/components/sections/cta-section'

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ServicesSection />
      <TestimonialsSection />
      <CTASection />
    </main>
  )
}

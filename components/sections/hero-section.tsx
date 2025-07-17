import React from 'react'
import { Button } from '@/components/ui/button'

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-accent text-white">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Build Your Digital
          <span className="block text-accent">Future</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
          We create stunning websites, powerful applications, and digital solutions 
          that help your business thrive in the modern world.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary">
            Get Started
          </Button>
          <Button size="lg" variant="outline">
            View Our Work
          </Button>
        </div>
      </div>
    </section>
  )
} 
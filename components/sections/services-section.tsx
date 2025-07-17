import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const services = [
  {
    title: 'Website Development',
    description: 'Custom website development using modern technologies like Next.js, React, and TypeScript.',
    price: '$2,500',
    duration: '2-4 weeks',
    features: ['Responsive Design', 'SEO Optimized', 'Fast Loading', 'Modern UI/UX'],
    icon: '🌐'
  },
  {
    title: 'E-commerce Solutions',
    description: 'Complete e-commerce platform with payment integration, inventory management, and admin dashboard.',
    price: '$5,000',
    duration: '4-8 weeks',
    features: ['Payment Integration', 'Inventory Management', 'Admin Dashboard', 'Mobile App'],
    icon: '🛒'
  },
  {
    title: 'Mobile App Development',
    description: 'Cross-platform mobile applications using React Native with native performance.',
    price: '$7,500',
    duration: '6-12 weeks',
    features: ['Cross Platform', 'Native Performance', 'Push Notifications', 'App Store Ready'],
    icon: '📱'
  },
  {
    title: 'Digital Marketing',
    description: 'Complete digital marketing strategy including SEO, social media, and content marketing.',
    price: '$1,500/mo',
    duration: 'Ongoing',
    features: ['SEO Optimization', 'Social Media', 'Content Marketing', 'Analytics'],
    icon: '📈'
  }
]

export default function ServicesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We offer comprehensive digital solutions to help your business grow and succeed in the digital world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Card key={index} variant="shadow" className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">{service.icon}</div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <Badge variant="default">{service.price}</Badge>
                  <Badge variant="outline">{service.duration}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center mb-6">
                  {service.description}
                </CardDescription>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-900">Features:</h4>
                  <ul className="space-y-1">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Need a custom solution? We'd love to discuss your project.
          </p>
          <button className="bg-primary text-white px-8 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium">
            Get Custom Quote
          </button>
        </div>
      </div>
    </section>
  )
} 
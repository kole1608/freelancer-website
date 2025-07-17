import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'CEO, TechStart Inc.',
    content: 'Working with this team was incredible. They delivered a stunning website that exceeded our expectations and helped increase our conversion rate by 300%.',
    avatar: '/testimonials/sarah.jpg',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Founder, EcoSolutions',
    content: 'The e-commerce platform they built for us is fast, secure, and user-friendly. Our online sales have grown significantly since launch.',
    avatar: '/testimonials/michael.jpg',
    rating: 5
  },
  {
    name: 'Emily Rodriguez',
    role: 'Marketing Director, Creative Agency',
    content: 'Professional, reliable, and creative. They understood our vision perfectly and brought it to life with exceptional attention to detail.',
    avatar: '/testimonials/emily.jpg',
    rating: 5
  },
  {
    name: 'David Kumar',
    role: 'CTO, FinanceFlow',
    content: 'The mobile app development was smooth and the final product is exactly what we needed. Great communication throughout the project.',
    avatar: '/testimonials/david.jpg',
    rating: 5
  }
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our satisfied clients have to say about working with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                {/* Rating Stars */}
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Testimonial Content */}
                <blockquote className="text-gray-600 mb-6 italic">
                  "{testimonial.content}"
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg font-semibold text-gray-600">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to join our satisfied clients?
          </h3>
          <p className="text-gray-600 mb-8">
            Let's discuss your project and see how we can help your business grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary text-white px-8 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium">
              Start Your Project
            </button>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium">
              View Portfolio
            </button>
          </div>
        </div>
      </div>
    </section>
  )
} 
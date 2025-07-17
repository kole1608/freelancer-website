import { PrismaClient, UserRole, PostStatus, MessageStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  })

  console.log('👤 Created admin user:', admin.email)

  // Create sample blog posts
  const blogPost1 = await prisma.blogPost.upsert({
    where: { slug: 'welcome-to-our-blog' },
    update: {},
    create: {
      title: 'Welcome to Our Blog',
      slug: 'welcome-to-our-blog',
      content: 'This is our first blog post. We share insights about web development, design, and digital marketing.',
      excerpt: 'Welcome to our blog where we share insights about web development and design.',
      published: true,
      status: PostStatus.PUBLISHED,
      authorId: admin.id,
    },
  })

  const blogPost2 = await prisma.blogPost.upsert({
    where: { slug: 'modern-web-development-trends' },
    update: {},
    create: {
      title: 'Modern Web Development Trends in 2025',
      slug: 'modern-web-development-trends',
      content: 'Exploring the latest trends in web development including AI integration, serverless architecture, and modern frameworks.',
      excerpt: 'Discover the latest trends shaping web development in 2025.',
      published: true,
      status: PostStatus.PUBLISHED,
      authorId: admin.id,
    },
  })

  console.log('📝 Created blog posts')

  // Create sample services
  const service1 = await prisma.service.upsert({
    where: { id: 'service-1' },
    update: {},
    create: {
      id: 'service-1',
      title: 'Website Development',
      description: 'Custom website development using modern technologies like Next.js, React, and TypeScript.',
      price: 2500.00,
      duration: '2-4 weeks',
      features: JSON.stringify(['Responsive Design', 'SEO Optimized', 'Fast Loading', 'Modern UI/UX']),
      active: true,
      order: 1,
      authorId: admin.id,
    },
  })

  const service2 = await prisma.service.upsert({
    where: { id: 'service-2' },
    update: {},
    create: {
      id: 'service-2',
      title: 'E-commerce Solutions',
      description: 'Complete e-commerce platform with payment integration, inventory management, and admin dashboard.',
      price: 5000.00,
      duration: '4-8 weeks',
      features: JSON.stringify(['Payment Integration', 'Inventory Management', 'Admin Dashboard', 'Mobile App']),
      active: true,
      order: 2,
      authorId: admin.id,
    },
  })

  console.log('🛠️ Created services')

  // Create sample newsletter subscribers
  await prisma.newsletter.createMany({
    data: [
      { email: 'subscriber1@example.com' },
      { email: 'subscriber2@example.com' },
    ],
    skipDuplicates: true,
  })

  console.log('📧 Created newsletter subscribers')

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 
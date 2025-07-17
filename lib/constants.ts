export const SITE_CONFIG = {
  name: 'Freelancer Website',
  description: 'Professional web development services',
  url: (typeof window === 'undefined' ? process.env.SITE_URL : window.location.origin) || 'http://localhost:3000',
  ogImage: '/og-image.jpg',
  links: {
    twitter: 'https://twitter.com/yourhandle',
    linkedin: 'https://linkedin.com/in/yourprofile',
    github: 'https://github.com/yourprofile',
  },
} as const

export const CONTACT_CONFIG = {
  email: (typeof window === 'undefined' ? process.env.CONTACT_EMAIL : null) || 'contact@yoursite.com',
  phone: '+381 60 123 4567',
  address: 'Pančevo, Vojvodina, Serbia',
} as const

export const NAVIGATION_LINKS = [
  { href: '/', label: 'Početna' },
  { href: '/about', label: 'O meni' },
  { href: '/services', label: 'Usluge' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Kontakt' },
] as const

export const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/blog-manager', label: 'Blog' },
  { href: '/admin/service-manager', label: 'Usluge' },
  { href: '/admin/inbox', label: 'Poruke' },
] as const 
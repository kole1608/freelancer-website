export interface User {
  id: string
  email: string
  name?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  published: boolean
  featuredImage?: string
  tags?: string[]
  status: PostStatus
  authorId: string
  author?: User
  createdAt: Date
  updatedAt: Date
}

export interface Service {
  id: string
  title: string
  description: string
  price?: number
  duration?: string
  features?: string[]
  active: boolean
  order: number
  authorId: string
  author?: User
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  name: string
  email: string
  subject: string
  body: string
  status: MessageStatus
  createdAt: Date
  updatedAt: Date
}

export interface Newsletter {
  id: string
  email: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum MessageStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  REPLIED = 'REPLIED',
  ARCHIVED = 'ARCHIVED'
} 
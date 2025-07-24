import { z } from 'zod'

// Email Provider Types
export type EmailProvider = 'resend' | 'nodemailer'

// Base Email Schema
export const BaseEmailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(),
  replyTo: z.string().email().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string(),
  })).optional(),
})

// Contact Form Email Schema
export const ContactEmailSchema = BaseEmailSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  phone: z.string().optional(),
})

// Welcome Email Schema
export const WelcomeEmailSchema = BaseEmailSchema.extend({
  userName: z.string().min(1, 'User name is required'),
  activationUrl: z.string().url().optional(),
})

// Password Reset Email Schema
export const PasswordResetEmailSchema = BaseEmailSchema.extend({
  userName: z.string().min(1, 'User name is required'),
  resetUrl: z.string().url('Invalid reset URL'),
  expiresAt: z.date(),
})

// Newsletter Email Schema
export const NewsletterEmailSchema = BaseEmailSchema.extend({
  unsubscribeUrl: z.string().url('Invalid unsubscribe URL'),
  preferencesUrl: z.string().url().optional(),
})

// Email Queue Job Schema
export const EmailJobSchema = z.object({
  id: z.string(),
  type: z.enum(['contact', 'welcome', 'password-reset', 'newsletter', 'notification']),
  priority: z.number().min(1).max(10).default(5),
  delay: z.number().min(0).default(0),
  attempts: z.number().min(1).max(5).default(3),
  data: z.record(z.any()),
  createdAt: z.date().default(() => new Date()),
})

// Type Exports
export type BaseEmail = z.infer<typeof BaseEmailSchema>
export type ContactEmail = z.infer<typeof ContactEmailSchema>
export type WelcomeEmail = z.infer<typeof WelcomeEmailSchema>
export type PasswordResetEmail = z.infer<typeof PasswordResetEmailSchema>
export type NewsletterEmail = z.infer<typeof NewsletterEmailSchema>
export type EmailJob = z.infer<typeof EmailJobSchema>

// Email Provider Configuration
export interface EmailProviderConfig {
  resend?: {
    apiKey: string
    fromEmail: string
    fromName: string
  }
  nodemailer?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
    fromEmail: string
    fromName: string
  }
}

// Email Service Options
export interface EmailServiceOptions {
  provider: EmailProvider
  fallbackProvider?: EmailProvider
  retryAttempts?: number
  retryDelay?: number
  rateLimit?: {
    maxEmails: number
    timeWindow: number // in milliseconds
  }
  enableQueue?: boolean
  enableTracking?: boolean
  enablePreview?: boolean
}

// Email Delivery Result
export interface EmailDeliveryResult {
  success: boolean
  messageId?: string
  provider: EmailProvider
  timestamp: Date
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    to: string
    subject: string
    retryCount: number
    processingTime: number
  }
}

// Email Analytics Event
export interface EmailAnalyticsEvent {
  messageId: string
  eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained'
  timestamp: Date
  recipient: string
  metadata?: Record<string, any>
}

// Email Template Data
export interface EmailTemplateData {
  subject: string
  html: string
  text?: string
  variables?: Record<string, string>
}

// Email Tracking Data
export interface EmailTrackingData {
  messageId: string
  recipient: string
  subject: string
  sentAt: Date
  provider: EmailProvider
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  openedAt?: Date
  clickedAt?: Date
  bouncedAt?: Date
  errorMessage?: string
} 
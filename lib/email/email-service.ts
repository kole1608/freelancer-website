import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { Redis } from 'ioredis'
import { 
  EmailProvider, 
  EmailProviderConfig, 
  EmailServiceOptions, 
  EmailDeliveryResult,
  EmailTrackingData,
  BaseEmail,
  ContactEmail,
  WelcomeEmail,
  PasswordResetEmail,
  NewsletterEmail,
  BaseEmailSchema,
  ContactEmailSchema,
  WelcomeEmailSchema,
  PasswordResetEmailSchema,
  NewsletterEmailSchema
} from './types'
import { 
  contactNotificationTemplate,
  welcomeEmailTemplate,
  passwordResetTemplate,
  newsletterTemplate,
  templateUtils
} from './templates'

// Email Service Error Classes
export class EmailServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: EmailProvider,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'EmailServiceError'
  }
}

export class EmailProviderError extends EmailServiceError {
  constructor(message: string, provider: EmailProvider, originalError?: Error) {
    super(message, 'PROVIDER_ERROR', provider, originalError)
  }
}

export class EmailValidationError extends EmailServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
  }
}

export class EmailRateLimitError extends EmailServiceError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT_ERROR')
  }
}

// EmailService Singleton Class
export class EmailService {
  private static instance: EmailService
  private resendClient?: Resend
  private nodemailerTransporter?: nodemailer.Transporter
  private redis?: Redis
  private config: EmailProviderConfig
  private options: EmailServiceOptions
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>()

  private constructor(config: EmailProviderConfig, options: EmailServiceOptions) {
    this.config = config
    this.options = {
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: { maxEmails: 10, timeWindow: 60000 }, // 10 emails per minute
      enableQueue: false,
      enableTracking: true,
      enablePreview: process.env.NODE_ENV === 'development',
      ...options
    }
    
    this.initializeProviders()
    this.initializeRedis()
  }

  // Singleton Pattern Implementation
  public static getInstance(
    config?: EmailProviderConfig, 
    options?: EmailServiceOptions
  ): EmailService {
    if (!EmailService.instance) {
      if (!config) {
        throw new EmailServiceError('EmailService not initialized. Provide config.', 'NOT_INITIALIZED')
      }
      EmailService.instance = new EmailService(config, options || {})
    }
    return EmailService.instance
  }

  // Initialize Email Providers
  private initializeProviders(): void {
    try {
      // Initialize Resend
      if (this.config.resend?.apiKey) {
        this.resendClient = new Resend(this.config.resend.apiKey)
      }

      // Initialize Nodemailer
      if (this.config.nodemailer) {
        this.nodemailerTransporter = nodemailer.createTransporter({
          host: this.config.nodemailer.host,
          port: this.config.nodemailer.port,
          secure: this.config.nodemailer.secure,
          auth: this.config.nodemailer.auth,
        })
      }

      // Validate at least one provider is available
      if (!this.resendClient && !this.nodemailerTransporter) {
        throw new EmailServiceError(
          'No email providers configured', 
          'NO_PROVIDERS'
        )
      }
    } catch (error) {
      throw new EmailServiceError(
        'Failed to initialize email providers',
        'INITIALIZATION_ERROR',
        undefined,
        error as Error
      )
    }
  }

  // Initialize Redis for caching and tracking
  private initializeRedis(): void {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL)
      }
    } catch (error) {
      console.warn('Redis initialization failed, tracking disabled:', error)
    }
  }

  // Rate Limiting Check
  private async checkRateLimit(identifier: string): Promise<void> {
    if (!this.options.rateLimit) return

    const now = Date.now()
    const key = `email_rate_${identifier}`
    
    // Use Redis if available, otherwise use in-memory cache
    if (this.redis) {
      const current = await this.redis.get(key)
      const count = current ? parseInt(current) : 0
      
      if (count >= this.options.rateLimit.maxEmails) {
        throw new EmailRateLimitError(
          `Rate limit exceeded: ${count}/${this.options.rateLimit.maxEmails} emails per ${this.options.rateLimit.timeWindow / 1000}s`
        )
      }
      
      await this.redis.setex(
        key, 
        this.options.rateLimit.timeWindow / 1000, 
        count + 1
      )
    } else {
      // Fallback to in-memory cache
      const cached = this.rateLimitCache.get(identifier)
      
      if (cached && now < cached.resetTime) {
        if (cached.count >= this.options.rateLimit.maxEmails) {
          throw new EmailRateLimitError(
            `Rate limit exceeded: ${cached.count}/${this.options.rateLimit.maxEmails} emails`
          )
        }
        cached.count++
      } else {
        this.rateLimitCache.set(identifier, {
          count: 1,
          resetTime: now + this.options.rateLimit.timeWindow
        })
      }
    }
  }

  // Email Tracking
  private async trackEmail(data: EmailTrackingData): Promise<void> {
    if (!this.options.enableTracking || !this.redis) return

    try {
      const key = `email_tracking:${data.messageId}`
      await this.redis.setex(key, 86400 * 7, JSON.stringify(data)) // 7 days
    } catch (error) {
      console.warn('Email tracking failed:', error)
    }
  }

  // Send Email with Provider
  private async sendWithProvider(
    provider: EmailProvider,
    emailData: BaseEmail
  ): Promise<EmailDeliveryResult> {
    const startTime = Date.now()
    
    try {
      let messageId: string | undefined
      
      if (provider === 'resend' && this.resendClient) {
        const response = await this.resendClient.emails.send({
          from: `${this.config.resend!.fromName} <${this.config.resend!.fromEmail}>`,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          reply_to: emailData.replyTo,
          attachments: emailData.attachments?.map(att => ({
            filename: att.filename,
            content: Buffer.from(att.content, 'base64'),
            content_type: att.contentType
          }))
        })
        messageId = response.data?.id
      } 
      else if (provider === 'nodemailer' && this.nodemailerTransporter) {
        const response = await this.nodemailerTransporter.sendMail({
          from: `"${this.config.nodemailer!.fromName}" <${this.config.nodemailer!.fromEmail}>`,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          replyTo: emailData.replyTo,
          attachments: emailData.attachments?.map(att => ({
            filename: att.filename,
            content: Buffer.from(att.content, 'base64'),
            contentType: att.contentType
          }))
        })
        messageId = response.messageId
      } else {
        throw new EmailProviderError(
          `Provider ${provider} not available`, 
          provider
        )
      }

      const result: EmailDeliveryResult = {
        success: true,
        messageId,
        provider,
        timestamp: new Date(),
        metadata: {
          to: emailData.to,
          subject: emailData.subject,
          retryCount: 0,
          processingTime: Date.now() - startTime
        }
      }

      // Track email if enabled
      if (messageId) {
        await this.trackEmail({
          messageId,
          recipient: emailData.to,
          subject: emailData.subject,
          sentAt: new Date(),
          provider,
          status: 'sent'
        })
      }

      return result
    } catch (error) {
      throw new EmailProviderError(
        `Failed to send email via ${provider}: ${(error as Error).message}`,
        provider,
        error as Error
      )
    }
  }

  // Send Email with Retry Logic
  private async sendEmailWithRetry(
    emailData: BaseEmail,
    retryCount: number = 0
  ): Promise<EmailDeliveryResult> {
    const providers: EmailProvider[] = []
    
    // Determine provider order
    if (this.options.provider === 'resend' && this.resendClient) {
      providers.push('resend')
      if (this.options.fallbackProvider === 'nodemailer' && this.nodemailerTransporter) {
        providers.push('nodemailer')
      }
    } else if (this.options.provider === 'nodemailer' && this.nodemailerTransporter) {
      providers.push('nodemailer')
      if (this.options.fallbackProvider === 'resend' && this.resendClient) {
        providers.push('resend')
      }
    }

    let lastError: Error | undefined

    // Try each provider
    for (const provider of providers) {
      try {
        return await this.sendWithProvider(provider, emailData)
      } catch (error) {
        lastError = error as Error
        console.warn(`Email send failed with ${provider}:`, error)
        
        // If it's the last provider and we still have retries, wait and retry
        if (provider === providers[providers.length - 1] && 
            retryCount < (this.options.retryAttempts || 3)) {
          await new Promise(resolve => 
            setTimeout(resolve, this.options.retryDelay || 1000)
          )
          return this.sendEmailWithRetry(emailData, retryCount + 1)
        }
      }
    }

    // If all providers failed
    throw new EmailServiceError(
      `All email providers failed after ${retryCount + 1} attempts`,
      'ALL_PROVIDERS_FAILED',
      undefined,
      lastError
    )
  }

  // Main Send Email Method
  public async sendEmail(emailData: BaseEmail): Promise<EmailDeliveryResult> {
    try {
      // Validate email data
      const validatedData = BaseEmailSchema.parse(emailData)
      
      // Check rate limits
      await this.checkRateLimit(validatedData.to)
      
      // Preview mode for development
      if (this.options.enablePreview && process.env.NODE_ENV === 'development') {
        console.log('📧 EMAIL PREVIEW MODE')
        console.log('To:', validatedData.to)
        console.log('Subject:', validatedData.subject)
        console.log('Preview URL:', templateUtils.generatePreviewUrl({
          subject: validatedData.subject,
          html: validatedData.html,
          text: validatedData.text
        }))
        
        return {
          success: true,
          messageId: `preview_${Date.now()}`,
          provider: 'resend',
          timestamp: new Date(),
          metadata: {
            to: validatedData.to,
            subject: validatedData.subject,
            retryCount: 0,
            processingTime: 0
          }
        }
      }

      // Send email
      return await this.sendEmailWithRetry(validatedData)
    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw error
      }
      throw new EmailServiceError(
        `Failed to send email: ${(error as Error).message}`,
        'SEND_ERROR',
        undefined,
        error as Error
      )
    }
  }

  // Contact Form Notification
  public async sendContactNotification(data: {
    name: string
    email: string
    subject: string
    message: string
    phone?: string
    adminEmail: string
  }): Promise<EmailDeliveryResult> {
    try {
      const validatedData = ContactEmailSchema.parse(data)
      
      const template = contactNotificationTemplate({
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
        phone: validatedData.phone,
        receivedAt: new Date().toLocaleString('sr-RS')
      })

      return await this.sendEmail({
        to: data.adminEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: validatedData.email
      })
    } catch (error) {
      throw new EmailServiceError(
        `Failed to send contact notification: ${(error as Error).message}`,
        'CONTACT_NOTIFICATION_ERROR',
        undefined,
        error as Error
      )
    }
  }

  // Welcome Email
  public async sendWelcomeEmail(data: {
    to: string
    userName: string
    activationUrl?: string
  }): Promise<EmailDeliveryResult> {
    try {
      const validatedData = WelcomeEmailSchema.parse(data)
      
      const template = welcomeEmailTemplate({
        userName: validatedData.userName,
        activationUrl: validatedData.activationUrl
      })

      return await this.sendEmail({
        to: validatedData.to,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    } catch (error) {
      throw new EmailServiceError(
        `Failed to send welcome email: ${(error as Error).message}`,
        'WELCOME_EMAIL_ERROR',
        undefined,
        error as Error
      )
    }
  }

  // Password Reset Email
  public async sendPasswordReset(data: {
    to: string
    userName: string
    resetUrl: string
    expiresAt: Date
  }): Promise<EmailDeliveryResult> {
    try {
      const validatedData = PasswordResetEmailSchema.parse(data)
      
      const template = passwordResetTemplate({
        userName: validatedData.userName,
        resetUrl: validatedData.resetUrl,
        expiresAt: validatedData.expiresAt
      })

      return await this.sendEmail({
        to: validatedData.to,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    } catch (error) {
      throw new EmailServiceError(
        `Failed to send password reset email: ${(error as Error).message}`,
        'PASSWORD_RESET_ERROR',
        undefined,
        error as Error
      )
    }
  }

  // Newsletter Email
  public async sendNewsletter(data: {
    to: string
    subject: string
    content: string
    unsubscribeUrl: string
    preferencesUrl?: string
  }): Promise<EmailDeliveryResult> {
    try {
      const validatedData = NewsletterEmailSchema.parse(data)
      
      const template = newsletterTemplate({
        subject: validatedData.subject,
        content: validatedData.content,
        unsubscribeUrl: validatedData.unsubscribeUrl,
        preferencesUrl: validatedData.preferencesUrl
      })

      return await this.sendEmail({
        to: validatedData.to,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    } catch (error) {
      throw new EmailServiceError(
        `Failed to send newsletter: ${(error as Error).message}`,
        'NEWSLETTER_ERROR',
        undefined,
        error as Error
      )
    }
  }

  // Get Email Status
  public async getEmailStatus(messageId: string): Promise<EmailTrackingData | null> {
    if (!this.redis) return null

    try {
      const data = await this.redis.get(`email_tracking:${messageId}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Failed to get email status:', error)
      return null
    }
  }

  // Health Check
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    providers: Record<EmailProvider, boolean>
    redis: boolean
  }> {
    const providers: Record<EmailProvider, boolean> = {
      resend: false,
      nodemailer: false
    }

    // Check Resend
    if (this.resendClient) {
      try {
        // Attempt to validate API key (this is a lightweight check)
        providers.resend = true
      } catch {
        providers.resend = false
      }
    }

    // Check Nodemailer
    if (this.nodemailerTransporter) {
      try {
        await this.nodemailerTransporter.verify()
        providers.nodemailer = true
      } catch {
        providers.nodemailer = false
      }
    }

    // Check Redis
    const redis = this.redis ? await this.redis.ping() === 'PONG' : false

    const healthyProviders = Object.values(providers).filter(Boolean).length
    const status = healthyProviders > 0 ? 
      (healthyProviders === Object.keys(providers).length ? 'healthy' : 'degraded') : 
      'unhealthy'

    return { status, providers, redis }
  }

  // Graceful Shutdown
  public async shutdown(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit()
      }
      if (this.nodemailerTransporter) {
        this.nodemailerTransporter.close()
      }
    } catch (error) {
      console.warn('Error during email service shutdown:', error)
    }
  }
}

// Factory function to create and configure EmailService
export function createEmailService(options: {
  resendApiKey?: string
  nodemailerConfig?: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
  }
  fromEmail: string
  fromName: string
  redis?: boolean
}): EmailService {
  const config: EmailProviderConfig = {}

  if (options.resendApiKey) {
    config.resend = {
      apiKey: options.resendApiKey,
      fromEmail: options.fromEmail,
      fromName: options.fromName
    }
  }

  if (options.nodemailerConfig) {
    config.nodemailer = {
      host: options.nodemailerConfig.host,
      port: options.nodemailerConfig.port,
      secure: options.nodemailerConfig.secure,
      auth: {
        user: options.nodemailerConfig.user,
        pass: options.nodemailerConfig.pass
      },
      fromEmail: options.fromEmail,
      fromName: options.fromName
    }
  }

  const serviceOptions: EmailServiceOptions = {
    provider: config.resend ? 'resend' : 'nodemailer',
    fallbackProvider: config.resend && config.nodemailer ? 'nodemailer' : undefined,
    enableTracking: options.redis,
    enablePreview: process.env.NODE_ENV === 'development'
  }

  return EmailService.getInstance(config, serviceOptions)
} 
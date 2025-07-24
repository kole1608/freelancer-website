import { EmailService, EmailServiceError } from '@/lib/email/email-service'
import { ContactEmailSchema, WelcomeEmailSchema } from '@/lib/email/types'

// Mock dependencies
jest.mock('resend')
jest.mock('nodemailer')
jest.mock('ioredis')

describe('EmailService', () => {
  let emailService: EmailService

  beforeEach(() => {
    // Reset singleton instance
    ;(EmailService as any).instance = null
    
    // Mock configuration
    const mockConfig = {
      resend: {
        apiKey: 'test_key',
        fromEmail: 'test@example.com',
        fromName: 'Test Service'
      }
    }

    const mockOptions = {
      provider: 'resend' as const,
      enablePreview: true,
      enableTracking: false
    }

    emailService = EmailService.getInstance(mockConfig, mockOptions)
  })

  describe('Validation', () => {
    it('should validate contact email data', () => {
      const validData = {
        to: 'admin@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message'
      }

      expect(() => ContactEmailSchema.parse(validData)).not.toThrow()
    })

    it('should reject invalid email addresses', () => {
      const invalidData = {
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
        name: 'John',
        email: 'john@example.com',
        message: 'Test message'
      }

      expect(() => ContactEmailSchema.parse(invalidData)).toThrow()
    })

    it('should reject short messages', () => {
      const invalidData = {
        to: 'admin@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        name: 'John',
        email: 'john@example.com',
        message: 'Short' // Less than 10 characters
      }

      expect(() => ContactEmailSchema.parse(invalidData)).toThrow()
    })
  })

  describe('Welcome Email', () => {
    it('should validate welcome email data', () => {
      const validData = {
        to: 'user@example.com',
        subject: 'Welcome!',
        html: '<p>Welcome</p>',
        userName: 'John Doe'
      }

      expect(() => WelcomeEmailSchema.parse(validData)).not.toThrow()
    })

    it('should reject empty username', () => {
      const invalidData = {
        to: 'user@example.com',
        subject: 'Welcome!',
        html: '<p>Welcome</p>',
        userName: ''
      }

      expect(() => WelcomeEmailSchema.parse(invalidData)).toThrow()
    })
  })

  describe('Email Service Errors', () => {
    it('should create EmailServiceError with code', () => {
      const error = new EmailServiceError('Test error', 'TEST_CODE')
      
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.name).toBe('EmailServiceError')
    })

    it('should include provider in error', () => {
      const error = new EmailServiceError('Test error', 'TEST_CODE', 'resend')
      
      expect(error.provider).toBe('resend')
    })
  })

  describe('Health Check', () => {
    it('should return health status', async () => {
      const health = await emailService.healthCheck()
      
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('providers')
      expect(health).toHaveProperty('redis')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
    })
  })

  describe('Preview Mode', () => {
    it('should return preview result in development', async () => {
      // Set environment to development
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>'
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toMatch(/^preview_/)

      // Restore environment
      process.env.NODE_ENV = originalEnv
    })
  })
})

// Template Tests
describe('Email Templates', () => {
  describe('Contact Notification Template', () => {
    it('should generate valid contact notification HTML', async () => {
      const { contactNotificationTemplate } = await import('@/lib/email/templates')
      
      const template = contactNotificationTemplate({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message content',
        receivedAt: '2025-01-17 18:00:00'
      })

      expect(template.subject).toContain('Nova poruka: Test Subject')
      expect(template.html).toContain('John Doe')
      expect(template.html).toContain('john@example.com')
      expect(template.html).toContain('Test message content')
      expect(template.text).toContain('John Doe')
    })

    it('should include phone number when provided', async () => {
      const { contactNotificationTemplate } = await import('@/lib/email/templates')
      
      const template = contactNotificationTemplate({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        phone: '+381 64 123 4567',
        receivedAt: '2025-01-17 18:00:00'
      })

      expect(template.html).toContain('+381 64 123 4567')
    })
  })

  describe('Welcome Email Template', () => {
    it('should generate valid welcome email HTML', async () => {
      const { welcomeEmailTemplate } = await import('@/lib/email/templates')
      
      const template = welcomeEmailTemplate({
        userName: 'Ana Marić'
      })

      expect(template.subject).toContain('Dobrodošli na Freelancer Website, Ana Marić!')
      expect(template.html).toContain('Ana Marić')
      expect(template.html).toContain('Dobrodošli')
      expect(template.text).toContain('Ana Marić')
    })

    it('should include activation URL when provided', async () => {
      const { welcomeEmailTemplate } = await import('@/lib/email/templates')
      
      const template = welcomeEmailTemplate({
        userName: 'Ana Marić',
        activationUrl: 'https://example.com/activate?token=123'
      })

      expect(template.html).toContain('https://example.com/activate?token=123')
      expect(template.html).toContain('Aktiviraj nalog')
    })
  })

  describe('Password Reset Template', () => {
    it('should generate valid password reset email', async () => {
      const { passwordResetTemplate } = await import('@/lib/email/templates')
      
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      
      const template = passwordResetTemplate({
        userName: 'Stefan Jovanović',
        resetUrl: 'https://example.com/reset?token=456',
        expiresAt
      })

      expect(template.subject).toContain('Resetovanje lozinke')
      expect(template.html).toContain('Stefan Jovanović')
      expect(template.html).toContain('https://example.com/reset?token=456')
      expect(template.html).toContain('30 minuta') // Should show expiration time
    })
  })
})

// Configuration Tests
describe('Email Configuration', () => {
  describe('Environment Validation', () => {
    it('should validate email configuration', async () => {
      const { validateEmailServiceConfig } = await import('@/lib/email/config')
      
      // Mock environment variables
      const originalEnv = process.env
      process.env = {
        ...originalEnv,
        EMAIL_FROM: 'test@example.com',
        EMAIL_FROM_NAME: 'Test Service',
        ADMIN_EMAIL: 'admin@example.com',
        RESEND_API_KEY: 're_test_key'
      }

      const validation = validateEmailServiceConfig()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)

      // Restore environment
      process.env = originalEnv
    })

    it('should detect missing required fields', async () => {
      const { validateEmailServiceConfig } = await import('@/lib/email/config')
      
      // Mock environment with missing fields
      const originalEnv = process.env
      process.env = {
        ...originalEnv,
        EMAIL_FROM: undefined,
        EMAIL_FROM_NAME: undefined,
        ADMIN_EMAIL: undefined
      }

      const validation = validateEmailServiceConfig()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)

      // Restore environment
      process.env = originalEnv
    })
  })

  describe('Template Utilities', () => {
    it('should replace variables in templates', async () => {
      const { templateUtils } = await import('@/lib/email/templates')
      
      const template = 'Hello {{name}}, your order {{orderId}} is ready!'
      const variables = {
        name: 'John Doe',
        orderId: '12345'
      }

      const result = templateUtils.replaceVariables(template, variables)
      
      expect(result).toBe('Hello John Doe, your order 12345 is ready!')
    })

    it('should generate preview URLs', async () => {
      const { templateUtils } = await import('@/lib/email/templates')
      
      const templateData = {
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content'
      }

      const previewUrl = templateUtils.generatePreviewUrl(templateData)
      
      expect(previewUrl).toContain('/api/email/preview')
      expect(previewUrl).toContain('html=')
    })
  })
}) 
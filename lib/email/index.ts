import { EmailService, createEmailService } from './email-service'
import { EmailQueue, createEmailQueue } from './email-queue'
import { createEmailServiceConfig, getEmailConfig, validateEmailServiceConfig } from './config'

// Initialize email service instance
let emailServiceInstance: EmailService | null = null
let emailQueueInstance: EmailQueue | null = null

// Factory function to get or create email service
export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    const config = createEmailServiceConfig()
    
    // Validate configuration
    const validation = validateEmailServiceConfig()
    if (!validation.isValid) {
      throw new Error(`Email service configuration invalid:\n${validation.errors.join('\n')}`)
    }
    
    // Log warnings
    if (validation.warnings.length > 0) {
      console.warn('Email service configuration warnings:', validation.warnings)
    }
    
    // Create email service
    emailServiceInstance = createEmailService({
      resendApiKey: config.resendApiKey,
      nodemailerConfig: config.nodemailerConfig,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      redis: config.redis
    })
    
    console.log('✅ Email service initialized successfully')
  }
  
  return emailServiceInstance
}

// Factory function to get or create email queue
export function getEmailQueue(): EmailQueue | null {
  const config = createEmailServiceConfig()
  
  if (!config.features.queueEnabled) {
    return null
  }
  
  if (!emailQueueInstance) {
    const emailService = getEmailService()
    emailQueueInstance = createEmailQueue(emailService)
    console.log('✅ Email queue initialized successfully')
  }
  
  return emailQueueInstance
}

// Convenience functions for common email operations
export async function sendContactNotification(data: {
  name: string
  email: string
  subject: string
  message: string
  phone?: string
}) {
  const config = createEmailServiceConfig()
  const emailService = getEmailService()
  const emailQueue = getEmailQueue()
  
  const emailData = {
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    phone: data.phone,
    adminEmail: config.adminEmail
  }
  
  // Use queue if enabled, otherwise send directly
  if (emailQueue) {
    return await emailQueue.addContactEmail(emailData)
  } else {
    return await emailService.sendContactNotification(emailData)
  }
}

export async function sendWelcomeEmail(data: {
  to: string
  userName: string
  activationUrl?: string
}) {
  const emailService = getEmailService()
  const emailQueue = getEmailQueue()
  
  // Use queue if enabled, otherwise send directly
  if (emailQueue) {
    return await emailQueue.addWelcomeEmail(data)
  } else {
    return await emailService.sendWelcomeEmail(data)
  }
}

export async function sendPasswordResetEmail(data: {
  to: string
  userName: string
  resetUrl: string
  expiresAt: Date
}) {
  const emailService = getEmailService()
  const emailQueue = getEmailQueue()
  
  // Use queue if enabled, otherwise send directly
  if (emailQueue) {
    return await emailQueue.addPasswordResetEmail(data)
  } else {
    return await emailService.sendPasswordReset(data)
  }
}

export async function sendNewsletterEmail(data: {
  to: string
  subject: string
  content: string
  unsubscribeUrl: string
  preferencesUrl?: string
}) {
  const emailService = getEmailService()
  const emailQueue = getEmailQueue()
  
  // Use queue if enabled, otherwise send directly
  if (emailQueue) {
    return await emailQueue.addNewsletterEmail(data)
  } else {
    return await emailService.sendNewsletter(data)
  }
}

// Bulk newsletter sending
export async function sendBulkNewsletterEmails(
  emails: Array<{
    to: string
    subject: string
    content: string
    unsubscribeUrl: string
    preferencesUrl?: string
  }>,
  options?: {
    batchSize?: number
    delay?: number
    staggerDelay?: number
  }
) {
  const emailQueue = getEmailQueue()
  
  if (!emailQueue) {
    throw new Error('Email queue must be enabled for bulk email sending')
  }
  
  return await emailQueue.addBulkNewsletterEmails(emails, options)
}

// Health check for the entire email system
export async function emailHealthCheck() {
  const config = createEmailServiceConfig()
  const emailService = getEmailService()
  const emailQueue = getEmailQueue()
  
  const serviceHealth = await emailService.healthCheck()
  const queueHealth = emailQueue ? await emailQueue.healthCheck() : null
  
  return {
    service: serviceHealth,
    queue: queueHealth,
    config: {
      provider: config.resendApiKey ? 'resend' : 'nodemailer',
      queueEnabled: config.features.queueEnabled,
      trackingEnabled: config.features.trackingEnabled,
      previewEnabled: config.features.previewEnabled,
    }
  }
}

// Graceful shutdown
export async function shutdownEmailSystem() {
  console.log('🛑 Shutting down email system...')
  
  try {
    if (emailQueueInstance) {
      await emailQueueInstance.shutdown()
      emailQueueInstance = null
    }
    
    if (emailServiceInstance) {
      await emailServiceInstance.shutdown()
      emailServiceInstance = null
    }
    
    console.log('✅ Email system shutdown complete')
  } catch (error) {
    console.error('❌ Error during email system shutdown:', error)
    throw error
  }
}

// Re-export types and utilities
export * from './types'
export * from './templates'
export * from './email-service'
export * from './email-queue'
export * from './config'

// Default export for backward compatibility
export default {
  getEmailService,
  getEmailQueue,
  sendContactNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNewsletterEmail,
  sendBulkNewsletterEmails,
  emailHealthCheck,
  shutdownEmailSystem
} 
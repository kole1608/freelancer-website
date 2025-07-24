// DEPRECATED: Use lib/email/index.ts instead
// This file is kept for backward compatibility

import { sendContactNotification as newSendContactNotification } from './email'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * @deprecated Use the new email service from lib/email/index.ts
 * This function is kept for backward compatibility
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  console.warn('DEPRECATED: sendEmail from lib/mailer.ts is deprecated. Use lib/email/index.ts instead.')
  
  try {
    // Import the new email service
    const { getEmailService } = await import('./email')
    const emailService = getEmailService()
    
    return await emailService.sendEmail({
      to,
      subject,
      html,
      text
    })
  } catch (error) {
    console.error('Failed to send email via new service:', error)
    
    // Fallback to old behavior for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`
        📧 EMAIL FALLBACK (Development)
        To: ${to}
        Subject: ${subject}
        HTML: ${html.substring(0, 200)}...
      `)
      return { success: true, messageId: `fallback_${Date.now()}` }
    }
    
    throw error
  }
} 
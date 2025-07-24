import { NextRequest, NextResponse } from 'next/server'
import { 
  contactNotificationTemplate,
  welcomeEmailTemplate,
  passwordResetTemplate,
  newsletterTemplate
} from '@/lib/email/templates'

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Email preview is not available in production' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'contact'
  const html = searchParams.get('html')

  try {
    let templateData

    // If HTML is provided directly, use it
    if (html) {
      const decodedHtml = decodeURIComponent(html)
      return new NextResponse(decodedHtml, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Generate preview based on type
    switch (type) {
      case 'contact':
        templateData = contactNotificationTemplate({
          name: 'Marko Petrović',
          email: 'marko@example.com',
          subject: 'Pitanje o web razvoju',
          message: 'Pozdrav,\n\nZainteresovan sam za vaše usluge web razvoja. Da li možete da mi pošaljete više informacija o vašim paketima i cenama?\n\nHvala vam!',
          phone: '+381 64 123 4567',
          receivedAt: new Date().toLocaleString('sr-RS')
        })
        break

      case 'welcome':
        templateData = welcomeEmailTemplate({
          userName: 'Ana Milić',
          activationUrl: 'https://freelancer-website.vercel.app/activate?token=sample123'
        })
        break

      case 'password-reset':
        templateData = passwordResetTemplate({
          userName: 'Stefan Jovanović',
          resetUrl: 'https://freelancer-website.vercel.app/reset-password?token=reset456',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
        })
        break

      case 'newsletter':
        templateData = newsletterTemplate({
          subject: 'Mesečni newsletter - Januar 2025',
          content: `
            <h3>Dobrodošli u naš januar newsletter!</h3>
            <p>U ovom broju:</p>
            <ul>
              <li><strong>Novi projekti:</strong> Predstavljamo 3 nova web sajta koja smo završili</li>
              <li><strong>Tehnologije:</strong> Zašto smo prešli na Next.js 14</li>
              <li><strong>Saveti:</strong> 5 načina da poboljšate SEO vašeg sajta</li>
              <li><strong>Ponuda:</strong> 20% popust na sve usluge tokom februara</li>
            </ul>
            
            <h4>Featured Project: E-commerce za malu kompaniju</h4>
            <p>Ovaj mesec smo završili izuzetno zanimljiv projekat - kompletnu e-commerce platformu za lokalnu kompaniju koja prodaje domaće proizvode.</p>
            
            <h4>Tehnički tip meseca</h4>
            <p>Koristite <code>loading="lazy"</code> atribut na slikama da ubrzate učitavanje stranice!</p>
          `,
          unsubscribeUrl: 'https://freelancer-website.vercel.app/unsubscribe?token=unsub789',
          preferencesUrl: 'https://freelancer-website.vercel.app/email-preferences?token=pref321'
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid email type. Use: contact, welcome, password-reset, newsletter' },
          { status: 400 }
        )
    }

    return new NextResponse(templateData.html, {
      headers: { 
        'Content-Type': 'text/html',
        'X-Email-Type': type,
        'X-Email-Subject': templateData.subject
      }
    })

  } catch (error) {
    console.error('Error generating email preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate email preview' },
      { status: 500 }
    )
  }
}

// POST method to test email sending in development
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Email testing is not available in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { type, recipient, ...data } = body

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient email is required for testing' },
        { status: 400 }
      )
    }

    // Import email service
    const { getEmailService } = await import('@/lib/email')
    const emailService = getEmailService()

    let result

    switch (type) {
      case 'contact':
        result = await emailService.sendContactNotification({
          name: data.name || 'Test User',
          email: data.email || recipient,
          subject: data.subject || 'Test Contact Message',
          message: data.message || 'This is a test message from the email preview system.',
          phone: data.phone,
          adminEmail: recipient
        })
        break

      case 'welcome':
        result = await emailService.sendWelcomeEmail({
          to: recipient,
          userName: data.userName || 'Test User',
          activationUrl: data.activationUrl
        })
        break

      case 'password-reset':
        result = await emailService.sendPasswordReset({
          to: recipient,
          userName: data.userName || 'Test User',
          resetUrl: data.resetUrl || 'https://example.com/reset',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000)
        })
        break

      case 'newsletter':
        result = await emailService.sendNewsletter({
          to: recipient,
          subject: data.subject || 'Test Newsletter',
          content: data.content || '<p>Test newsletter content</p>',
          unsubscribeUrl: data.unsubscribeUrl || 'https://example.com/unsubscribe',
          preferencesUrl: data.preferencesUrl
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Test ${type} email sent successfully`,
      result: {
        messageId: result.messageId,
        provider: result.provider,
        timestamp: result.timestamp
      }
    })

  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send test email',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
} 
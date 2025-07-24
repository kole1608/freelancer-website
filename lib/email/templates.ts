import { EmailTemplateData } from './types'

// Base Email Template (responsive with inline CSS)
const baseTemplate = (content: string, title: string = 'Freelancer Website') => `
<!DOCTYPE html>
<html lang="sr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  </style>
</head>
<body style="
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #374151;
  background-color: #f9fafb;
">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="
      background: linear-gradient(135deg, #0175C2, #13B9FD);
      padding: 32px 24px;
      text-align: center;
    ">
      <h1 style="
        margin: 0;
        color: #ffffff;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.025em;
      ">Freelancer Website</h1>
      <p style="
        margin: 8px 0 0 0;
        color: rgba(255, 255, 255, 0.9);
        font-size: 16px;
        font-weight: 400;
      ">Digitalna rešenja za vaš uspeh</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 24px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="
      background-color: #f3f4f6;
      padding: 32px 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    ">
      <p style="
        margin: 0 0 16px 0;
        color: #6b7280;
        font-size: 14px;
      ">
        © ${new Date().getFullYear()} Freelancer Website. Sva prava zadržana.
      </p>
      <div style="margin: 16px 0;">
        <a href="mailto:hello@freelancer.com" style="
          color: #0175C2;
          text-decoration: none;
          font-size: 14px;
          margin: 0 12px;
        ">Email</a>
        <a href="tel:+381123456789" style="
          color: #0175C2;
          text-decoration: none;
          font-size: 14px;
          margin: 0 12px;
        ">Telefon</a>
        <a href="https://freelancer-website.vercel.app" style="
          color: #0175C2;
          text-decoration: none;
          font-size: 14px;
          margin: 0 12px;
        ">Website</a>
      </div>
      <p style="
        margin: 16px 0 0 0;
        color: #9ca3af;
        font-size: 12px;
        line-height: 1.5;
      ">
        Ako ne želite da primajte ovakve poruke, možete se 
        <a href="{{unsubscribeUrl}}" style="color: #0175C2; text-decoration: none;">odjaviti ovde</a>.
      </p>
    </div>
  </div>
</body>
</html>
`

// Button Component
const button = (text: string, url: string, isPrimary: boolean = true) => `
  <div style="text-align: center; margin: 32px 0;">
    <a href="${url}" style="
      display: inline-block;
      padding: 14px 28px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s ease;
      ${isPrimary 
        ? 'background-color: #0175C2; color: #ffffff; border: 2px solid #0175C2;'
        : 'background-color: transparent; color: #0175C2; border: 2px solid #0175C2;'
      }
    ">${text}</a>
  </div>
`

// Alert Box Component
const alertBox = (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
  const colors = {
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
    success: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
    error: { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' }
  }
  
  return `
    <div style="
      background-color: ${colors[type].bg};
      border: 1px solid ${colors[type].border};
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    ">
      <p style="
        margin: 0;
        color: ${colors[type].text};
        font-size: 14px;
        font-weight: 500;
      ">${message}</p>
    </div>
  `
}

// Contact Form Notification Template
export const contactNotificationTemplate = (data: {
  name: string
  email: string
  subject: string
  message: string
  phone?: string
  receivedAt: string
}): EmailTemplateData => {
  const content = `
    <h2 style="
      margin: 0 0 24px 0;
      color: #111827;
      font-size: 24px;
      font-weight: 600;
    ">Nova poruka sa kontakt forme</h2>
    
    ${alertBox('Primili ste novu poruku preko kontakt forme na vašem sajtu.', 'info')}
    
    <div style="
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    ">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="
            padding: 8px 0;
            font-weight: 600;
            color: #374151;
            width: 120px;
            vertical-align: top;
          ">Ime:</td>
          <td style="
            padding: 8px 0;
            color: #111827;
          ">${data.name}</td>
        </tr>
        <tr>
          <td style="
            padding: 8px 0;
            font-weight: 600;
            color: #374151;
            vertical-align: top;
          ">Email:</td>
          <td style="
            padding: 8px 0;
            color: #111827;
          "><a href="mailto:${data.email}" style="color: #0175C2; text-decoration: none;">${data.email}</a></td>
        </tr>
        ${data.phone ? `
        <tr>
          <td style="
            padding: 8px 0;
            font-weight: 600;
            color: #374151;
            vertical-align: top;
          ">Telefon:</td>
          <td style="
            padding: 8px 0;
            color: #111827;
          "><a href="tel:${data.phone}" style="color: #0175C2; text-decoration: none;">${data.phone}</a></td>
        </tr>
        ` : ''}
        <tr>
          <td style="
            padding: 8px 0;
            font-weight: 600;
            color: #374151;
            vertical-align: top;
          ">Naslov:</td>
          <td style="
            padding: 8px 0;
            color: #111827;
          ">${data.subject}</td>
        </tr>
        <tr>
          <td style="
            padding: 8px 0;
            font-weight: 600;
            color: #374151;
            vertical-align: top;
          ">Primljeno:</td>
          <td style="
            padding: 8px 0;
            color: #111827;
          ">${data.receivedAt}</td>
        </tr>
      </table>
    </div>
    
    <h3 style="
      margin: 32px 0 16px 0;
      color: #111827;
      font-size: 18px;
      font-weight: 600;
    ">Poruka:</h3>
    
    <div style="
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
      white-space: pre-wrap;
      font-size: 16px;
      line-height: 1.6;
    ">${data.message}</div>
    
    ${button('Odgovori direktno', `mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}`)}
    
    <p style="
      margin: 32px 0 0 0;
      color: #6b7280;
      font-size: 14px;
      text-align: center;
    ">
      Ova poruka je automatski generisana sa vašeg sajta.
    </p>
  `
  
  return {
    subject: `Nova poruka: ${data.subject}`,
    html: baseTemplate(content, 'Nova kontakt poruka'),
    text: `Nova poruka sa kontakt forme\n\nIme: ${data.name}\nEmail: ${data.email}\nNaslov: ${data.subject}\n\nPoruka:\n${data.message}`
  }
}

// Welcome Email Template
export const welcomeEmailTemplate = (data: {
  userName: string
  activationUrl?: string
}): EmailTemplateData => {
  const content = `
    <h2 style="
      margin: 0 0 24px 0;
      color: #111827;
      font-size: 28px;
      font-weight: 700;
      text-align: center;
    ">Dobrodošli, ${data.userName}! 🎉</h2>
    
    <p style="
      margin: 0 0 24px 0;
      font-size: 18px;
      text-align: center;
      color: #374151;
    ">
      Hvala vam što ste se pridružili našoj zajednici!
    </p>
    
    ${alertBox('Vaš nalog je uspešno kreiran. Možete početi da koristite sve naše usluge.', 'success')}
    
    <div style="
      background-color: #f9fafb;
      border-radius: 12px;
      padding: 32px 24px;
      margin: 32px 0;
      text-align: center;
    ">
      <h3 style="
        margin: 0 0 16px 0;
        color: #111827;
        font-size: 20px;
        font-weight: 600;
      ">Šta možete da radite:</h3>
      
      <ul style="
        text-align: left;
        color: #374151;
        font-size: 16px;
        line-height: 1.8;
        max-width: 400px;
        margin: 0 auto;
      ">
        <li>Pratite naše najnovije blog postove</li>
        <li>Kontaktirajte nas za projekte</li>
        <li>Prijavite se za newsletter</li>
        <li>Pregledajte naš portfolio</li>
      </ul>
    </div>
    
    ${data.activationUrl ? button('Aktiviraj nalog', data.activationUrl) : ''}
    ${button('Posetite sajt', 'https://freelancer-website.vercel.app', false)}
    
    <p style="
      margin: 32px 0 0 0;
      color: #6b7280;
      font-size: 16px;
      text-align: center;
      line-height: 1.6;
    ">
      Ako imate bilo kakva pitanja, slobodno nas kontaktirajte na 
      <a href="mailto:hello@freelancer.com" style="color: #0175C2; text-decoration: none;">hello@freelancer.com</a>
    </p>
  `
  
  return {
    subject: `Dobrodošli na Freelancer Website, ${data.userName}!`,
    html: baseTemplate(content, 'Dobrodošli'),
    text: `Dobrodošli, ${data.userName}!\n\nHvala vam što ste se pridružili našoj zajednici. Vaš nalog je uspešno kreiran.\n\nPosetite sajt: https://freelancer-website.vercel.app`
  }
}

// Password Reset Email Template
export const passwordResetTemplate = (data: {
  userName: string
  resetUrl: string
  expiresAt: Date
}): EmailTemplateData => {
  const expiresIn = Math.round((data.expiresAt.getTime() - Date.now()) / (1000 * 60))
  
  const content = `
    <h2 style="
      margin: 0 0 24px 0;
      color: #111827;
      font-size: 24px;
      font-weight: 600;
      text-align: center;
    ">Resetovanje lozinke</h2>
    
    <p style="
      margin: 0 0 24px 0;
      font-size: 16px;
      color: #374151;
    ">
      Pozdrav ${data.userName},
    </p>
    
    <p style="
      margin: 0 0 24px 0;
      font-size: 16px;
      color: #374151;
    ">
      Primili smo zahtev za resetovanje lozinke za vaš nalog. Ako niste vi poslali ovaj zahtev, možete ignorisati ovaj email.
    </p>
    
    ${alertBox(`Link za resetovanje ističe za ${expiresIn} minuta.`, 'warning')}
    
    ${button('Resetuj lozinku', data.resetUrl)}
    
    <div style="
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 32px 0;
    ">
      <h4 style="
        margin: 0 0 12px 0;
        color: #111827;
        font-size: 16px;
        font-weight: 600;
      ">Bezbednosni saveti:</h4>
      <ul style="
        margin: 0;
        color: #374151;
        font-size: 14px;
        line-height: 1.6;
      ">
        <li>Nikad ne delite vašu lozinku sa drugima</li>
        <li>Koristite jedinstvenu lozinku za svaki sajt</li>
        <li>Kombinujte slova, brojeve i simbole</li>
      </ul>
    </div>
    
    <p style="
      margin: 32px 0 0 0;
      color: #6b7280;
      font-size: 14px;
      text-align: center;
    ">
      Ako ne možete da kliknete na dugme, kopirajte i nalepite sledeći link u pretraživač:<br>
      <a href="${data.resetUrl}" style="color: #0175C2; text-decoration: none; word-break: break-all;">${data.resetUrl}</a>
    </p>
  `
  
  return {
    subject: 'Resetovanje lozinke - Freelancer Website',
    html: baseTemplate(content, 'Resetovanje lozinke'),
    text: `Pozdrav ${data.userName},\n\nPrimili smo zahtev za resetovanje lozinke.\n\nKliknite na link da resetujete lozinku:\n${data.resetUrl}\n\nLink ističe za ${expiresIn} minuta.\n\nAko niste vi poslali ovaj zahtev, ignorišite ovaj email.`
  }
}

// Newsletter Email Template
export const newsletterTemplate = (data: {
  subject: string
  content: string
  unsubscribeUrl: string
  preferencesUrl?: string
}): EmailTemplateData => {
  const newsletterContent = `
    <div style="
      text-align: center;
      margin: 0 0 32px 0;
    ">
      <h2 style="
        margin: 0 0 8px 0;
        color: #111827;
        font-size: 28px;
        font-weight: 700;
      ">${data.subject}</h2>
      <p style="
        margin: 0;
        color: #6b7280;
        font-size: 16px;
      ">Newsletter | ${new Date().toLocaleDateString('sr-RS')}</p>
    </div>
    
    <div style="
      font-size: 16px;
      line-height: 1.7;
      color: #374151;
    ">
      ${data.content}
    </div>
    
    <div style="
      border-top: 1px solid #e5e7eb;
      margin: 40px 0 32px 0;
      padding-top: 32px;
      text-align: center;
    ">
      <h3 style="
        margin: 0 0 16px 0;
        color: #111827;
        font-size: 20px;
        font-weight: 600;
      ">Pratite nas</h3>
      
      <div style="margin: 16px 0;">
        <a href="https://freelancer-website.vercel.app/blog" style="
          display: inline-block;
          color: #0175C2;
          text-decoration: none;
          font-weight: 500;
          margin: 0 12px;
        ">Blog</a>
        <a href="https://freelancer-website.vercel.app/portfolio" style="
          display: inline-block;
          color: #0175C2;
          text-decoration: none;
          font-weight: 500;
          margin: 0 12px;
        ">Portfolio</a>
        <a href="https://freelancer-website.vercel.app/services" style="
          display: inline-block;
          color: #0175C2;
          text-decoration: none;
          font-weight: 500;
          margin: 0 12px;
        ">Usluge</a>
      </div>
    </div>
    
    <div style="
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 32px 0;
      text-align: center;
    ">
      <p style="
        margin: 0 0 12px 0;
        color: #6b7280;
        font-size: 14px;
      ">
        Upravljajte vašim email preferencama:
      </p>
      <div>
        ${data.preferencesUrl ? `
        <a href="${data.preferencesUrl}" style="
          color: #0175C2;
          text-decoration: none;
          font-size: 14px;
          margin: 0 8px;
        ">Podešavanja</a> |
        ` : ''}
        <a href="${data.unsubscribeUrl}" style="
          color: #6b7280;
          text-decoration: none;
          font-size: 14px;
          margin: 0 8px;
        ">Odjavi se</a>
      </div>
    </div>
  `
  
  return {
    subject: data.subject,
    html: baseTemplate(newsletterContent, data.subject),
    text: `${data.subject}\n\n${data.content.replace(/<[^>]*>/g, '')}\n\nOdjavi se: ${data.unsubscribeUrl}`
  }
}

// Email Template Cache
const templateCache = new Map<string, EmailTemplateData>()

// Template Utilities
export const templateUtils = {
  // Cache template
  cacheTemplate: (key: string, template: EmailTemplateData) => {
    templateCache.set(key, template)
  },
  
  // Get cached template
  getCachedTemplate: (key: string): EmailTemplateData | undefined => {
    return templateCache.get(key)
  },
  
  // Clear cache
  clearCache: () => {
    templateCache.clear()
  },
  
  // Replace variables in template
  replaceVariables: (template: string, variables: Record<string, string>): string => {
    let result = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, value)
    })
    return result
  },
  
  // Generate preview URL
  generatePreviewUrl: (templateData: EmailTemplateData): string => {
    const encodedHtml = encodeURIComponent(templateData.html)
    return `/api/email/preview?html=${encodedHtml}`
  }
} 
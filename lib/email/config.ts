import { z } from 'zod'

// Environment Schema for Email Configuration
const EmailConfigSchema = z.object({
  // Resend Configuration
  RESEND_API_KEY: z.string().optional(),
  
  // Nodemailer Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  SMTP_SECURE: z.string().transform(val => val === 'true').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // From Address Configuration
  EMAIL_FROM: z.string().email('Invalid email format for EMAIL_FROM'),
  EMAIL_FROM_NAME: z.string().min(1, 'EMAIL_FROM_NAME is required'),
  
  // Admin Configuration
  ADMIN_EMAIL: z.string().email('Invalid email format for ADMIN_EMAIL'),
  
  // Redis Configuration
  REDIS_URL: z.string().url().optional(),
  
  // Feature Flags
  EMAIL_ENABLED: z.string().transform(val => val !== 'false').default('true'),
  EMAIL_QUEUE_ENABLED: z.string().transform(val => val === 'true').default('false'),
  EMAIL_TRACKING_ENABLED: z.string().transform(val => val === 'true').default('true'),
  EMAIL_PREVIEW_ENABLED: z.string().transform(val => val === 'true').default('true'),
  
  // Rate Limiting
  EMAIL_RATE_LIMIT_MAX: z.string().transform(val => val ? parseInt(val) : 10).default('10'),
  EMAIL_RATE_LIMIT_WINDOW: z.string().transform(val => val ? parseInt(val) : 60000).default('60000'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

type EmailConfig = z.infer<typeof EmailConfigSchema>

// Validate and parse environment variables
function validateEmailConfig(): EmailConfig {
  try {
    return EmailConfigSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`Email configuration validation failed:\n${missingFields}`)
    }
    throw error
  }
}

// Get email configuration
let emailConfig: EmailConfig | null = null

export function getEmailConfig(): EmailConfig {
  if (!emailConfig) {
    emailConfig = validateEmailConfig()
  }
  return emailConfig
}

// Validate configuration on module load in production
if (process.env.NODE_ENV === 'production') {
  try {
    getEmailConfig()
    console.log('✅ Email configuration validated successfully')
  } catch (error) {
    console.error('❌ Email configuration validation failed:', error)
    process.exit(1)
  }
}

// Email service configuration factory
export function createEmailServiceConfig() {
  const config = getEmailConfig()
  
  return {
    resendApiKey: config.RESEND_API_KEY,
    nodemailerConfig: config.SMTP_HOST ? {
      host: config.SMTP_HOST,
      port: config.SMTP_PORT || 587,
      secure: config.SMTP_SECURE || false,
      user: config.SMTP_USER!,
      pass: config.SMTP_PASS!,
    } : undefined,
    fromEmail: config.EMAIL_FROM,
    fromName: config.EMAIL_FROM_NAME,
    adminEmail: config.ADMIN_EMAIL,
    redis: !!config.REDIS_URL,
    features: {
      enabled: config.EMAIL_ENABLED,
      queueEnabled: config.EMAIL_QUEUE_ENABLED,
      trackingEnabled: config.EMAIL_TRACKING_ENABLED,
      previewEnabled: config.EMAIL_PREVIEW_ENABLED,
    },
    rateLimit: {
      maxEmails: config.EMAIL_RATE_LIMIT_MAX,
      timeWindow: config.EMAIL_RATE_LIMIT_WINDOW,
    },
    environment: config.NODE_ENV,
  }
}

// Configuration validation helper
export function validateEmailServiceConfig(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const config = getEmailConfig()
    
    // Check if at least one email provider is configured
    if (!config.RESEND_API_KEY && !config.SMTP_HOST) {
      errors.push('No email provider configured. Set either RESEND_API_KEY or SMTP_* variables.')
    }
    
    // Validate Resend configuration
    if (config.RESEND_API_KEY) {
      if (!config.RESEND_API_KEY.startsWith('re_')) {
        warnings.push('RESEND_API_KEY should start with "re_"')
      }
    }
    
    // Validate SMTP configuration
    if (config.SMTP_HOST) {
      if (!config.SMTP_USER || !config.SMTP_PASS) {
        errors.push('SMTP_HOST is set but SMTP_USER or SMTP_PASS is missing')
      }
      
      const port = config.SMTP_PORT || 587
      if (port !== 25 && port !== 465 && port !== 587 && port !== 2525) {
        warnings.push(`Unusual SMTP port ${port}. Common ports are 25, 465, 587, 2525`)
      }
    }
    
    // Validate Redis for queue functionality
    if (config.EMAIL_QUEUE_ENABLED && !config.REDIS_URL) {
      errors.push('EMAIL_QUEUE_ENABLED is true but REDIS_URL is not set')
    }
    
    // Environment-specific checks
    if (config.NODE_ENV === 'production') {
      if (!config.RESEND_API_KEY && config.SMTP_HOST?.includes('localhost')) {
        warnings.push('Using localhost SMTP in production environment')
      }
      
      if (config.EMAIL_PREVIEW_ENABLED) {
        warnings.push('EMAIL_PREVIEW_ENABLED should be false in production')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [`Configuration validation failed: ${(error as Error).message}`],
      warnings: []
    }
  }
}

// Environment variable examples for documentation
export const EMAIL_ENV_EXAMPLES = {
  // Resend Configuration
  RESEND_API_KEY: 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  
  // Nodemailer SMTP Configuration (Gmail example)
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  SMTP_SECURE: 'false',
  SMTP_USER: 'your-email@gmail.com',
  SMTP_PASS: 'your-app-password',
  
  // SendGrid SMTP Configuration
  SMTP_HOST_SENDGRID: 'smtp.sendgrid.net',
  SMTP_PORT_SENDGRID: '587',
  SMTP_SECURE_SENDGRID: 'false',
  SMTP_USER_SENDGRID: 'apikey',
  SMTP_PASS_SENDGRID: 'your-sendgrid-api-key',
  
  // From Address Configuration
  EMAIL_FROM: 'noreply@yourwebsite.com',
  EMAIL_FROM_NAME: 'Freelancer Website',
  
  // Admin Configuration
  ADMIN_EMAIL: 'admin@yourwebsite.com',
  
  // Redis Configuration
  REDIS_URL: 'redis://localhost:6379',
  
  // Feature Flags
  EMAIL_ENABLED: 'true',
  EMAIL_QUEUE_ENABLED: 'true',
  EMAIL_TRACKING_ENABLED: 'true',
  EMAIL_PREVIEW_ENABLED: 'false', // Set to false in production
  
  // Rate Limiting
  EMAIL_RATE_LIMIT_MAX: '10',     // 10 emails per window
  EMAIL_RATE_LIMIT_WINDOW: '60000', // 60 seconds
}

// Generate .env template
export function generateEnvTemplate(): string {
  return `
# Email Configuration
# Choose one email provider: Resend (recommended) or SMTP

# Resend Configuration (recommended)
RESEND_API_KEY=${EMAIL_ENV_EXAMPLES.RESEND_API_KEY}

# OR SMTP Configuration (alternative)
# SMTP_HOST=${EMAIL_ENV_EXAMPLES.SMTP_HOST}
# SMTP_PORT=${EMAIL_ENV_EXAMPLES.SMTP_PORT}
# SMTP_SECURE=${EMAIL_ENV_EXAMPLES.SMTP_SECURE}
# SMTP_USER=${EMAIL_ENV_EXAMPLES.SMTP_USER}
# SMTP_PASS=${EMAIL_ENV_EXAMPLES.SMTP_PASS}

# From Address Configuration (required)
EMAIL_FROM=${EMAIL_ENV_EXAMPLES.EMAIL_FROM}
EMAIL_FROM_NAME="${EMAIL_ENV_EXAMPLES.EMAIL_FROM_NAME}"

# Admin Configuration (required)
ADMIN_EMAIL=${EMAIL_ENV_EXAMPLES.ADMIN_EMAIL}

# Redis Configuration (optional, required for queue)
REDIS_URL=${EMAIL_ENV_EXAMPLES.REDIS_URL}

# Feature Flags (optional)
EMAIL_ENABLED=${EMAIL_ENV_EXAMPLES.EMAIL_ENABLED}
EMAIL_QUEUE_ENABLED=${EMAIL_ENV_EXAMPLES.EMAIL_QUEUE_ENABLED}
EMAIL_TRACKING_ENABLED=${EMAIL_ENV_EXAMPLES.EMAIL_TRACKING_ENABLED}
EMAIL_PREVIEW_ENABLED=${EMAIL_ENV_EXAMPLES.EMAIL_PREVIEW_ENABLED}

# Rate Limiting (optional)
EMAIL_RATE_LIMIT_MAX=${EMAIL_ENV_EXAMPLES.EMAIL_RATE_LIMIT_MAX}
EMAIL_RATE_LIMIT_WINDOW=${EMAIL_ENV_EXAMPLES.EMAIL_RATE_LIMIT_WINDOW}
`.trim()
}

export default getEmailConfig 
import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import { Redis } from 'ioredis'
import { z } from 'zod'
import { EmailService, EmailServiceError } from './email-service'
import { EmailJob, EmailJobSchema } from './types'

// Email Job Data Schema
const EmailJobDataSchema = z.object({
  type: z.enum(['contact', 'welcome', 'password-reset', 'newsletter', 'notification']),
  priority: z.number().min(1).max(10).default(5),
  delay: z.number().min(0).default(0),
  data: z.record(z.any()),
  retryAttempts: z.number().min(1).max(5).default(3),
  retryDelay: z.number().min(1000).default(5000)
})

type EmailJobData = z.infer<typeof EmailJobDataSchema>

// Email Queue Error Class
export class EmailQueueError extends Error {
  constructor(
    message: string,
    public code: string,
    public jobId?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'EmailQueueError'
  }
}

// Email Queue Class
export class EmailQueue {
  private static instance: EmailQueue
  private queue: Queue
  private worker: Worker
  private queueEvents: QueueEvents
  private redis: Redis
  private emailService: EmailService
  private isShuttingDown = false

  private constructor(emailService: EmailService, redisUrl: string) {
    this.emailService = emailService
    this.redis = new Redis(redisUrl)
    
    // Initialize Queue
    this.queue = new Queue('email-queue', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    })

    // Initialize Worker
    this.worker = new Worker(
      'email-queue',
      this.processEmailJob.bind(this),
      {
        connection: this.redis,
        concurrency: 5, // Process up to 5 emails concurrently
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    )

    // Initialize Queue Events
    this.queueEvents = new QueueEvents('email-queue', {
      connection: this.redis,
    })

    this.setupEventHandlers()
  }

  // Singleton Pattern
  public static getInstance(
    emailService: EmailService,
    redisUrl?: string
  ): EmailQueue {
    if (!EmailQueue.instance) {
      const url = redisUrl || process.env.REDIS_URL
      if (!url) {
        throw new EmailQueueError(
          'Redis URL required for email queue',
          'REDIS_URL_REQUIRED'
        )
      }
      EmailQueue.instance = new EmailQueue(emailService, url)
    }
    return EmailQueue.instance
  }

  // Setup Event Handlers
  private setupEventHandlers(): void {
    // Worker Events
    this.worker.on('completed', (job: Job) => {
      console.log(`✅ Email job ${job.id} completed successfully`)
    })

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`❌ Email job ${job?.id} failed:`, err.message)
      
      // Log to monitoring service (Sentry, etc.)
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to Sentry
        console.error('Email job failed in production:', {
          jobId: job?.id,
          error: err.message,
          data: job?.data
        })
      }
    })

    this.worker.on('progress', (job: Job, progress: number) => {
      console.log(`📧 Email job ${job.id} progress: ${progress}%`)
    })

    this.worker.on('stalled', (jobId: string) => {
      console.warn(`⚠️ Email job ${jobId} stalled`)
    })

    // Queue Events
    this.queueEvents.on('waiting', ({ jobId }) => {
      console.log(`⏳ Email job ${jobId} waiting`)
    })

    this.queueEvents.on('active', ({ jobId }) => {
      console.log(`🔄 Email job ${jobId} active`)
    })

    // Error Handling
    this.worker.on('error', (err: Error) => {
      console.error('Email worker error:', err)
    })

    this.queueEvents.on('error', (err: Error) => {
      console.error('Email queue events error:', err)
    })
  }

  // Process Email Job
  private async processEmailJob(job: Job<EmailJobData>): Promise<void> {
    if (this.isShuttingDown) {
      throw new EmailQueueError('Queue is shutting down', 'SHUTTING_DOWN', job.id)
    }

    try {
      const { type, data } = job.data
      
      // Update progress
      await job.updateProgress(10)

      let result
      
      switch (type) {
        case 'contact':
          result = await this.emailService.sendContactNotification({
            name: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message,
            phone: data.phone,
            adminEmail: data.adminEmail
          })
          break

        case 'welcome':
          result = await this.emailService.sendWelcomeEmail({
            to: data.to,
            userName: data.userName,
            activationUrl: data.activationUrl
          })
          break

        case 'password-reset':
          result = await this.emailService.sendPasswordReset({
            to: data.to,
            userName: data.userName,
            resetUrl: data.resetUrl,
            expiresAt: new Date(data.expiresAt)
          })
          break

        case 'newsletter':
          result = await this.emailService.sendNewsletter({
            to: data.to,
            subject: data.subject,
            content: data.content,
            unsubscribeUrl: data.unsubscribeUrl,
            preferencesUrl: data.preferencesUrl
          })
          break

        case 'notification':
          result = await this.emailService.sendEmail({
            to: data.to,
            subject: data.subject,
            html: data.html,
            text: data.text,
            replyTo: data.replyTo
          })
          break

        default:
          throw new EmailQueueError(
            `Unknown email job type: ${type}`,
            'UNKNOWN_JOB_TYPE',
            job.id
          )
      }

      // Update progress
      await job.updateProgress(50)

      // Validate result
      if (!result || !result.success) {
        throw new EmailQueueError(
          'Email sending failed',
          'EMAIL_SEND_FAILED',
          job.id
        )
      }

      // Final progress update
      await job.updateProgress(100)

      // Store result in job data for later reference
      job.returnvalue = {
        success: true,
        messageId: result.messageId,
        provider: result.provider,
        timestamp: result.timestamp
      }

    } catch (error) {
      if (error instanceof EmailServiceError) {
        throw new EmailQueueError(
          `Email service error: ${error.message}`,
          error.code,
          job.id,
          error
        )
      }
      
      throw new EmailQueueError(
        `Failed to process email job: ${(error as Error).message}`,
        'PROCESSING_FAILED',
        job.id,
        error as Error
      )
    }
  }

  // Add Email to Queue
  public async addEmailJob(
    jobData: Omit<EmailJobData, 'retryAttempts' | 'retryDelay'> & {
      retryAttempts?: number
      retryDelay?: number
    }
  ): Promise<Job<EmailJobData>> {
    try {
      // Validate job data
      const validatedData = EmailJobDataSchema.parse(jobData)

      // Generate job ID
      const jobId = `email_${validatedData.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Add job to queue
      const job = await this.queue.add(
        validatedData.type,
        validatedData,
        {
          jobId,
          priority: validatedData.priority,
          delay: validatedData.delay,
          attempts: validatedData.retryAttempts,
          backoff: {
            type: 'exponential',
            delay: validatedData.retryDelay,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      )

      console.log(`📬 Email job ${job.id} added to queue (type: ${validatedData.type})`)
      return job
    } catch (error) {
      throw new EmailQueueError(
        `Failed to add email job to queue: ${(error as Error).message}`,
        'ADD_JOB_FAILED',
        undefined,
        error as Error
      )
    }
  }

  // Convenience Methods for Different Email Types
  public async addContactEmail(data: {
    name: string
    email: string
    subject: string
    message: string
    phone?: string
    adminEmail: string
    priority?: number
    delay?: number
  }): Promise<Job<EmailJobData>> {
    return this.addEmailJob({
      type: 'contact',
      priority: data.priority || 8, // High priority for contact forms
      delay: data.delay || 0,
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        phone: data.phone,
        adminEmail: data.adminEmail
      }
    })
  }

  public async addWelcomeEmail(data: {
    to: string
    userName: string
    activationUrl?: string
    priority?: number
    delay?: number
  }): Promise<Job<EmailJobData>> {
    return this.addEmailJob({
      type: 'welcome',
      priority: data.priority || 6,
      delay: data.delay || 0,
      data: {
        to: data.to,
        userName: data.userName,
        activationUrl: data.activationUrl
      }
    })
  }

  public async addPasswordResetEmail(data: {
    to: string
    userName: string
    resetUrl: string
    expiresAt: Date
    priority?: number
    delay?: number
  }): Promise<Job<EmailJobData>> {
    return this.addEmailJob({
      type: 'password-reset',
      priority: data.priority || 9, // Very high priority for security
      delay: data.delay || 0,
      data: {
        to: data.to,
        userName: data.userName,
        resetUrl: data.resetUrl,
        expiresAt: data.expiresAt.toISOString()
      }
    })
  }

  public async addNewsletterEmail(data: {
    to: string
    subject: string
    content: string
    unsubscribeUrl: string
    preferencesUrl?: string
    priority?: number
    delay?: number
  }): Promise<Job<EmailJobData>> {
    return this.addEmailJob({
      type: 'newsletter',
      priority: data.priority || 3, // Lower priority for newsletters
      delay: data.delay || 0,
      data: {
        to: data.to,
        subject: data.subject,
        content: data.content,
        unsubscribeUrl: data.unsubscribeUrl,
        preferencesUrl: data.preferencesUrl
      }
    })
  }

  // Bulk Email Operations
  public async addBulkNewsletterEmails(
    emails: Array<{
      to: string
      subject: string
      content: string
      unsubscribeUrl: string
      preferencesUrl?: string
    }>,
    options: {
      priority?: number
      batchSize?: number
      delay?: number
      staggerDelay?: number // Delay between batches
    } = {}
  ): Promise<Job<EmailJobData>[]> {
    const {
      priority = 3,
      batchSize = 50,
      delay = 0,
      staggerDelay = 1000
    } = options

    const jobs: Job<EmailJobData>[] = []
    
    // Process in batches to avoid overwhelming the queue
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const batchDelay = delay + (Math.floor(i / batchSize) * staggerDelay)
      
      const batchJobs = await Promise.all(
        batch.map((email, index) => 
          this.addNewsletterEmail({
            ...email,
            priority,
            delay: batchDelay + (index * 100) // Small stagger within batch
          })
        )
      )
      
      jobs.push(...batchJobs)
    }

    console.log(`📬 Added ${jobs.length} newsletter emails to queue in ${Math.ceil(emails.length / batchSize)} batches`)
    return jobs
  }

  // Queue Management
  public async getJobById(jobId: string): Promise<Job | undefined> {
    return this.queue.getJob(jobId)
  }

  public async getQueueStats(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    paused: number
  }> {
    return this.queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused')
  }

  public async getFailedJobs(start = 0, end = 10): Promise<Job[]> {
    return this.queue.getFailed(start, end)
  }

  public async getCompletedJobs(start = 0, end = 10): Promise<Job[]> {
    return this.queue.getCompleted(start, end)
  }

  public async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId)
    if (!job) {
      throw new EmailQueueError(`Job ${jobId} not found`, 'JOB_NOT_FOUND', jobId)
    }
    
    if (job.failedReason) {
      await job.retry()
      console.log(`🔄 Retrying failed email job ${jobId}`)
    } else {
      throw new EmailQueueError(`Job ${jobId} is not in failed state`, 'JOB_NOT_FAILED', jobId)
    }
  }

  public async pauseQueue(): Promise<void> {
    await this.queue.pause()
    console.log('⏸️ Email queue paused')
  }

  public async resumeQueue(): Promise<void> {
    await this.queue.resume()
    console.log('▶️ Email queue resumed')
  }

  public async clearQueue(): Promise<void> {
    await this.queue.drain()
    console.log('🗑️ Email queue cleared')
  }

  // Health Check
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    queueStats: any
    redisConnected: boolean
    workerRunning: boolean
  }> {
    try {
      const stats = await this.getQueueStats()
      const redisConnected = this.redis.status === 'ready'
      const workerRunning = !this.worker.closing
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      
      if (!redisConnected || !workerRunning) {
        status = 'unhealthy'
      } else if (stats.failed > 10 || stats.waiting > 100) {
        status = 'degraded'
      }

      return {
        status,
        queueStats: stats,
        redisConnected,
        workerRunning
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        queueStats: null,
        redisConnected: false,
        workerRunning: false
      }
    }
  }

  // Graceful Shutdown
  public async shutdown(): Promise<void> {
    this.isShuttingDown = true
    
    try {
      console.log('🛑 Shutting down email queue...')
      
      // Wait for active jobs to complete (with timeout)
      await this.worker.close()
      await this.queueEvents.close()
      await this.queue.close()
      await this.redis.quit()
      
      console.log('✅ Email queue shutdown complete')
    } catch (error) {
      console.error('❌ Error during email queue shutdown:', error)
      throw error
    }
  }
}

// Factory function to create EmailQueue
export function createEmailQueue(
  emailService: EmailService,
  redisUrl?: string
): EmailQueue {
  return EmailQueue.getInstance(emailService, redisUrl)
} 
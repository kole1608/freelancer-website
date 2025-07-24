import { NextRequest, NextResponse } from 'next/server'
import { emailHealthCheck } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const health = await emailHealthCheck()
    
    const overallStatus = health.service.status === 'healthy' && 
                         (!health.queue || health.queue.status === 'healthy') ? 
                         'healthy' : 
                         (health.service.status === 'unhealthy' || 
                          (health.queue && health.queue.status === 'unhealthy')) ? 
                          'unhealthy' : 'degraded'

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 206 : 503

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      email: health,
      checks: {
        emailService: {
          status: health.service.status,
          providers: health.service.providers,
          redis: health.service.redis
        },
        emailQueue: health.queue ? {
          status: health.queue.status,
          stats: health.queue.queueStats,
          redis: health.queue.redisConnected,
          worker: health.queue.workerRunning
        } : null,
        configuration: health.config
      }
    }, { status: statusCode })

  } catch (error) {
    console.error('Email health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Email health check failed',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 503 })
  }
} 
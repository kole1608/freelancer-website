import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendContactNotification } from '@/lib/email'

// Contact Form Schema
const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = ContactSchema.parse(body)
    
    // Save message to database
    const message = await prisma.message.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        body: validatedData.message,
        phone: validatedData.phone,
      },
    })
    
    // Send email notification to admin
    try {
      await sendContactNotification({
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
        phone: validatedData.phone,
      })
      
      console.log(`✅ Contact form submitted by ${validatedData.email} and email sent successfully`)
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('❌ Failed to send contact notification email:', emailError)
      
      // In production, you might want to queue this for retry
      // or alert admins through another channel
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Vaša poruka je uspešno poslata. Kontaktiraćemo vas uskoro!',
        id: message.id 
      },
      { status: 201 }
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Neispravni podaci u formi', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    console.error('❌ Error in contact form submission:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Došlo je do greške prilikom slanja poruke. Molimo pokušajte ponovo.' 
      },
      { status: 500 }
    )
  }
}

// GET method to retrieve contact messages (admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin
    // const user = await getCurrentUser()
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unread') === 'true'
    
    const skip = (page - 1) * limit
    
    const where = unreadOnly ? { read: false } : {}
    
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    })
    
  } catch (error) {
    console.error('❌ Error fetching contact messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
} 
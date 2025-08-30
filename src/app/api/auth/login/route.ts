import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { loginRateLimiter, logSecurityEvent, detectSuspiciousActivity, sanitizeInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Sanitize and validate input
    const sanitizedEmail = sanitizeInput(body.email || '')
    const sanitizedPassword = sanitizeInput(body.password || '')
    
    // Check for suspicious activity
    if (detectSuspiciousActivity(sanitizedEmail) || detectSuspiciousActivity(sanitizedPassword)) {
      logSecurityEvent('SUSPICIOUS_LOGIN_ATTEMPT', {
        email: sanitizedEmail,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }, request)
      
      return NextResponse.json(
        { message: 'Invalid input detected' },
        { status: 400 }
      )
    }
    
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!loginRateLimiter.isAllowed(clientIP)) {
      const remainingTime = Math.ceil((loginRateLimiter.getResetTime(clientIP) - Date.now()) / 1000 / 60)
      
      logSecurityEvent('LOGIN_RATE_LIMITED', {
        email: sanitizedEmail,
        ip: clientIP,
        remainingTime: `${remainingTime} minutes`
      }, request)
      
      return NextResponse.json(
        { 
          message: 'Too many login attempts. Please try again later.',
          retryAfter: remainingTime
        },
        { status: 429 }
      )
    }
    
    // Validate input
    const validation = loginSchema.safeParse({
      email: sanitizedEmail,
      password: sanitizedPassword
    })
    if (!validation.success) {
      logSecurityEvent('LOGIN_VALIDATION_FAILED', {
        email: sanitizedEmail,
        ip: clientIP,
        errors: validation.error.issues
      }, request)
      
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.issues },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Authenticate user
    console.log('🔐 Attempting authentication for:', email)
    const user = await authenticateUser(email, password)
    if (!user) {
      console.log('❌ Authentication failed for:', email)
      
      logSecurityEvent('LOGIN_FAILED', {
        email: email,
        ip: clientIP,
        reason: 'Invalid credentials'
      }, request)
      
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }
    console.log('✅ Authentication successful for:', email)
    
    logSecurityEvent('LOGIN_SUCCESS', {
      email: email,
      ip: clientIP,
      userId: user.id,
      role: user.role
    }, request)

    // Generate JWT token
    console.log('🎫 Generating JWT token for user:', user.id)
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })
    console.log('✅ JWT token generated successfully')

    // Set HTTP-only cookie
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      },
      { status: 200 }
    )

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours (reduced from 7 days for security)
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

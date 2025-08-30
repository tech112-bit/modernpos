import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/auth'

// Helper function to get user from token
async function getAdminUser(request: NextRequest) {
  try {
    // Try to get token from authorization header first (set by middleware)
    let token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    // Fallback to cookies if header not available
    if (!token) {
      token = request.cookies.get('token')?.value
    }
    
    if (!token) {
      console.log('❌ getAdminUser: No token found in headers or cookies')
      return { error: 'No token provided', status: 401 }
    }

    // Verify token and check if user is admin
    const decoded = await verifyToken(token)
    
    if (!decoded || decoded.role !== 'ADMIN') {
      console.log('❌ getAdminUser: Admin access required, user role:', decoded?.role)
      return { error: 'Admin access required', status: 403 }
    }

    console.log('✅ getAdminUser: Authentication successful for admin user:', decoded.userId)
    return { user: decoded }
  } catch (error) {
    console.error('❌ getAdminUser: Token verification error:', error)
    return { error: 'Invalid token', status: 401 }
  }
}

// GET /api/users - List all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAdminUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const users = await prisma.users.findMany({
             select: {
         id: true,
         email: true,
         role: true,
         status: true,
         created_at: true,
         updated_at: true,
         last_login_at: true
       },
       orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/users: Starting user creation process')
    
    const authResult = await getAdminUser(request)
    if ('error' in authResult) {
      console.log('❌ POST /api/users: Authentication failed:', authResult.error)
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    console.log('✅ POST /api/users: Authentication successful, proceeding with user creation')
    
    const body = await request.json()
    console.log('🔍 POST /api/users: Request body:', { ...body, password: '[HIDDEN]' })
    
    const { email, password, role = 'USER', status = 'ACTIVE' } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'USER', 'MANAGER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, USER, or MANAGER' },
        { status: 400 }
      )
    }

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate a unique ID for the user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create user
    const user = await prisma.users.create({
      data: {
        id: userId,
        email,
        password: hashedPassword,
        role,
        status,
        created_at: new Date(),
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        created_at: true
      }
    })

    return NextResponse.json({ 
      message: 'User created successfully',
      user 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

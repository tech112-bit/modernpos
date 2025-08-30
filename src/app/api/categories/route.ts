import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating categories
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required')
})

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    // Get user info from token
    const authToken = request.cookies.get('token')?.value
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Import and verify token
    const { verifyToken } = await import('@/lib/auth')
    const decoded = await verifyToken(authToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const isAdmin = decoded.role === 'ADMIN'
    const userId = decoded.userId

    // Build where clause
    const where: { user_id?: string } = {}

    // For non-admin users, filter by user_id
    if (!isAdmin) {
      where.user_id = userId
    }

    const categories = await prisma.categories.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    // Get user info from token first
    const authToken = request.cookies.get('token')?.value
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Import and verify token
    const { verifyToken } = await import('@/lib/auth')
    const decoded = await verifyToken(authToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    const body = await request.json()
    
    // Validate input
    const validatedData = createCategorySchema.parse(body)
    
    // Check if category already exists for this user
    const existingCategory = await prisma.categories.findFirst({
      where: { 
        name: validatedData.name,
        user_id: userId
      }
    })
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      )
    }

    // Generate a unique ID for the category
    const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create category
    const category = await prisma.categories.create({
      data: {
        id: categoryId,
        name: validatedData.name,
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}

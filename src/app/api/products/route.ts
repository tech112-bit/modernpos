import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { validateCsrfToken } from '@/hooks/useCsrfToken'
import { ProductionErrorHandler } from '@/lib/error-handler'

// Validation schema for creating products
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  category_id: z.string().min(1, 'Category is required')
})

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

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
    const where: {
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        sku?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
      }>
      categories?: { name: string }
      user_id?: string
    } = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (category && category !== 'all') {
      where.categories = { name: category }
    }

    // For non-admin users, filter by user_id
    if (!isAdmin) {
      where.user_id = userId
    }

    // Get products with category information
    const products = await prisma.products.findMany({
      where,
      include: {
        categories: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.products.count({ where })

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
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
    
    // CSRF Protection
    const csrfToken = body.csrfToken
    if (!csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token is required' },
        { status: 403 }
      )
    }
    
    // For now, we'll just check if the token exists and has the right format
    // In a real implementation, you'd validate against a stored session token
    if (typeof csrfToken !== 'string' || csrfToken.length !== 64) {
      return NextResponse.json(
        { error: 'Invalid CSRF token format' },
        { status: 403 }
      )
    }
    
    // Validate input
    const validatedData = createProductSchema.parse(body)
    
    // Check if SKU already exists for this user
    const existingProduct = await prisma.products.findFirst({
      where: { 
        sku: validatedData.sku,
        user_id: userId
      }
    })
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      )
    }

    // Check if category exists and belongs to this user
    const category = await prisma.categories.findFirst({
      where: { 
        id: validatedData.category_id,
        user_id: userId
      }
    })
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      )
    }

    // Generate a unique ID for the product
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create product
    const product = await prisma.products.create({
      data: {
        id: productId,
        name: validatedData.name,
        description: validatedData.description || '',
        sku: validatedData.sku,
        barcode: validatedData.barcode || '',
        price: validatedData.price,
        cost: validatedData.cost,
        stock: validatedData.stock,
        category_id: validatedData.category_id,
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    const { message, status } = ProductionErrorHandler.handle(error, 'POST /api/products')
    return NextResponse.json({ error: message }, { status })
  }
}

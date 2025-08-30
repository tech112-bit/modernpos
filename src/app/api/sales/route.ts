import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { validateCsrfToken } from '@/hooks/useCsrfToken'

// Validation schema for creating sales
const createSaleSchema = z.object({
  customer_id: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    price: z.number().positive('Price must be positive')
  })).min(1, 'At least one item is required'),
  payment_type: z.enum(['CASH', 'CARD', 'MOBILE_PAY']).default('CASH'),
  discount: z.number().min(0).default(0)
})

// GET /api/sales - List all sales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
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

    // Build where clause for filtering
    const where: { user_id?: string } = {}
    
    // For non-admin users, filter by user_id
    if (!isAdmin) {
      where.user_id = userId
    }

    // Get sales with related information
    const sales = await prisma.sales.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            email: true
          }
        },
        customers: {
          select: {
            id: true,
            name: true
          }
        },
        sale_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.sales.count({ where })

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

// POST /api/sales - Create new sale
export async function POST(request: NextRequest) {
  try {
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
    const validatedData = createSaleSchema.parse(body)
    
    // Get the first available user (for now, since we don't have auth context)
    const user = await prisma.users.findFirst()
    if (!user) {
      return NextResponse.json(
        { error: 'No users found in database' },
        { status: 500 }
      )
    }
    
    // Calculate total
    const total = validatedData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - validatedData.discount
    
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
            // Create the sale
      const sale = await tx.sales.create({
        data: {
          id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          total,
          payment_type: validatedData.payment_type,
          discount: validatedData.discount,
          customer_id: validatedData.customer_id || null,
          user_id: user.id, // Use the found user ID
          created_at: new Date(),
          updated_at: new Date(),
          sale_items: {
            create: validatedData.items.map(item => ({
              id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              user_id: user.id,
              created_at: new Date()
            }))
          }
        },
        include: {
          sale_items: {
            include: {
              products: true
            }
          },
          customers: true
        }
      })

      // Update product stock
      for (const item of validatedData.items) {
                 await tx.products.update({
          where: { id: item.product_id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      return sale
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating sale:', error)
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    )
  }
}

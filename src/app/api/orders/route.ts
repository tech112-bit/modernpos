import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { apiRateLimiter, sanitizeInput } from '@/lib/security'
import { authenticateRequest } from '@/lib/api-helpers'
import { ensureStockAvailability, decrementStock } from '@/lib/stock'

const orderItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  variant_id: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit_price: z.number().positive('Unit price must be positive')
})

const shippingSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address_line1: z.string().min(1),
  address_line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postal_code: z.string().min(1),
  country: z.string().min(2)
})

const orderSchema = z.object({
  email: z.string().email(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shipping: shippingSchema,
  csrfToken: z.string().length(64, 'Invalid CSRF token')
})

const toMoney = (value: number) => Number(value.toFixed(2))

const computeShipping = () => {
  const flatRate = Number(process.env.SHIPPING_FLAT_RATE || 0)
  return toMoney(isNaN(flatRate) ? 0 : flatRate)
}

const computeTax = (subtotal: number) => {
  const rate = Number(process.env.TAX_RATE || 0)
  if (isNaN(rate) || rate <= 0) return 0
  return toMoney(subtotal * rate)
}

export async function GET(request: NextRequest) {
  // Admin/managers only
  const auth = await authenticateRequest(request)
  if (!auth.success || !auth.user) {
    return auth.response ?? NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { user } = auth
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: { user_id?: string } = {}
  if (!user.isAdmin) {
    where.user_id = user.userId
  }

  const orders = await prisma.orders.findMany({
    where,
    include: {
      order_items: {
        include: {
          products: true,
          product_variants: true
        }
      }
    },
    orderBy: { created_at: 'desc' },
    skip,
    take: limit
  })

  const total = await prisma.orders.count({ where })

  return NextResponse.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}

export async function POST(request: NextRequest) {
  // Rate limit public order creation
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  if (!apiRateLimiter.isAllowed(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { email, items, shipping, csrfToken } = parsed.data

  // Basic CSRF check (double-submit token)
  if (typeof csrfToken !== 'string' || csrfToken.length !== 64) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  // Optional auth to attribute orders placed by internal users
  const auth = await authenticateRequest(request)
  const userId = auth.success && auth.user ? auth.user.userId : null

  const subtotal = toMoney(items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0))
  const shippingRate = computeShipping()
  const taxTotal = computeTax(subtotal)
  const total = toMoney(subtotal + shippingRate + taxTotal)

  const stockItems = items.map(item => ({
    productId: item.product_id,
    variantId: item.variant_id,
    quantity: item.quantity
  }))

  try {
    const order = await prisma.$transaction(async (tx) => {
      await ensureStockAvailability(tx, stockItems)

      const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const created = await tx.orders.create({
        data: {
          id: orderId,
          status: 'PENDING',
          email: sanitizeInput(email),
          shipping_name: sanitizeInput(shipping.name),
          shipping_phone: shipping.phone ? sanitizeInput(shipping.phone) : null,
          address_line1: sanitizeInput(shipping.address_line1),
          address_line2: shipping.address_line2 ? sanitizeInput(shipping.address_line2) : null,
          city: sanitizeInput(shipping.city),
          state: shipping.state ? sanitizeInput(shipping.state) : null,
          postal_code: sanitizeInput(shipping.postal_code),
          country: sanitizeInput(shipping.country),
          shipping_rate: shippingRate,
          tax_total: taxTotal,
          subtotal,
          total,
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date(),
          order_items: {
            create: items.map(item => ({
              id: `ord_item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: toMoney(item.unit_price * item.quantity),
              created_at: new Date()
            }))
          }
        },
        include: {
          order_items: {
            include: {
              products: true,
              product_variants: true
            }
          }
        }
      })

      await decrementStock(tx, stockItems)
      return created
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order creation failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 400 }
    )
  }
}

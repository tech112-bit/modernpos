import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/sales/[id] - Get single sale
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sale = await prisma.sales.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        customers: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        sale_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true
              }
            }
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
      { status: 500 }
    )
  }
}

// DELETE /api/sales/[id] - Delete sale
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if sale exists
    const sale = await prisma.sales.findUnique({
      where: { id },
      include: {
        sale_items: {
          include: {
            products: true
          }
        }
      }
    })
    
    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    // Start a transaction to restore product stock and delete the sale
    await prisma.$transaction(async (tx) => {
      // Restore product stock
      for (const item of sale.sale_items) {
        await tx.products.update({
          where: { id: item.products.id },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })
      }

      // Delete sale items first (due to foreign key constraints)
      await tx.sale_items.deleteMany({
        where: { sale_id: id }
      })

      // Delete the sale
      await tx.sales.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'Sale deleted successfully' })
  } catch (error) {
    console.error('Error deleting sale:', error)
    return NextResponse.json(
      { error: 'Failed to delete sale' },
      { status: 500 }
    )
  }
}

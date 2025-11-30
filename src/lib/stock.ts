import { Prisma, PrismaClient } from '@prisma/client'

type TxClient = Prisma.TransactionClient | PrismaClient

export interface StockItem {
  productId: string
  variantId?: string | null
  quantity: number
}

const assertNonNegativeStock = (stock: number, context: string) => {
  if (stock < 0) {
    throw new Error(`Stock would go negative for ${context}`)
  }
}

export async function updateProductStockFromVariants(tx: TxClient, productId: string) {
  const aggregate = await tx.product_variants.aggregate({
    _sum: { stock: true },
    where: { product_id: productId, is_active: true }
  })

  const variantTotal = aggregate._sum.stock ?? 0
  await tx.products.update({
    where: { id: productId },
    data: { stock: variantTotal }
  })

  return variantTotal
}

export async function ensureStockAvailability(tx: TxClient, items: StockItem[]) {
  for (const item of items) {
    if (item.variantId) {
      const variant = await tx.product_variants.findUnique({
        where: { id: item.variantId },
        select: { stock: true, sku: true }
      })
      if (!variant) {
        throw new Error(`Variant not found: ${item.variantId}`)
      }
      if (variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for variant ${variant.sku}`)
      }
    } else {
      const product = await tx.products.findUnique({
        where: { id: item.productId },
        select: { stock: true, sku: true }
      })
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`)
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.sku}`)
      }
    }
  }
}

export async function decrementStock(tx: TxClient, items: StockItem[]) {
  for (const item of items) {
    if (item.variantId) {
      const variant = await tx.product_variants.findUnique({
        where: { id: item.variantId },
        select: { stock: true, product_id: true, sku: true }
      })
      if (!variant) {
        throw new Error(`Variant not found: ${item.variantId}`)
      }
      const newStock = variant.stock - item.quantity
      assertNonNegativeStock(newStock, variant.sku || item.variantId)

      await tx.product_variants.update({
        where: { id: item.variantId },
        data: {
          stock: newStock,
          updated_at: new Date()
        }
      })

      await updateProductStockFromVariants(tx, variant.product_id)
    } else {
      const product = await tx.products.findUnique({
        where: { id: item.productId },
        select: { stock: true, sku: true }
      })
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`)
      }
      const newStock = product.stock - item.quantity
      assertNonNegativeStock(newStock, product.sku || item.productId)

      await tx.products.update({
        where: { id: item.productId },
        data: {
          stock: newStock,
          updated_at: new Date()
        }
      })
    }
  }
}

export async function incrementStock(tx: TxClient, items: StockItem[]) {
  for (const item of items) {
    if (item.variantId) {
      const variant = await tx.product_variants.findUnique({
        where: { id: item.variantId },
        select: { stock: true, product_id: true }
      })
      if (!variant) {
        throw new Error(`Variant not found: ${item.variantId}`)
      }

      await tx.product_variants.update({
        where: { id: item.variantId },
        data: {
          stock: variant.stock + item.quantity,
          updated_at: new Date()
        }
      })

      await updateProductStockFromVariants(tx, variant.product_id)
    } else {
      const product = await tx.products.findUnique({
        where: { id: item.productId },
        select: { stock: true }
      })
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`)
      }

      await tx.products.update({
        where: { id: item.productId },
        data: {
          stock: product.stock + item.quantity,
          updated_at: new Date()
        }
      })
    }
  }
}

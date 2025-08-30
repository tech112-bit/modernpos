import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parse } from 'csv-parse'

// POST /api/products/import - Import products from CSV
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      )
    }

    // Read and parse CSV
    const text = await file.text()
    const records = await new Promise((resolve, reject) => {
      parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) reject(err)
        else resolve(records)
      })
    })

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found in CSV' },
        { status: 400 }
      )
    }

    console.log(`Processing ${records.length} products...`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each record
    for (const record of records) {
      try {
        // Validate required fields
        if (!record.name || !record.sku || !record.price || !record.category) {
          errors.push(`Row ${successCount + errorCount + 1}: Missing required fields`)
          errorCount++
          continue
        }

        // Parse numeric fields
        const price = parseFloat(record.price)
        const cost = parseFloat(record.cost || '0')
        const stock = parseInt(record.stock || '0')

        if (isNaN(price) || price <= 0) {
          errors.push(`Row ${successCount + errorCount + 1}: Invalid price`)
          errorCount++
          continue
        }

        // Find or create category
        let category = await prisma.categories.findFirst({
          where: { name: record.category }
        })

        if (!category) {
          category = await prisma.categories.create({
            data: { 
              id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: record.category,
              user_id: 'admin_user_id', // This should come from auth context
              created_at: new Date(),
              updated_at: new Date()
            }
          })
        }

        // Check if product already exists
        const existingProduct = await prisma.products.findUnique({
          where: { sku: record.sku }
        })

        if (existingProduct) {
          // Update existing product
          await prisma.products.update({
            where: { id: existingProduct.id },
            data: {
              name: record.name,
              description: record.description || null,
              barcode: record.barcode || null,
              price: price,
              cost: cost,
              stock: stock,
              category_id: category.id
            }
          })
        } else {
          // Create new product
          await prisma.products.create({
            data: {
              id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: record.name,
              description: record.description || null,
              sku: record.sku,
              barcode: record.barcode || null,
              price: price,
              cost: cost,
              stock: stock,
              category_id: category.id,
              user_id: 'admin_user_id', // This should come from auth context
              created_at: new Date(),
              updated_at: new Date()
            }
          })
        }

        successCount++
      } catch (error) {
        console.error('Error processing record:', record, error)
        errors.push(`Row ${successCount + errorCount + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        errorCount++
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      summary: {
        total: records.length,
        success: successCount,
        errors: errorCount
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error importing products:', error)
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    )
  }
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to generate simple IDs
function generateId(prefix: string, index: number): string {
  return `${prefix}_${String(index + 1).padStart(3, '0')}`
}

async function main() {
  console.log('🌱 Starting simple database seeding...')

  // Clear existing data
  await prisma.sale_items.deleteMany()
  await prisma.sales.deleteMany()
  await prisma.products.deleteMany()
  await prisma.categories.deleteMany()
  await prisma.customers.deleteMany()
  await prisma.users.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create admin user
  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.users.create({
    data: {
      id: generateId('user', 0),
      email: 'admin@shop.com',
      password: hashedPassword,
      role: 'ADMIN',
      created_at: new Date(),
      updated_at: new Date()
    }
  })

  console.log('👤 Created admin user:', adminUser.email)

  // Create categories
  const categories = await Promise.all([
    prisma.categories.create({ 
      data: { 
        id: generateId('cat', 0),
        name: 'Electronics',
        user_id: adminUser.id,
        created_at: new Date(),
        updated_at: new Date()
      } 
    }),
    prisma.categories.create({ 
      data: { 
        id: generateId('cat', 1),
        name: 'Clothing',
        user_id: adminUser.id,
        created_at: new Date(),
        updated_at: new Date()
      } 
    }),
    prisma.categories.create({ 
      data: { 
        id: generateId('cat', 2),
        name: 'Home & Garden',
        user_id: adminUser.id,
        created_at: new Date(),
        updated_at: new Date()
      } 
    }),
    prisma.categories.create({ 
      data: { 
        id: generateId('cat', 3),
        name: 'Sports',
        user_id: adminUser.id,
        created_at: new Date(),
        updated_at: new Date()
      } 
    }),
    prisma.categories.create({ 
      data: { 
        id: generateId('cat', 4),
        name: 'Beauty',
        user_id: adminUser.id,
        created_at: new Date(),
        updated_at: new Date()
      } 
    })
  ])

  console.log('📁 Created categories')

  // Create products with realistic pricing
  const products = []
  const productNames = [
    'Smartphone', 'Laptop', 'Headphones', 'Tablet', 'Smartwatch',
    'T-Shirt', 'Jeans', 'Dress', 'Shoes', 'Jacket',
    'Coffee Maker', 'Blender', 'Toaster', 'Microwave', 'Refrigerator',
    'Basketball', 'Tennis Racket', 'Yoga Mat', 'Dumbbells', 'Running Shoes',
    'Face Cream', 'Shampoo', 'Perfume', 'Makeup Set', 'Hair Dryer'
  ]

  for (let i = 0; i < productNames.length; i++) {
    const category = categories[i % categories.length]
    const basePrice = Math.floor(Math.random() * 50000) + 10000 // 10,000 - 60,000 MMK
    const cost = Math.floor(basePrice * 0.6) // 60% of selling price
    const stock = Math.floor(Math.random() * 100) + 10 // 10 - 110 units

    const product = await prisma.products.create({
      data: {
        id: generateId('prod', i),
        name: productNames[i],
        description: `High-quality ${productNames[i].toLowerCase()} for everyday use`,
        sku: `SKU-${String(i + 1).padStart(3, '0')}`,
        barcode: `123456789${String(i + 1).padStart(3, '0')}`,
        price: basePrice,
        cost: cost,
        stock: stock,
        category_id: category.id,
        user_id: adminUser.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    products.push(product)
  }

  console.log('📦 Created products')

  // Create customers with realistic data
  const customers = []
  const customerNames = [
    'Aung Min', 'Su Su Hlaing', 'Ko Ko', 'Daw Mya', 'U Ba',
    'Ma Hla', 'Sai Sai', 'Nyein Nyein', 'Win Win', 'Khin Khin',
    'Thant Zin', 'Aye Aye', 'Moe Moe', 'Zaw Zaw', 'Hla Hla'
  ]

  for (let i = 0; i < customerNames.length; i++) {
    const customer = await prisma.customers.create({
      data: {
        id: generateId('cust', i),
        name: customerNames[i],
        email: `${customerNames[i].toLowerCase().replace(' ', '')}${i + 1}@gmail.com`,
        phone: `09${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        address: `${Math.floor(Math.random() * 100) + 1} Street, Yangon`,
        city: 'Yangon',
        state: 'Yangon',
        zip_code: `${Math.floor(Math.random() * 1000) + 1000}`,
        user_id: adminUser.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    customers.push(customer)
  }

  console.log('👥 Created customers')

  // Create sales data with realistic, spread-out dates
  const sales = []
  const today = new Date()
  
  // Create sales over the last 6 months (180 days) instead of just 30 days
  // This will make the data look more realistic and less "new"
  for (let day = 180; day >= 0; day--) {
    const saleDate = new Date(today)
    saleDate.setDate(today.getDate() - day)
    
    // Vary business hours (8 AM - 8 PM)
    saleDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0)
    
    // Create 0-3 sales per day (more realistic business pattern)
    // Weekends and weekdays have different patterns
    const isWeekend = saleDate.getDay() === 0 || saleDate.getDay() === 6
    const maxSalesPerDay = isWeekend ? 2 : 4 // Fewer sales on weekends
    const salesPerDay = Math.floor(Math.random() * maxSalesPerDay)
    
    for (let sale = 0; sale < salesPerDay; sale++) {
      const customer = customers[Math.floor(Math.random() * customers.length)]
      const product = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const total = Number(product.price) * quantity
      
      const saleRecord: { id: string; total: any } = await prisma.sales.create({
        data: {
          id: generateId('sale', sales.length),
          total: total,
          payment_type: ['CASH', 'CARD', 'MOBILE_PAY'][Math.floor(Math.random() * 3)] as any,
          discount: Math.floor(Math.random() * 2000),
          created_at: saleDate,
          updated_at: new Date(),
          user_id: adminUser.id,
          customer_id: customer.id
        }
      })

      await prisma.sale_items.create({
        data: {
          id: generateId('item', sales.length),
          quantity: quantity,
          price: Number(product.price),
          sale_id: saleRecord.id,
          product_id: product.id,
          user_id: adminUser.id,
          created_at: new Date()
        }
      })

      sales.push(saleRecord)
    }
  }

  console.log('💰 Created sales data for 6 months (180 days)')

  // Calculate summary
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
  const totalSales = sales.length
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

  console.log('\n📊 SIMPLE SEEDING COMPLETE!')
  console.log('============================')
  console.log(`🛍️  Total Products: ${products.length}`)
  console.log(`💰 Total Revenue: ${totalRevenue.toLocaleString()} MMK`)
  console.log(`📈 Average Daily Revenue: ${Math.round(totalRevenue / 180).toLocaleString()} MMK`)
  console.log(`🛒 Total Sales: ${totalSales}`)
  console.log(`📊 Average Order Value: ${Math.round(averageOrderValue).toLocaleString()} MMK`)
  console.log(`📅 Data spans: ${180} days (6 months)`)
  console.log(`👥 Total Customers: ${customers.length}`)
  console.log(`📁 Total Categories: ${categories.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

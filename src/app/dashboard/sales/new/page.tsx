'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ShoppingCartIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface Product {
  id: string
  name: string
  description?: string
  sku: string
  barcode?: string
  price: number | string // Can be Decimal from database (string) or number
  cost: number | string
  stock: number
  categories: {
    name: string
  }
}

interface Customer {
  id: string
  name: string
  phone: string
}

interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  stock: number
}

export default function NewSalePage() {
  const router = useRouter()
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const csrfToken = useCsrfToken()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [paymentType, setPaymentType] = useState<'CASH' | 'CARD' | 'MOBILE_PAY'>('CASH')
  const [discount, setDiscount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id)
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
        addNotification({
          type: 'success',
          title: 'Quantity Updated',
          message: `${product.name} quantity increased to ${existingItem.quantity + 1}`,
          duration: 3000
        })
      } else {
        addNotification({
          type: 'warning',
          title: 'Stock Limit Reached',
          message: `Cannot add more ${product.name} - stock limit reached`,
          duration: 4000
        })
      }
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.price), // Convert Decimal to number
        quantity: 1,
        stock: product.stock
      }])
      addNotification({
        type: 'success',
        title: 'Product Added',
        message: `${product.name} added to cart (${formatCurrency(Number(product.price))})`,
        duration: 3000
      })
    }
  }

  const removeFromCart = (productId: string) => {
    const item = cart.find(item => item.productId === productId)
    if (item) {
      setCart(cart.filter(item => item.productId !== productId))
      addNotification({
        type: 'info',
        title: 'Product Removed',
        message: `${item.name} removed from cart (${formatCurrency(item.price)})`,
        duration: 3000
      })
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.find(item => item.productId === productId)
    if (item && quantity > 0 && quantity <= item.stock) {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal - discount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      setError('Please add items to cart')
      return
    }

    setLoading(true)
    setError('')

    try {
      const saleData = {
        customer_id: selectedCustomer || undefined,
        items: cart.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        payment_type: paymentType,
        discount,
        csrfToken
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Sale Completed',
          message: `Sale has been completed successfully. Total: ${formatCurrency(total)}`,
          duration: 5000
        })
        router.push('/dashboard/sales')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create sale')
        addNotification({
          type: 'error',
          title: 'Sale Failed',
          message: `Failed to create sale: ${errorData.error || 'Please try again.'}`,
          duration: 5000
        })
      }
    } catch (err) {
      setError('Failed to create sale. Please try again.')
      addNotification({
        type: 'error',
        title: 'Sale Failed',
        message: 'Network error: Failed to create sale. Please try again.',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.categories.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard/sales')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create a new sale transaction.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="submit"
            form="new-sale-form"
            disabled={loading || cart.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <ShoppingCartIcon className="h-4 w-4 mr-2" />
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="bg-white shadow rounded-lg p-4">
            <input
              type="text"
              placeholder="Search products by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Products Grid */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Products</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <span className="text-sm text-gray-500">{product.sku}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.categories.name}</p>
                                         <div className="flex justify-between items-center">
                       <span className="text-lg font-bold text-green-600">{formatCurrency(Number(product.price))}</span>
                       <div className="flex items-center space-x-2">
                         <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                         <button
                           onClick={() => addToCart(product)}
                           disabled={product.stock === 0}
                           className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                         >
                           <PlusIcon className="h-4 w-4" />
                         </button>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          {/* Sale Details */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sale Details</h3>
            
            {/* Customer Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as 'CASH' | 'CARD' | 'MOBILE_PAY')}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="MOBILE_PAY">Mobile Payment</option>
              </select>
            </div>

            {/* Discount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Cart ({cart.length})
            </h3>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items in cart</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.sku}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                                             <span className="font-medium text-gray-900">
                         {formatCurrency(item.price * item.quantity)}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="space-y-2">
                             <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Subtotal:</span>
                 <span className="text-gray-900">{formatCurrency(subtotal)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Discount:</span>
                 <span className="text-red-600">-{formatCurrency(discount)}</span>
               </div>
               <div className="border-t border-gray-200 pt-2">
                 <div className="flex justify-between text-lg font-bold">
                   <span>Total:</span>
                   <span className="text-green-600">{formatCurrency(total)}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden form for submission */}
      <form id="new-sale-form" onSubmit={handleSubmit} className="hidden" />
    </div>
  )
}

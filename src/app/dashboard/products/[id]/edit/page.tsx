'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useNotifications } from '@/contexts/NotificationContext'
import CurrencySelector from '@/components/CurrencySelector'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import {
  ArrowLeftIcon,
  CheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost: number
  stock: number
  category: string
  sku: string
  barcode?: string
}

interface Category {
  id: string
  name: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { currentCurrency, formatCurrency, convertCurrency } = useCurrency()
  const { addNotification } = useNotifications()
  const csrfToken = useCsrfToken()

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProduct()
    fetchCategories()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct({
          id: data.id,
          name: data.name,
          description: data.description || '',
          price: data.price,
          cost: data.cost,
          stock: data.stock,
          category: data.category.id,
          sku: data.sku,
          barcode: data.barcode || ''
        })
      } else {
        setError('Product not found')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('Failed to fetch product')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setSaving(true)
    setError('')

    try {
      // Convert price and cost to MMK before sending to API
      const mmkPrice = convertToMMK(Number(product.price))
      const mmkCost = convertToMMK(Number(product.cost))

      const productData = {
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        barcode: product.barcode || '',
        price: mmkPrice,
        cost: mmkCost,
        stock: Number(product.stock),
        categoryId: product.category,
        csrfToken: csrfToken
      }

      console.log('Sending product data:', productData)

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Product Updated',
          message: `Product "${product.name}" has been updated successfully.`,
          duration: 5000
        })
        // Redirect back to products list
        router.push('/dashboard/products')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update product')
      }
    } catch (err) {
      setError('Failed to update product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    addNotification({
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      duration: 0,
      actions: [
        {
          label: 'Cancel',
          onClick: () => {},
          variant: 'secondary'
        },
        {
          label: 'Delete',
          onClick: () => performDelete(),
          variant: 'danger'
        }
      ]
    })
  }

  const performDelete = async () => {

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ csrfToken })
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Product Deleted',
          message: `Product has been deleted successfully.`,
          duration: 5000
        })
        // Redirect back to products list
        router.push('/dashboard/products')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete product')
      }
    } catch (err) {
      setError('Failed to delete product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Helper function to convert current currency amount to MMK
  const convertToMMK = (amount: number): number => {
    if (!currentCurrency || currentCurrency.code === 'MMK') {
      return amount
    }
    
    // Convert from current currency to MMK
    return amount / currentCurrency.exchangeRate
  }

  // Helper function to get currency symbol
  const getCurrencySymbol = () => {
    return currentCurrency?.symbol || currentCurrency?.code || 'MMK'
  }

  const handleInputChange = (field: keyof Product, value: string | number) => {
    if (!product) return
    setProduct({ ...product, [field]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Product not found</h2>
        <p className="mt-2 text-gray-600">The product you&apos;re looking for doesn&apos;t exist.</p>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard/products')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-2 text-sm text-gray-700">
              Update product information and inventory details.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
          <button
            type="submit"
            form="edit-product-form"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
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

      {/* Currency Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-800">Current Currency</h3>
            <p className="text-sm text-blue-600">
              {currentCurrency?.name} ({currentCurrency?.code}) - {currentCurrency?.symbol}
            </p>
          </div>
          <CurrencySelector />
        </div>
      </div>

      {/* Edit Form */}
      <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Product Information
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={product.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                                        <select
                          id="category"
                          value={product.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                  SKU *
                </label>
                <input
                  type="text"
                  id="sku"
                  value={product.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">
                  Barcode
                </label>
                <input
                  type="text"
                  id="barcode"
                  value={product.barcode || ''}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Selling Price *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{getCurrencySymbol()}</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    min="0"
                    value={product.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    required
                    className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter price in {currentCurrency?.code} ({currentCurrency?.name})
                  {currentCurrency?.code !== 'MMK' && ` - Will be converted to MMK for storage`}
                </p>
              </div>

              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                  Cost Price *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{getCurrencySymbol()}</span>
                  </div>
                  <input
                    type="number"
                    id="cost"
                    step="0.01"
                    min="0"
                    value={product.cost}
                    onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                    required
                    className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter cost in {currentCurrency?.code} ({currentCurrency?.name})
                  {currentCurrency?.code !== 'MMK' && ` - Will be converted to MMK for storage`}
                </p>
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  id="stock"
                  min="0"
                  value={product.stock}
                  onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={product.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

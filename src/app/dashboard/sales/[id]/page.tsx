'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatRelativeTime } from '@/lib/utils'
import {
  ArrowLeftIcon,
  TrashIcon,
  UserIcon,
  ShoppingCartIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface Sale {
  id: string
  total: number
  paymentType: string
  discount: number
  createdAt: string
  user: {
    email: string
  }
  customer?: {
    name: string
    phone: string
    email: string
  }
  items: Array<{
    quantity: number
    price: number
    product: {
      name: string
      sku: string
    }
  }>
}

export default function SaleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { addNotification } = useNotifications()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchSale(params.id as string)
    }
  }, [params.id])

  const fetchSale = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSale(data)
      } else {
        setError('Sale not found')
      }
    } catch (error) {
      console.error('Error fetching sale:', error)
      setError('Failed to fetch sale')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!sale) return
    
    addNotification({
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this sale? This action cannot be undone.',
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
    if (!sale) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/sales/${sale.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/dashboard/sales')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete sale')
      }
    } catch (err) {
      setError('Failed to delete sale. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error || 'Sale not found'}</div>
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/sales"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Sales
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link
            href="/dashboard/sales"
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sale #{sale?.id?.slice(-8) || 'Unknown'}</h1>
            <p className="mt-2 text-sm text-gray-700">
              Sale details and transaction information.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete Sale'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sale Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sale Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sale Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-500">Sale ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{sale.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Date & Time</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatRelativeTime(sale.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Payment Type</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{sale.paymentType.toLowerCase()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Processed By</label>
                <p className="mt-1 text-sm text-gray-900">{sale.user.email}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {sale.customer && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{sale.customer.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{sale.customer.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{sale.customer.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Items ({sale.items.length})
            </h3>
            <div className="space-y-3">
              {sale.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{item.quantity} × ${item.price.toFixed(2)}</p>
                    <p className="font-medium text-gray-900">${(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          {/* Total */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">${(sale.total + sale.discount).toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-red-600">-${sale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">${sale.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <Link
                href="/dashboard/sales/new"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                New Sale
              </Link>
              <Link
                href="/dashboard/sales"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View All Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

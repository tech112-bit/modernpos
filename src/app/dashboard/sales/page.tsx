'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatRelativeTime } from '@/lib/utils'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface Sale {
  id: string
  total: number
  payment_type: string
  discount: number
  created_at: string
  users: {
    email: string
  }
  customers?: {
    name: string
  }
  sale_items: Array<{
    quantity: number
    price: number
    products: {
      name: string
      sku: string
    }
  }>
}

export default function SalesPage() {
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSales()
  }, [])

  // Refresh data when page becomes visible (e.g., returning from creating a new sale)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSales()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data.sales)
      } else {
        console.error('Failed to fetch sales')
        addNotification({
          type: 'error',
          title: 'Fetch Failed',
          message: 'Failed to fetch sales data. Please refresh the page.',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to the server. Please check your connection.',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(sale =>
    sale.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
  const totalSales = sales.length
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base xs:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Sales</h1>
          <p className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-700">
            Track all sales transactions and revenue.
          </p>
        </div>
        <div className="mt-3 xs:mt-4 sm:mt-0">
          <Link
            href="/dashboard/sales/new"
            className="inline-flex items-center px-2.5 xs:px-3 md:px-4 py-1.5 xs:py-2 border border-transparent rounded-md shadow-sm text-xs xs:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ShoppingCartIcon className="h-3 w-3 xs:h-4 xs:w-4" />
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-2.5 xs:p-3 md:p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 xs:pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search sales by customer, user, or sale ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-8 xs:pl-10 pr-2.5 xs:pr-3 py-1.5 xs:py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
          />
        </div>
      </div>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 xs:p-4 md:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 text-green-400" />
              </div>
              <div className="ml-2 xs:ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-sm xs:text-base md:text-lg font-medium text-gray-900">{formatCurrency(totalRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 xs:p-4 md:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 text-blue-400" />
              </div>
              <div className="ml-2 xs:ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                  <dd className="text-sm xs:text-base md:text-lg font-medium text-gray-900">{totalSales}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 xs:p-4 md:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 text-purple-400" />
              </div>
              <div className="ml-2 xs:ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Avg Order Value</dt>
                  <dd className="text-sm xs:text-base md:text-lg font-medium text-gray-900">{formatCurrency(averageOrderValue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Sales List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-3 xs:px-4 md:px-5 lg:px-6 py-3 xs:py-4 md:py-5 lg:py-6">
          <div className="space-y-3 xs:space-y-4">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="border border-gray-200 rounded-lg p-2.5 xs:p-3 md:p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2 xs:mb-3">
                  <div>
                    <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-900">Sale #{sale.id.slice(-8)}</h3>
                    <p className="text-xs xs:text-sm text-gray-500">
                      {formatRelativeTime(sale.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg xs:text-xl md:text-2xl font-bold text-green-600">{formatCurrency(sale.total)}</p>
                    <p className="text-xs xs:text-sm text-gray-500 capitalize">{sale.payment_type.toLowerCase()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2 xs:gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs xs:text-sm text-gray-600">
                      <UserIcon className="h-3 w-3 xs:h-4 xs:w-4 inline mr-1" />
                      {sale.users.email}
                    </p>
                    {sale.customers && (
                      <p className="text-xs xs:text-sm text-gray-600">
                        Customer: {sale.customers.name}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs xs:text-sm text-gray-600">
                      Items: {sale.sale_items.length}
                    </p>
                    {sale.discount > 0 && (
                      <p className="text-xs xs:text-sm text-red-600">
                        Discount: -{formatCurrency(sale.discount)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-2 xs:mt-3 pt-2 xs:pt-3 border-t border-gray-200">
                  <div className="space-y-1 xs:space-y-2">
                    {sale.sale_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs xs:text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.products.name}
                        </span>
                        <span className="text-gray-900">{formatCurrency(item.quantity * item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 xs:mt-3">
                  <Link
                    href={`/dashboard/sales/${sale.id}`}
                    className="w-full text-center bg-gray-100 text-gray-700 py-1.5 xs:py-2 px-2.5 xs:px-4 rounded-md hover:bg-gray-200 transition-colors text-xs xs:text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}

            {filteredSales.length === 0 && (
              <div className="text-center py-6 xs:py-8 md:py-12">
                <p className="text-xs xs:text-sm md:text-base text-gray-500">No sales found</p>
                <p className="text-xs xs:text-sm text-gray-400 mt-1">Try adjusting your search or create a new sale</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

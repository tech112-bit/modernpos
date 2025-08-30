'use client'

import { useState, useEffect } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface LowStockProduct {
  id: string
  name: string
  stock: number
  price: number | string
}

export default function LowStockAlert() {
  const { settings } = useSettings()
  const { formatCurrency } = useCurrency()
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLowStockProducts()
  }, [settings.lowStockThreshold])

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        const lowStock = data.products.filter((product: LowStockProduct) => 
          product.stock <= settings.lowStockThreshold
        )
        setLowStockProducts(lowStock)
      }
    } catch (error) {
      console.error('Error fetching low stock products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-yellow-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-yellow-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (lowStockProducts.length === 0 || !settings.notifications.lowStock) {
    return null
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Low Stock Alert ({lowStockProducts.length} items)
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">
              The following products are running low on stock (≤ {settings.lowStockThreshold} units):
            </p>
            <ul className="space-y-1">
              {lowStockProducts.slice(0, 3).map((product) => (
                <li key={product.id} className="flex justify-between items-center">
                  <span className="truncate">{product.name}</span>
                  <span className="text-yellow-600 font-medium">
                    {product.stock} units left
                  </span>
                </li>
              ))}
            </ul>
            {lowStockProducts.length > 3 && (
              <p className="text-xs text-yellow-600 mt-2">
                +{lowStockProducts.length - 3} more items with low stock
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

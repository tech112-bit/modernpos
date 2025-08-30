'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  CubeIcon,
  UserIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline'

interface SearchResult {
  type: 'product' | 'customer' | 'sale'
  id: string
  title: string
  subtitle: string
  url: string
}

export default function QuickSearch() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (searchTerm.length >= 2) {
      performSearch()
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [searchTerm])

  const performSearch = async () => {
    if (searchTerm.length < 2) return

    setIsSearching(true)
    try {
      // Search products
      const productsResponse = await fetch(`/api/products?search=${searchTerm}`)
      const productsData = productsResponse.ok ? await productsResponse.json() : { products: [] }
      
      // Search customers
      const customersResponse = await fetch(`/api/customers?search=${searchTerm}`)
      const customersData = customersResponse.ok ? await customersResponse.json() : { customers: [] }
      
      // Search sales
      const salesResponse = await fetch(`/api/sales?search=${searchTerm}`)
      const salesData = salesResponse.ok ? await salesResponse.json() : { sales: [] }

      const searchResults: SearchResult[] = []

      // Add product results
      productsData.products?.slice(0, 3).forEach((product: { id: string; name: string; sku: string; price: number }) => {
        searchResults.push({
          type: 'product',
          id: product.id,
          title: product.name,
          subtitle: `SKU: ${product.sku} - $${product.price}`,
          url: `/dashboard/products/${product.id}/edit`
        })
      })

      // Add customer results
      customersData.customers?.slice(0, 3).forEach((customer: { id: string; name: string; email?: string; phone?: string }) => {
        searchResults.push({
          type: 'customer',
          id: customer.id,
          title: customer.name,
          subtitle: customer.email || customer.phone || 'No contact info',
          url: `/dashboard/customers/${customer.id}`
        })
      })

      // Add sale results
      salesData.sales?.slice(0, 3).forEach((sale: { id: string; total: number; createdAt: string }) => {
        searchResults.push({
          type: 'sale',
          id: sale.id,
          title: `Sale #${sale.id.slice(-8)}`,
          subtitle: `${formatRelativeTime(sale.createdAt)} - ${sale.total} MMK`,
          url: `/dashboard/sales/${sale.id}`
        })
      })

      setResults(searchResults)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setSearchTerm('')
    setShowResults(false)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search products, customers, sales..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-9 xs:pl-10 md:pl-12 pr-9 xs:pr-10 md:pr-12 py-2 xs:py-2.5 md:py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm xs:text-base md:text-base"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-auto">
          <div className="py-1 xs:py-2">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full px-3 xs:px-4 md:px-4 py-2 xs:py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 xs:w-8 xs:h-8 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white text-xs xs:text-sm md:text-sm font-medium ${
                      result.type === 'product' ? 'bg-blue-500' :
                      result.type === 'customer' ? 'bg-green-500' : 'bg-purple-500'
                    }`}>
                      {result.type === 'product' ? 'P' :
                       result.type === 'customer' ? 'C' : 'S'}
                    </div>
                  </div>
                  <div className="ml-2 xs:ml-3 md:ml-3 flex-1">
                    <div className="text-xs xs:text-sm md:text-sm font-medium text-gray-900">{result.title}</div>
                    <div className="text-xs xs:text-sm md:text-sm text-gray-500">{result.subtitle}</div>
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{result.type}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && searchTerm.length >= 2 && results.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-3 xs:px-4 md:px-4 py-2 xs:py-3 text-xs xs:text-sm md:text-sm text-gray-500 text-center">
            No results found for &quot;{searchTerm}&quot;
          </div>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-3 xs:px-4 md:px-4 py-2 xs:py-3 text-xs xs:text-sm md:text-sm text-gray-500 text-center">
            <div className="animate-spin rounded-full h-3 w-3 xs:h-4 xs:w-4 md:h-4 md:w-4 border-b-2 border-blue-500 mx-auto"></div>
            Searching...
          </div>
        </div>
      )}
    </div>
  )
}

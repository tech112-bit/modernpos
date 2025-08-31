'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils'
import { useSmartDataFetching } from '@/hooks'
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

interface ConsolidatedSearchResponse {
  products: Array<{ id: string; name: string; sku: string; price: number }>
  customers: Array<{ id: string; name: string; email?: string; phone?: string }>
  sales: Array<{ id: string; total: number; createdAt: string }>
}

export default function QuickSearch() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)

  // Use smart data fetching with consolidated search endpoint
  const { 
    data: searchData, 
    loading: isSearching, 
    refetch: performSearch 
  } = useSmartDataFetching<ConsolidatedSearchResponse>({
    endpoint: `/api/search/consolidated?q=${searchTerm}`,
    autoFetch: false, // Only fetch when explicitly called
    cacheDuration: 300000, // Cache for 5 minutes
    debounceDelay: 500, // Debounce search requests
    skipCache: searchTerm.length < 2 // Skip cache for short searches
  })

  // Process search results when data changes
  useEffect(() => {
    if (searchData && searchTerm.length >= 2) {
      const searchResults: SearchResult[] = []

      // Add product results
      searchData.products?.slice(0, 3).forEach((product) => {
        searchResults.push({
          type: 'product',
          id: product.id,
          title: product.name,
          subtitle: `SKU: ${product.sku} - $${product.price}`,
          url: `/dashboard/products/${product.id}/edit`
        })
      })

      // Add customer results
      searchData.customers?.slice(0, 3).forEach((customer) => {
        searchResults.push({
          type: 'customer',
          id: customer.id,
          title: customer.name,
          subtitle: customer.email || customer.phone || 'No contact info',
          url: `/dashboard/customers/${customer.id}`
        })
      })

      // Add sale results
      searchData.sales?.slice(0, 3).forEach((sale) => {
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
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [searchData, searchTerm])

  // Debounced search effect
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch()
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [searchTerm, performSearch])

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setShowResults(false)
    setSearchTerm('')
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setResults([])
    setShowResults(false)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <CubeIcon className="h-4 w-4 text-blue-500" />
      case 'customer':
        return <UserIcon className="h-4 w-4 text-green-500" />
      case 'sale':
        return <ShoppingCartIcon className="h-4 w-4 text-purple-500" />
      default:
        return <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search products, customers, sales..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === 0 ? 'rounded-t-md' : ''
              } ${index === results.length - 1 ? 'rounded-b-md' : ''}`}
            >
              <div className="flex items-center space-x-3">
                {getResultIcon(result.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {result.subtitle}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && searchTerm.length >= 2 && !isSearching && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-4 py-3">
          <p className="text-sm text-gray-500 text-center">No results found</p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'
import CategoryImport from '@/components/CategoryImport'
import { LoadingSpinner, Card } from '@/components/ui'
import { useSmartDataFetching, useDeleteConfirmation, useSearch } from '@/hooks'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon
} from '@heroicons/react/24/outline'

interface Category {
  id: string
  name: string
  createdAt: string
  _count?: {
    products: number
  }
}

export default function CategoriesPage() {
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Use smart data fetching with caching
  const { 
    data: categoriesData, 
    loading, 
    error, 
    refetch: fetchCategories 
  } = useSmartDataFetching<Category[]>({
    endpoint: '/api/categories',
    autoFetch: !!user,
    cacheDuration: 300000, // Cache for 5 minutes
    debounceDelay: 500 // Debounce API calls
  })

  const categories = categoriesData || []

  // Use the new search hook
  const { 
    searchTerm, 
    filteredData: filteredCategories, 
    handleSearchChange 
  } = useSearch<Category>({
    data: categories,
    searchFields: ['name']
  })

  // Use the new delete confirmation hook
  const { confirmDelete } = useDeleteConfirmation()

  const handleDelete = async (categoryId: string, categoryName: string) => {
    confirmDelete(
      categoryId,
      categoryName,
      async (id: string) => {
        setDeleteLoading(id)
        
        try {
          const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE'
          })

          if (response.ok) {
            // Update the data in the hook
            fetchCategories()
            
            addNotification({
              type: 'success',
              title: 'Category Deleted',
              message: 'Category has been deleted successfully.',
              duration: 4000
            })
          } else {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete category')
          }
        } finally {
          setDeleteLoading(null)
        }
      },
      {
        onError: (errorMessage) => {
          addNotification({
            type: 'error',
            title: 'Delete Failed',
            message: errorMessage,
            duration: 5000
          })
        }
      }
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 px-3 sm:px-0">
      {/* Header - Different layouts for mobile vs tablet/desktop */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base lg:text-lg">
            Manage product categories
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Link
            href="/dashboard/categories/new"
            className="flex w-full sm:w-auto justify-center items-center px-4 py-2.5 sm:px-6 sm:py-3 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            New Category
          </Link>
        </div>
      </div>

      {/* Stats Cards - Different layouts for mobile vs tablet/desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Mobile: Single card, Tablet/Desktop: Three cards */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-500 sm:text-base">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{categories.length}</p>
            </div>
          </div>
        </Card>

        {/* Tablet/Desktop only stats */}
        <Card className="hidden sm:block">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TagIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-base font-medium text-gray-500">Active Categories</p>
              <p className="text-3xl font-bold text-gray-900">{categories.filter(cat => (cat._count?.products || 0) > 0).length}</p>
            </div>
          </div>
        </Card>

        <Card className="hidden sm:block">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TagIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-base font-medium text-gray-500">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{categories.reduce((sum, cat) => sum + (cat._count?.products || 0), 0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Import - Different layouts for mobile vs tablet/desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Search - Full width on mobile/tablet, half width on desktop */}
        <Card>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <TagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search categories..."
            />
          </div>
        </Card>

        {/* Category Import - Full width on mobile/tablet, half width on desktop */}
        <Card>
          <CategoryImport />
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 sm:text-base">Error</h3>
              <div className="mt-2 text-sm text-red-700 sm:text-base">{error}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Categories List - Different layouts for mobile vs tablet/desktop */}
      <Card className="overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="px-4 py-12 sm:px-8 sm:py-16 text-center">
            <TagIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
            <h3 className="mt-3 text-lg font-medium text-gray-900 sm:text-xl">
              {searchTerm ? 'No categories found' : 'No categories yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {searchTerm 
                ? 'Try adjusting your search terms.'
                : 'Get started by creating your first category.'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  href="/dashboard/categories/new"
                  className="inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 border border-transparent shadow-sm text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  New Category
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCategories.map((category) => (
              <div key={category.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                {/* Mobile Layout: Stacked (Category name first, then buttons in two columns) */}
                <div className="block sm:hidden space-y-3">
                  {/* Category Name Section - Full Width */}
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <TagIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {category.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {category._count?.products || 0} products
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Two Columns in One Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dashboard/categories/${category.id}/edit`}
                      className="inline-flex items-center justify-center px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={deleteLoading === category.id}
                      className="inline-flex items-center justify-center px-3 py-2.5 border border-red-300 rounded-lg text-xs font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                    >
                      <TrashIcon className="h-3.5 w-3.5 mr-1.5" />
                      {deleteLoading === category.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                {/* Tablet/Desktop Layout: Horizontal (Category name and buttons in one row) */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <TagIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h4 className="text-base font-medium text-gray-900 truncate">
                        {category.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {category._count?.products || 0} products
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Horizontal layout */}
                  <div className="flex items-center space-x-3 ml-6">
                    <Link
                      href={`/dashboard/categories/${category.id}/edit`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={deleteLoading === category.id}
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      {deleteLoading === category.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

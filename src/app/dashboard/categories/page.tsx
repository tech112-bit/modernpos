'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'
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
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCategories()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        setError('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId: string, categoryName: string) => {
    addNotification({
      type: 'warning',
      title: 'Confirm Delete',
      message: `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`,
      duration: 0,
      actions: [
        {
          label: 'Cancel',
          onClick: () => {},
          variant: 'secondary'
        },
        {
          label: 'Delete',
          onClick: () => performDelete(categoryId, categoryName),
          variant: 'danger'
        }
      ]
    })
  }

  const performDelete = async (categoryId: string, categoryName: string) => {

    setDeleteLoading(categoryId)
    setError('')

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove category from state
        setCategories(categories.filter(cat => cat.id !== categoryId))
        addNotification({
          type: 'success',
          title: 'Category Deleted',
          message: 'Category has been deleted successfully.',
          duration: 4000
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete category')
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: errorData.error || 'Failed to delete category',
          duration: 5000
        })
      }
    } catch (err) {
      setError('Failed to delete category. Please try again.')
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete category. Please try again.',
        duration: 5000
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3 xs:space-y-4 md:space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base xs:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 xs:mt-1.5 md:mt-2 lg:mt-2 text-[10px] xs:text-xs md:text-sm lg:text-sm text-gray-700">
            Manage product categories and organization.
          </p>
        </div>
        <div className="mt-2 xs:mt-3 md:mt-4 lg:mt-4 sm:mt-0">
          <Link
            href="/dashboard/categories/new"
            className="inline-flex items-center px-2.5 xs:px-3 md:px-4 lg:px-4 py-1.5 xs:py-2 md:py-2 lg:py-2 border border-transparent rounded-md shadow-sm text-[10px] xs:text-xs md:text-sm lg:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-4 md:w-4 lg:h-4 lg:w-4 mr-1 xs:mr-1.5 md:mr-2 lg:mr-2" />
            New Category
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 xs:gap-4 md:gap-5 lg:gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 xs:p-4 md:p-5 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 text-gray-400" />
              </div>
              <div className="ml-3 xs:ml-4 md:ml-5 lg:ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-xs xs:text-sm md:text-sm lg:text-base font-medium text-gray-500 truncate">
                    Total Categories
                  </dt>
                  <dd className="text-sm xs:text-base md:text-lg lg:text-xl font-medium text-gray-900">
                    {categories.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-3 xs:px-4 md:px-5 lg:px-6 py-3 xs:py-4 md:py-5 lg:py-6">
          <div className="max-w-lg">
            <label htmlFor="search" className="sr-only">
              Search categories
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 xs:pl-3 md:pl-3 lg:pl-4 flex items-center pointer-events-none">
                <TagIcon className="h-4 w-4 xs:h-4.5 xs:w-4.5 md:h-5 md:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 xs:pl-10 md:pl-10 lg:pl-12 pr-2.5 xs:pr-3 md:pr-3 lg:pr-4 py-1.5 xs:py-2 md:py-2 lg:py-2.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm md:text-sm lg:text-base"
                placeholder="Search categories..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 xs:p-4 md:p-4 lg:p-5">
          <div className="flex">
            <div className="ml-2 xs:ml-3 md:ml-3 lg:ml-4">
              <h3 className="text-xs xs:text-sm md:text-sm lg:text-base font-medium text-red-800">Error</h3>
              <div className="mt-1 xs:mt-1.5 md:mt-2 lg:mt-2.5 text-xs xs:text-sm md:text-sm lg:text-base text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredCategories.length === 0 ? (
            <li className="px-4 xs:px-5 md:px-6 lg:px-6 py-8 xs:py-10 md:py-12 lg:py-12 text-center">
              <TagIcon className="mx-auto h-8 w-8 xs:h-10 xs:w-10 md:h-12 md:w-12 text-gray-400" />
              <h3 className="mt-1.5 xs:mt-2 md:mt-2 lg:mt-3 text-xs xs:text-sm md:text-sm lg:text-base font-medium text-gray-900">
                {searchTerm ? 'No categories found' : 'No categories yet'}
              </h3>
              <p className="mt-1 xs:mt-1.5 md:mt-1.5 lg:mt-2 text-xs xs:text-sm md:text-sm lg:text-base text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'Get started by creating your first category.'
                }
              </p>
              {!searchTerm && (
                <div className="mt-4 xs:mt-5 md:mt-6 lg:mt-6">
                  <Link
                    href="/dashboard/categories/new"
                    className="inline-flex items-center px-2.5 xs:px-3 md:px-4 lg:px-6 py-1.5 xs:py-2 md:py-2 lg:py-2.5 border border-transparent shadow-sm text-xs xs:text-sm md:text-sm lg:text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-4 md:w-4 lg:h-5 lg:w-5 mr-1 xs:mr-1.5 md:mr-2 lg:mr-3" />
                    New Category
                  </Link>
                </div>
              )}
            </li>
          ) : (
            filteredCategories.map((category) => (
              <li key={category.id}>
                <div className="px-3 xs:px-4 md:px-5 lg:px-6 py-3 xs:py-4 md:py-4 lg:py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-6 w-6 xs:h-7 xs:w-7 md:h-8 md:w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <TagIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 md:h-4 md:w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3 xs:ml-4 md:ml-4 lg:ml-5">
                        <div className="text-xs xs:text-sm md:text-sm lg:text-base font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="text-xs xs:text-sm md:text-sm lg:text-base text-gray-500">
                          {category._count?.products || 0} products
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 xs:space-x-2 md:space-x-2 lg:space-x-3">
                      <Link
                        href={`/dashboard/categories/${category.id}/edit`}
                        className="inline-flex items-center px-2 xs:px-2.5 md:px-3 lg:px-4 py-1 xs:py-1.5 md:py-1 lg:py-1.5 border border-gray-300 rounded-md text-xs xs:text-sm md:text-sm lg:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PencilIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 md:h-4 md:w-4 mr-0.5 xs:mr-1 md:mr-1 lg:mr-1.5" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={deleteLoading === category.id}
                        className="inline-flex items-center px-2 xs:px-2.5 md:px-3 lg:px-4 py-1 xs:py-1.5 md:py-1 lg:py-1.5 border border-red-300 rounded-md text-xs xs:text-sm md:text-sm lg:text-base font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <TrashIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 md:h-4 md:w-4 mr-0.5 xs:mr-1 md:mr-1 lg:mr-1.5" />
                        {deleteLoading === category.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

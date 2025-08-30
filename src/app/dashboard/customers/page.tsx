'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatRelativeTime } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  zipCode: string
  createdAt: string
  _count: {
    sales: number
  }
}

export default function CustomersPage() {
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) {
      fetchCustomers()
    }
  }, [user, searchTerm])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      
      const query = new URLSearchParams()
      if (searchTerm) query.append('search', searchTerm)

      const response = await fetch(`/api/customers?${query.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      } else {
        console.error('Failed to fetch customers')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    addNotification({
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this customer? This action cannot be undone.',
      duration: 0,
      actions: [
        {
          label: 'Cancel',
          onClick: () => {},
          variant: 'secondary'
        },
        {
          label: 'Delete',
          onClick: () => performDelete(customerId),
          variant: 'danger'
        }
      ]
    })
  }

  const performDelete = async (customerId: string) => {

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh the customers list
        fetchCustomers()
        addNotification({
          type: 'success',
          title: 'Customer Deleted',
          message: 'Customer has been deleted successfully.',
          duration: 4000
        })
      } else {
        const errorData = await response.json()
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: `Failed to delete customer: ${errorData.error}`,
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete customer. Please try again.',
        duration: 5000
      })
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
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
          <h1 className="text-base xs:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 xs:mt-1.5 md:mt-2 lg:mt-2 text-[10px] xs:text-xs md:text-sm lg:text-sm text-gray-700">
            Manage your customer database and track customer relationships.
          </p>
        </div>
        <div className="mt-2 xs:mt-3 md:mt-4 lg:mt-4 sm:mt-0">
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center px-2.5 xs:px-3 md:px-4 lg:px-4 py-1.5 xs:py-2 md:py-2 lg:py-2 border border-transparent rounded-md shadow-sm text-[10px] xs:text-xs md:text-sm lg:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-4 md:w-4 lg:h-4 lg:w-4 mr-1 xs:mr-1.5 md:mr-2 lg:mr-2" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-2.5 xs:p-3 md:p-4 lg:p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 xs:pl-3 md:pl-3 lg:pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 lg:h-5 lg:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-8 xs:pl-9 md:pl-10 lg:pl-10 pr-2.5 xs:pr-3 md:pr-3 lg:pr-3 py-1.5 xs:py-2 md:py-2 lg:py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-[10px] xs:text-xs md:text-sm lg:text-sm"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-2.5 xs:px-3 md:px-4 lg:px-4 py-3 xs:py-4 md:py-5 lg:py-5 sm:py-6">
          <div className="grid grid-cols-1 gap-2.5 xs:gap-3 md:gap-4 lg:gap-4 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-2.5 xs:p-3 md:p-4 lg:p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2 xs:mb-2.5 md:mb-3 lg:mb-3">
                  <div className="w-8 h-8 xs:w-10 xs:h-10 md:w-12 md:h-12 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 lg:h-6 lg:w-6 text-blue-600" />
                  </div>
                  <div className="flex space-x-0.5 xs:space-x-1 md:space-x-1 lg:space-x-1">
                    <Link
                      href={`/dashboard/customers/${customer.id}/edit`}
                      className="p-1 xs:p-1 md:p-1 lg:p-1 text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-4 md:w-4 lg:h-4 lg:w-4" />
                    </Link>
                    <button 
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="p-1 xs:p-1 md:p-1 lg:p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-4 md:w-4 lg:h-4 lg:w-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-sm xs:text-base md:text-lg lg:text-lg font-medium text-gray-900 mb-1.5 xs:mb-2 md:mb-2 lg:mb-2">{customer.name}</h3>
                
                <div className="space-y-1.5 xs:space-y-2 md:space-y-2 lg:space-y-2 mb-2 xs:mb-2.5 md:mb-3 lg:mb-3">
                  <div className="flex items-center text-[10px] xs:text-xs md:text-sm lg:text-sm text-gray-600">
                    <PhoneIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-4 md:w-4 lg:h-4 lg:w-4 mr-1.5 xs:mr-2 md:mr-2 lg:mr-2" />
                    <span className="truncate">{customer.phone}</span>
                  </div>
                  <div className="flex items-center text-[10px] xs:text-xs md:text-sm lg:text-sm text-gray-600">
                    <EnvelopeIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-4 md:w-4 lg:h-4 lg:w-4 mr-1.5 xs:mr-2 md:mr-2 lg:mr-2" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-2 xs:pt-2.5 md:pt-3 lg:pt-3 space-y-1.5 xs:space-y-2 md:space-y-2 lg:space-y-2">
                  <div className="flex justify-between text-[10px] xs:text-xs md:text-sm lg:text-sm">
                    <span className="text-gray-600">Orders:</span>
                    <span className="font-medium text-gray-900">{customer._count.sales}</span>
                  </div>
                  <div className="flex justify-between text-[10px] xs:text-xs md:text-sm lg:text-sm">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="text-gray-900">
                      {formatRelativeTime(customer.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No customers found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or add a new customer</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="text-lg font-medium text-gray-900">{customers.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Customers</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {customers.filter(c => c._count.sales > 0).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {customers.reduce((sum, c) => sum + c._count.sales, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatRelativeTime } from '@/lib/utils'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  createdAt: string
  totalSpent: number
  orderCount: number
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { addNotification } = useNotifications()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Customer>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCustomer()
  }, [customerId])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer({
          id: data.id,
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          createdAt: data.createdAt,
          totalSpent: 0, // Will be calculated from sales
          orderCount: data._count.sales
        })
      } else {
        setError('Customer not found')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      setError('Failed to fetch customer')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (!customer) return
    
    setEditForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      zipCode: customer.zipCode || ''
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({})
    setError('')
  }

  const handleSaveEdit = async () => {
    if (!customer) return
    
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const updatedCustomer = await response.json()
        setCustomer({
          ...customer,
          ...updatedCustomer
        })
        setIsEditing(false)
        setEditForm({})
        addNotification({
          type: 'success',
          title: 'Customer Updated',
          message: 'Customer information has been updated successfully.',
          duration: 4000
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update customer')
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: errorData.error || 'Failed to update customer',
          duration: 5000
        })
      }
    } catch (err) {
      setError('Failed to update customer. Please try again.')
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update customer. Please try again.',
        duration: 5000
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof Customer, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleDelete = async () => {
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
          onClick: () => performDelete(),
          variant: 'danger'
        }
      ]
    })
  }

  const performDelete = async () => {

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Customer Deleted',
          message: 'Customer has been deleted successfully.',
          duration: 4000
        })
        router.push('/dashboard/customers')
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
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete customer. Please try again.',
        duration: 5000
        })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Customer not found</h2>
        <p className="mt-2 text-gray-600">The customer you&apos;re looking for doesn&apos;t exist.</p>
        <button
          onClick={() => router.push('/dashboard/customers')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Customers
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
            onClick={() => router.push('/dashboard/customers')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="mt-2 text-sm text-gray-700">
              Customer details and purchase history
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editForm.name?.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Customer Information
          </h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editForm.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={editForm.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={editForm.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={editForm.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={editForm.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={editForm.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    value={editForm.zipCode || ''}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{customer.name}</h4>
                  <p className="text-sm text-gray-500">Customer ID: {customer.id}</p>
                </div>
              </div>

              <div className="space-y-3">
                {customer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {customer.phone}
                  </div>
                )}
                
                {customer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {customer.email}
                  </div>
                )}
                
                {(customer.address || customer.city || customer.state || customer.zipCode) && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      {customer.address && <div>{customer.address}</div>}
                      {(customer.city || customer.state || customer.zipCode) && (
                        <div>
                          {[customer.city, customer.state, customer.zipCode].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  Member since {formatRelativeTime(customer.createdAt)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
              Total Spent
            </h3>
            <p className="text-3xl font-bold text-green-600">
              ${customer.totalSpent.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Lifetime value</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
              Orders
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {customer.orderCount}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total orders</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Orders
          </h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Order history will be displayed here</p>
            <p className="text-sm text-gray-400 mt-1">Coming soon with sales integration</p>
          </div>
        </div>
      </div>
    </div>
  )
}

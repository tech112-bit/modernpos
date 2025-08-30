'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatRelativeTime } from '@/lib/utils'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import AdminRouteGuard from '@/components/AdminRouteGuard'

interface User {
  id: string
  email: string
  role: string
  createdAt: string
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [currentUser])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        addNotification({
          type: 'error',
          title: 'Failed to fetch users',
          message: 'Unable to load user list',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to server',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const UsersContent = () => {
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
            <h1 className="text-lg xs:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 xs:mt-2 md:mt-3 text-xs xs:text-sm md:text-base text-gray-700">
              Manage system users and roles.
            </p>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 xs:px-5 md:px-6 py-4 xs:py-5 md:py-6">
            <h3 className="text-base xs:text-lg md:text-xl font-medium text-gray-900 mb-4">System Users</h3>
            
            {users.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 xs:px-4 md:px-6 py-3 text-left text-xs xs:text-sm font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-3 xs:px-4 md:px-6 py-3 text-left text-xs xs:text-sm font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                             <th className="px-3 xs:px-4 md:px-6 py-3 text-left text-xs xs:text-sm font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-3 xs:px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3 xs:ml-4">
                              <div className="text-xs xs:text-sm font-medium text-gray-900">{user.email}</div>
                              <div className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 xs:px-4 md:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                            user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                                                 <td className="px-3 xs:px-4 md:px-6 py-4 whitespace-nowrap text-xs xs:text-sm text-gray-500">
                           {formatRelativeTime(user.createdAt)}
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }



  return (
    <AdminRouteGuard>
      <UsersContent />
      
      
    </AdminRouteGuard>
  )
}

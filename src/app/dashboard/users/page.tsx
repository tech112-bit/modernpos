'use client'

import { useAuth } from '@/contexts/AuthContext'
import { formatRelativeTime } from '@/lib/utils'
import { LoadingSpinner, Card, ErrorMessageCard } from '@/components/ui'
import { useSmartDataFetching } from '@/hooks'
import { listUsers } from '@/actions/users'
import { 
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import { type User, type UsersApiResponse } from '@/types/user'

export default function UsersPage() {
  const { user: currentUser } = useAuth()

  // Use smart data fetching with caching
  const { 
    data: usersData, 
    loading, 
    error 
  } = useSmartDataFetching<User[]>({
    cacheKey: 'users:list',
    fetcher: ({ signal }) => listUsers(signal),
    autoFetch: currentUser?.role === 'ADMIN',
    cacheDuration: 300000, // Cache for 5 minutes
    debounceDelay: 500, // Debounce API calls
    transform: (data: unknown) => (data as UsersApiResponse).users || []
  })

  const users = usersData || []

  const UsersContent = () => {
    if (loading) {
      return <LoadingSpinner />
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-500 sm:text-base">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{users.length}</p>
              </div>
            </div>
          </Card>

          <Card className="hidden sm:block">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-base font-medium text-gray-500">Admin Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
            </div>
          </Card>

          <Card className="hidden sm:block">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-base font-medium text-gray-500">Regular Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role !== 'ADMIN').length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Error Message */}
        {error && <ErrorMessageCard message={error} />}

        {/* Users List */}
        <Card className="overflow-hidden">
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
                          {formatRelativeTime(new Date(user.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <AdminRouteGuard>
      <UsersContent />
    </AdminRouteGuard>
  )
}

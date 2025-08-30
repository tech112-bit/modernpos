'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useSettings } from '@/contexts/SettingsContext'

import QuickSearch from '@/components/QuickSearch'
import CurrencySelector from '@/components/CurrencySelector'
import LowStockAlert from '@/components/LowStockAlert'


import {
  PlusIcon,
  ShoppingCartIcon,
  CubeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TagIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  todaySales: number
  totalProducts: number
  totalCustomers: number
  totalCategories: number
  lowStockProducts: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const { settings } = useSettings()
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalCategories: 0,
    lowStockProducts: 0
  })
  const [loading, setLoading] = useState(true)


  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (!authLoading && user?.role === 'ADMIN') {
      router.push('/dashboard/admin')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Only fetch stats if user is not admin
    if (!authLoading && user && user.role !== 'ADMIN') {
      fetchDashboardStats()
    }
  }, [user, authLoading])

  // Refresh data when page becomes visible (e.g., returning from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !authLoading && user && user.role !== 'ADMIN') {
        fetchDashboardStats()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, authLoading])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }



  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard data (this already includes filtered counts)
      const dashboardResponse = await fetch('/api/dashboard')
      const dashboardData = dashboardResponse.ok ? await dashboardResponse.json() : {}
      
             // Use the filtered data from dashboard API
       const totalProducts = dashboardData.totals?.products || 0
       const totalCustomers = dashboardData.totals?.customers || 0
       const totalCategories = dashboardData.totals?.categories || 0
       const todaySales = dashboardData.today?.revenue || 0
       const lowStockProducts = dashboardData.lowStockCount || 0
       
       setStats({
         todaySales,
         totalProducts,
         totalCustomers,
         totalCategories,
         lowStockProducts
       })
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      addNotification({
        type: 'error',
        title: 'Dashboard Error',
        message: 'Failed to load dashboard statistics. Some data may be outdated.',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // Show redirect message for admin users
  if (user?.role === 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <ShieldCheckIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Admin Dashboard</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      name: 'New Sale',
      href: '/dashboard/sales/new',
      icon: ShoppingCartIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Start a new transaction'
    },
    {
      name: 'Add Product',
      href: '/dashboard/products/new',
      icon: PlusIcon,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Add new product to inventory'
    },
    {
      name: 'Manage Categories',
      href: '/dashboard/categories',
      icon: TagIcon,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Organize product categories'
    },
    {
      name: 'New Category',
      href: '/dashboard/categories/new',
      icon: PlusIcon,
      color: 'bg-teal-500 hover:bg-teal-600',
      description: 'Create new product category'
    },
    {
      name: 'View Reports',
      href: '/dashboard/reports',
      icon: ChartBarIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Check sales analytics'
    },
    {
      name: 'Manage Stock',
      href: '/dashboard/products',
      icon: CubeIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Update product inventory'
    }
  ]

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
           <h1 className="text-xl xs:text-2xl font-bold text-gray-900">Dashboard</h1>
           <p className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-700">
             Welcome back! Here&apos;s what&apos;s happening with your business today.
           </p>
         </div>
         
         
         
                   <div className="mt-3 xs:mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 xs:space-y-3 sm:space-y-0 sm:space-x-2 md:space-x-3">
                         {/* Mobile S (320px) - Three column layout with long press text */}
             <div className="grid grid-cols-3 gap-1.5 sm:hidden">
               <div className="flex justify-center">
                 <button
                   onClick={fetchDashboardStats}
                   disabled={loading}
                   className="group relative inline-flex items-center justify-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                   title="Refresh Dashboard"
                 >
                   {loading ? (
                     <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-500"></div>
                   ) : (
                     <ArrowPathIcon className="h-3.5 w-3.5" />
                   )}
                   {/* Long press text overlay */}
                   <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                     Refresh
                   </div>
                 </button>
               </div>
               <div className="flex justify-center">
                 <Link
                   href="/dashboard/sales/new"
                   className="group relative inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent rounded-md shadow-sm text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                 >
                   <ShoppingCartIcon className="h-3.5 w-3.5" />
                   {/* Long press text overlay */}
                   <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                     New Sale
                   </div>
                 </Link>
               </div>
               <div className="flex justify-center">
                 <div className="flex-shrink-0">
                   <CurrencySelector />
                 </div>
               </div>
             </div>
            
                                     {/* Tablet (768px) - Medium buttons with refresh icon from reports */}
            <div className="hidden sm:flex md:hidden items-center space-x-2">
              <button
                onClick={fetchDashboardStats}
                disabled={loading}
                className="group relative inline-flex items-center justify-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                title="Refresh Dashboard"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : (
                  <ArrowPathIcon className="h-4 w-4" />
                )}
                {/* Hover tooltip for tablet */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Refresh Dashboard
                </div>
              </button>
              <Link
                href="/dashboard/sales/new"
                className="group relative inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ShoppingCartIcon className="h-4 w-4" />
                {/* Hover tooltip for tablet */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Create New Sale
                </div>
              </Link>
              <div className="flex-shrink-0">
                <CurrencySelector />
              </div>
            </div>
            
            {/* Desktop (1024px+) - Full buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={fetchDashboardStats}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <Link
                href="/dashboard/sales/new"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ShoppingCartIcon className="h-4 w-4" />
              </Link>
              <div className="flex-shrink-0">
                <CurrencySelector />
              </div>
            </div>
          </div>
       </div>

                     {/* Quick Search */}
        <div className="w-full max-w-lg">
          <QuickSearch />
        </div>

        {/* Low Stock Alert - Only for non-admin users */}
        {user && user.role !== 'ADMIN' && <LowStockAlert />}

             {/* Stats Grid */}
       <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
                 <div className="bg-white overflow-hidden shadow rounded-lg">
           <div className="p-3 xs:p-4 sm:p-5">
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 <ArrowTrendingUpIcon className="h-5 w-5 xs:h-6 xs:w-6 text-green-400" />
               </div>
               <div className="ml-3 xs:ml-4 sm:ml-5 w-0 flex-1">
                 <dl>
                   <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Today&apos;s Sales</dt>
                   <dd className="text-base xs:text-lg font-medium text-gray-900">{formatCurrency(stats.todaySales)}</dd>
                 </dl>
               </div>
             </div>
           </div>
         </div>

                 <div className="bg-white overflow-hidden shadow rounded-lg">
           <div className="p-3 xs:p-4 sm:p-5">
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 <CubeIcon className="h-5 w-5 xs:h-6 xs:w-6 text-blue-400" />
               </div>
               <div className="ml-3 xs:ml-4 sm:ml-5 w-0 flex-1">
                 <dl>
                   <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Total Products</dt>
                   <dd className="text-base xs:text-lg font-medium text-gray-900">{stats.totalProducts}</dd>
                 </dl>
               </div>
             </div>
           </div>
         </div>



                 <div className="bg-white overflow-hidden shadow rounded-lg">
           <div className="p-3 xs:p-4 sm:p-5">
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 <ArrowTrendingUpIcon className="h-5 w-5 xs:h-6 xs:w-6 text-purple-400" />
               </div>
               <div className="ml-3 xs:ml-4 sm:ml-5 w-0 flex-1">
                 <dl>
                   <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Customers</dt>
                   <dd className="text-base xs:text-lg font-medium text-gray-900">{stats.totalCustomers}</dd>
                 </dl>
               </div>
             </div>
           </div>
         </div>

                                                                       <div className="bg-white overflow-hidden shadow rounded-lg">
             <div className="p-3 xs:p-4 sm:p-5">
               <div className="flex items-center">
                 <div className="flex-shrink-0">
                   <TagIcon className="h-5 w-5 xs:h-6 xs:w-6 text-indigo-400" />
                 </div>
                 <div className="ml-3 xs:ml-4 sm:ml-5 w-0 flex-1">
                   <dl>
                     <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Categories</dt>
                     <dd className="text-base xs:text-lg font-medium text-gray-900">{stats.totalCategories}</dd>
                   </dl>
                 </div>
               </div>
             </div>
           </div>

          {/* Low Stock Alert - Only for non-admin users with notifications enabled */}
          {user && user.role !== 'ADMIN' && settings.notifications.lowStock && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-3 xs:p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 xs:h-6 xs:w-6 text-orange-400" />
                  </div>
                  <div className="ml-3 xs:ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                      <dd className="text-base xs:text-lg font-medium text-gray-900">{stats.lowStockProducts}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

             {/* Quick Actions */}
       <div className="bg-white shadow rounded-lg">
         <div className="px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6">
           <h3 className="text-base xs:text-lg leading-6 font-medium text-gray-900 mb-3 xs:mb-4">
             Quick Actions
           </h3>
           <div className="grid grid-cols-1 gap-2 xs:gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickActions.map((action) => (
                             <Link
                 key={action.name}
                 href={action.href}
                 className="relative group bg-white p-2.5 xs:p-3 sm:p-4 md:p-5 lg:p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
               >
                 <div>
                   <span className={`inline-flex p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-lg ${action.color} text-white`}>
                     <action.icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                   </span>
                 </div>
                 <div className="mt-1.5 xs:mt-2 sm:mt-3 md:mt-4">
                   <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-medium">
                     <span className="absolute inset-0" aria-hidden="true" />
                     {action.name}
                   </h3>
                   <p className="mt-1 xs:mt-1.5 sm:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500">
                     {action.description}
                   </p>
                 </div>
               </Link>
            ))}
          </div>
        </div>
      </div>

             {/* Recent Activity */}
       <div className="bg-white shadow rounded-lg">
         <div className="px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6">
           <h3 className="text-base xs:text-lg leading-6 font-medium text-gray-900 mb-3 xs:mb-4">
             Recent Activity
           </h3>
           <div className="text-center py-6 xs:py-8 text-gray-500">
             <p className="text-sm xs:text-base">No recent activity to display</p>
             <p className="text-xs xs:text-sm mt-1">Start making sales to see activity here</p>
           </div>
         </div>
       </div>
       
       
    </div>
  )
}

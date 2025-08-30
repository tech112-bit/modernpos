'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatRelativeTime } from '@/lib/utils'
import SalesTrendChart from '@/components/SalesTrendChart'
import {
  CalendarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ChartBarSquareIcon
} from '@heroicons/react/24/outline'

interface SalesData {
  date: string
  total: number
  count: number
}

interface ProductSales {
  name: string
  quantity: number
  revenue: number
}

interface PaymentBreakdown {
  method: string
  amount: number
  count: number
}

interface ReportData {
  period: string
  salesData: SalesData[]
  topProducts: ProductSales[]
  paymentBreakdown: PaymentBreakdown[]
  summary: {
    totalRevenue: number
    totalSales: number
    averageOrderValue: number
  }
}

export default function ReportsPage() {
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Fetch report data when period changes
  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      console.log(`Fetching report data for period: ${selectedPeriod}`)
      const response = await fetch(`/api/reports/sales?period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Received report data:', data)
        setReportData(data)
      } else {
        const errorText = await response.text()
        console.error('API response error:', response.status, errorText)
        throw new Error(`Failed to fetch report data: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      addNotification({
        type: 'error',
        title: 'Fetch Failed',
        message: 'Failed to fetch report data. Please try again.',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ]

  const handlePeriodChange = (period: 'today' | 'week' | 'month') => {
    setSelectedPeriod(period)
  }

  const handleRefresh = () => {
    fetchReportData()
    addNotification({
      type: 'success',
      title: 'Refreshed',
      message: 'Reports data has been refreshed.',
      duration: 3000
    })
  }

  const handleExportReport = async () => {
    if (!reportData) return
    
    setExporting(true)
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create CSV content with real data
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      
      const csvContent = [
        ['Date', 'Total Sales', 'Number of Transactions', 'Revenue'],
        ...reportData.salesData.map(day => [
          day.date,
          day.count.toString(),
          formatCurrency(day.total)
        ]),
        ['', '', ''],
        ['Summary', '', ''],
        ['Total Revenue', '', formatCurrency(reportData.summary.totalRevenue)],
        ['Total Sales', reportData.summary.totalSales.toString(), ''],
        ['Average Order Value', '', formatCurrency(reportData.summary.averageOrderValue)],
        ['', '', ''],
        ['Report Generated', currentDate, ''],
        ['Period', selectedPeriod, '']
      ].map(row => row.join(',')).join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-report-${selectedPeriod}-${currentDate.replace(/\//g, '-')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      addNotification({
        type: 'success',
        title: 'Report Exported',
        message: `Sales report for ${selectedPeriod} has been exported successfully.`,
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export the sales report. Please try again.',
        duration: 5000
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No Data Available</h2>
        <p className="mt-2 text-gray-600">No sales data found for the selected period.</p>
        <button
          onClick={handleRefresh}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>
    )
  }

  // Early return if no data
  if (!reportData) {
    return (
      <div className="space-y-3 xs:space-y-4 md:space-y-5 lg:space-y-6">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-center h-32">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading reports...</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-500">No report data available</p>
                <button 
                  onClick={fetchReportData}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const { salesData, topProducts, paymentBreakdown, summary } = reportData
  const { totalRevenue, totalSales, averageOrderValue } = summary

  return (
    <div className="space-y-3 xs:space-y-4 md:space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base xs:text-lg md:text-xl lg:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 xs:mt-1.5 md:mt-2 lg:mt-3 text-[10px] xs:text-xs md:text-sm lg:text-base text-gray-700">
            Track your sales performance and business insights.
          </p>
        </div>
        <div className="mt-2 xs:mt-3 md:mt-4 lg:mt-6 sm:mt-0">
          {/* Mobile S (320px) - Two column layout with long press text */}
          <div className="grid grid-cols-2 gap-2 xs:gap-2.5 md:hidden">
            <button 
              onClick={handleRefresh}
              className="group relative inline-flex items-center justify-center px-2 xs:px-2.5 py-1 xs:py-1.5 border border-gray-300 rounded-md shadow-sm text-[10px] xs:text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Refresh Reports"
            >
              <ArrowPathIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
              {/* Long press text overlay */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] xs:text-[10px] rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Refresh
              </div>
            </button>
            <button 
              onClick={handleExportReport}
              disabled={exporting}
              className="group relative inline-flex items-center justify-center px-2 xs:px-2.5 py-1 xs:py-1.5 border border-gray-300 rounded-md shadow-sm text-[10px] xs:text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title={exporting ? 'Exporting...' : 'Export Report'}
            >
              <ArrowDownTrayIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
              {/* Long press text overlay */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] xs:text-[10px] rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {exporting ? 'Exporting...' : 'Export Report'}
              </div>
            </button>
          </div>
          
          {/* Tablet (768px) - Two column layout with long press text */}
          <div className="hidden md:flex lg:hidden">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleRefresh}
                className="group relative inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Refresh Reports"
              >
                <ArrowPathIcon className="h-4 w-4" />
                {/* Long press text overlay */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Refresh
                </div>
              </button>
              <button 
                onClick={handleExportReport}
                disabled={exporting}
                className="group relative inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title={exporting ? 'Exporting...' : 'Export Report'}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {/* Long press text overlay */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {exporting ? 'Exporting...' : 'Export Report'}
                </div>
              </button>
            </div>
          </div>
         
         {/* Desktop (1024px+) - Full buttons with text */}
         <div className="hidden lg:flex items-center space-x-4">
           <button 
             onClick={handleRefresh}
             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
           >
             <ArrowPathIcon className="h-4 w-4 mr-2" />
             Refresh
           </button>
           <button 
             onClick={handleExportReport}
             disabled={exporting}
             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
             {exporting ? 'Exporting...' : 'Export Report'}
           </button>
         </div>
       </div>
     </div>

     {/* Period Selector */}
     <div className="bg-white shadow rounded-lg p-2 xs:p-3 md:p-4 lg:p-5">
       <div className="flex space-x-1 xs:space-x-1.5 md:space-x-2 lg:space-x-3">
         {periods.map((period) => (
           <button
             key={period.value}
             onClick={() => handlePeriodChange(period.value as 'today' | 'week' | 'month')}
             className={`px-2 xs:px-2.5 md:px-4 lg:px-5 py-1 xs:py-1.5 md:py-2 lg:py-2.5 text-[10px] xs:text-xs md:text-sm lg:text-base font-medium rounded-md transition-colors ${
               selectedPeriod === period.value
                 ? 'bg-blue-600 text-white'
                 : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
             }`}
           >
             {period.label}
           </button>
         ))}
       </div>
     </div>

     {/* Chart Type Selector */}
     <div className="bg-white shadow rounded-lg p-2 xs:p-3 md:p-4 lg:p-5">
       <div className="flex items-center justify-between">
         <div className="flex items-center space-x-2">
           <ChartBarIcon className="h-4 w-4 text-gray-500" />
           <span className="text-sm font-medium text-gray-700">Chart Type</span>
         </div>
         <div className="flex space-x-1 xs:space-x-1.5 md:space-x-2 lg:space-x-3">
           <button
             onClick={() => setChartType('line')}
             className={`px-2 xs:px-2.5 md:px-4 lg:px-5 py-1 xs:py-1.5 md:py-2 lg:py-2.5 text-[10px] xs:text-xs md:text-sm lg:text-base font-medium rounded-md transition-colors flex items-center space-x-1 ${
               chartType === 'line'
                 ? 'bg-blue-600 text-white'
                 : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
             }`}
           >
             <ChartBarSquareIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 md:h-4 md:w-4" />
             <span>Line</span>
           </button>
           <button
             onClick={() => setChartType('bar')}
             className={`px-2 xs:px-2.5 md:px-4 lg:px-5 py-1 xs:py-1.5 md:py-2 lg:py-2.5 text-[10px] xs:text-xs md:text-sm lg:text-base font-medium rounded-md transition-colors flex items-center space-x-1 ${
               chartType === 'bar'
                 ? 'bg-blue-600 text-white'
                 : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
             }`}
           >
             <ChartBarIcon className="h-3 w-3 xs:h-3.5 xs:w-3.5 md:h-4 md:w-4" />
             <span>Bar</span>
           </button>
         </div>
       </div>
     </div>

     {/* Key Metrics */}
     <div className="grid grid-cols-1 gap-2 xs:gap-3 md:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4">
       <div className="bg-white overflow-hidden shadow rounded-lg">
         <div className="p-2 xs:p-3 md:p-4 lg:p-5">
           <div className="flex items-center">
             <div className="flex-shrink-0">
               <CurrencyDollarIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-green-400" />
             </div>
             <div className="ml-2 xs:ml-3 md:ml-4 lg:ml-5 w-0 flex-1">
               <dl>
                 <dt className="text-[10px] xs:text-xs md:text-sm lg:text-base font-medium text-gray-500 truncate">Total Revenue</dt>
                 <dd className="text-xs xs:text-sm md:text-lg lg:text-xl font-medium text-gray-900">{formatCurrency(totalRevenue)}</dd>
               </dl>
             </div>
           </div>
         </div>
       </div>

       <div className="bg-white overflow-hidden shadow rounded-lg">
         <div className="p-2 xs:p-3 md:p-4 lg:p-5">
           <div className="flex items-center">
             <div className="flex-shrink-0">
               <ShoppingBagIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-400" />
             </div>
             <div className="ml-2 xs:ml-3 md:ml-4 lg:ml-5 w-0 flex-1">
               <dl>
                 <dt className="text-[10px] xs:text-xs md:text-sm lg:text-base font-medium text-gray-500 truncate">Total Sales</dt>
                 <dd className="text-xs xs:text-sm md:text-lg lg:text-xl font-medium text-gray-900">{totalSales}</dd>
               </dl>
             </div>
           </div>
         </div>
       </div>

       <div className="bg-white overflow-hidden shadow rounded-lg">
         <div className="p-2 xs:p-3 md:p-4 lg:p-5">
           <div className="flex items-center">
             <div className="flex-shrink-0">
               <ArrowTrendingUpIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-purple-400" />
             </div>
             <div className="ml-2 xs:ml-3 md:ml-4 lg:ml-5 w-0 flex-1">
               <dl>
                 <dt className="text-[10px] xs:text-xs md:text-sm lg:text-base font-medium text-gray-500 truncate">Avg Order Value</dt>
                 <dd className="text-xs xs:text-sm md:text-lg lg:text-xl font-medium text-gray-900">{formatCurrency(averageOrderValue)}</dd>
               </dl>
             </div>
           </div>
         </div>
       </div>

       <div className="bg-white overflow-hidden shadow rounded-lg">
         <div className="p-2 xs:p-3 md:p-4 lg:p-5">
           <div className="flex items-center">
             <div className="flex-shrink-0">
               <CalendarIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-orange-400" />
             </div>
             <div className="ml-2 xs:ml-3 md:ml-4 lg:ml-5 w-0 flex-1">
               <dl>
                 <dt className="text-[10px] xs:text-xs md:text-sm lg:text-base font-medium text-gray-500 truncate">Period</dt>
                 <dd className="text-xs xs:text-sm md:text-lg lg:text-xl font-medium text-gray-900 capitalize">{selectedPeriod}</dd>
               </dl>
             </div>
           </div>
         </div>
       </div>
     </div>

     {/* Sales Trend Chart */}
     <div className="bg-white shadow rounded-lg">
       <div className="px-3 xs:px-4 md:px-5 lg:px-6 py-3 xs:py-4 md:py-5 lg:py-6">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-[10px] xs:text-xs md:text-base lg:text-xl leading-6 font-medium text-gray-900">
             Sales Trend Chart
           </h3>
           <div className="flex items-center space-x-2 text-xs text-gray-500">
             <div className="flex items-center space-x-1">
               <div className="w-3 h-3 bg-blue-500 rounded"></div>
               <span>Revenue</span>
             </div>
             <div className="flex items-center space-x-1">
               <div className="w-3 h-3 bg-green-500 rounded"></div>
               <span>Sales Count</span>
             </div>
           </div>
         </div>
         
         {salesData && salesData.length > 0 ? (
           <SalesTrendChart 
             data={salesData} 
             period={selectedPeriod} 
             chartType={chartType}
           />
         ) : (
           <div className="h-80 flex items-center justify-center">
             <div className="text-center">
               <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                 <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                 </svg>
               </div>
               <p className="text-gray-500 text-sm">No sales data available for {selectedPeriod}</p>
               <p className="text-gray-400 text-xs mt-1">Try selecting a different time period</p>
             </div>
           </div>
         )}
       </div>
     </div>

    {/* Top Products */}
    <div className="bg-white shadow rounded-lg">
      <div className="px-3 xs:px-4 md:px-5 lg:px-6 py-3 xs:py-4 md:py-5 lg:py-6">
        <h3 className="text-sm xs:text-base md:text-lg lg:text-xl leading-6 font-medium text-gray-900 mb-3 xs:mb-4 md:mb-4 lg:mb-5">
          Top Selling Products
        </h3>
        {topProducts.length > 0 ? (
          <div className="space-y-2.5 xs:space-y-3 md:space-y-3.5 lg:space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-2.5 xs:p-3 md:p-3 lg:p-3.5 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 xs:w-7 xs:h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs xs:text-sm md:text-sm lg:text-base">
                    {index + 1}
                  </div>
                  <div className="ml-2.5 xs:ml-3 md:ml-3 lg:ml-3.5">
                    <h4 className="text-xs xs:text-sm md:text-sm lg:text-base font-medium text-gray-900">{product.name}</h4>
                    <p className="text-xs xs:text-xs md:text-xs lg:text-sm text-gray-500">{product.quantity} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs xs:text-sm md:text-sm lg:text-base font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs xs:text-xs md:text-xs lg:text-sm text-gray-500">{((product.revenue / totalRevenue) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No product sales data available for {selectedPeriod}
          </p>
        )}
      </div>
    </div>

    {/* Payment Methods */}
    <div className="bg-white shadow rounded-lg">
      <div className="px-3 xs:px-4 md:px-5 lg:px-6 py-3 xs:py-4 md:py-5 lg:py-6">
        <h3 className="text-sm xs:text-base md:text-lg lg:text-xl leading-6 font-medium text-gray-900 mb-3 xs:mb-4 md:mb-4 lg:mb-5">
          Payment Methods
        </h3>
        {paymentBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xs:gap-4 md:gap-4 lg:gap-5">
            {paymentBreakdown.map((item) => {
              const percentage = totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0
              const color = item.method === 'Cash' ? 'bg-green-500' : item.method === 'Card' ? 'bg-blue-500' : 'bg-purple-500'
              
              return (
                <div key={item.method} className="text-center">
                  <div className={`w-12 h-12 xs:w-14 xs:h-14 md:w-16 md:h-16 ${color} rounded-full mx-auto mb-2 xs:mb-2.5 md:mb-3 lg:mb-3.5 flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm xs:text-base md:text-base lg:text-lg">{percentage.toFixed(1)}%</span>
                  </div>
                  <h4 className="text-xs xs:text-sm md:text-sm lg:text-base font-medium text-gray-900">{item.method}</h4>
                  <p className="text-sm xs:text-base md:text-lg lg:text-xl font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                  <p className="text-xs xs:text-xs md:text-xs lg:text-sm text-gray-500">{item.count} transactions</p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No payment method data available for {selectedPeriod}
          </p>
        )}
      </div>
    </div>
  </div>
  )
}

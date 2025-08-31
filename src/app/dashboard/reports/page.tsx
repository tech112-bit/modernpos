'use client'

import { useState, useMemo, useEffect } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useSmartDataFetching } from '@/hooks'
import { LoadingSpinner, Card } from '@/components/ui'
import SalesTrendChart from '@/components/SalesTrendChart'
import { 
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

interface ReportData {
  period: string
  salesData: Array<{
    date: string
    total: number
    count: number
  }>
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  paymentBreakdown: Array<{
    method: string
    amount: number
    count: number
  }>
  summary: {
    totalRevenue: number
    totalSales: number
    averageOrderValue: number
  }
}

interface ReportsApiResponse extends ReportData {}

export default function ReportsPage() {
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  // Use smart data fetching with caching
  const { 
    data: reportData, 
    loading, 
    error,
    refetch: fetchReportData 
  } = useSmartDataFetching<ReportsApiResponse>({
    endpoint: `/api/reports/sales?period=${selectedPeriod}`,
    autoFetch: true,
    cacheDuration: 300000, // Cache for 5 minutes
    debounceDelay: 500, // Debounce API calls
    onError: (errorMessage: string) => {
      addNotification({
        type: 'error',
        title: 'Fetch Failed',
        message: 'Failed to fetch report data. Please try again.',
        duration: 5000
      })
    }
  })

  // Debug: Log the API response
  console.log('Reports API Response:', reportData)
  console.log('Reports API Endpoint:', `/api/reports/sales?period=${selectedPeriod}`)
  console.log('Loading state:', loading)
  console.log('Error state:', error)

  // Monitor data changes
  useEffect(() => {
    console.log('useEffect - reportData changed:', reportData)
    if (reportData) {
      console.log('Data structure:', {
        hasSalesData: !!reportData.salesData,
        salesDataLength: reportData.salesData?.length,
        salesDataKeys: reportData.salesData?.[0] ? Object.keys(reportData.salesData[0]) : []
      })
    }
  }, [reportData])

  // Memoize processed data to prevent recalculation
  const processedData = useMemo(() => {
    if (!reportData || !reportData.salesData || reportData.salesData.length === 0) {
      console.log('No processed data because:', {
        hasReportData: !!reportData,
        hasSalesData: !!(reportData?.salesData),
        salesDataLength: reportData?.salesData?.length || 0
      })
      return null
    }
    
    console.log('Processing report data:', reportData)
    console.log('salesData:', reportData.salesData)
    
    return {
      ...reportData,
      chartData: reportData.salesData.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        total: item.total,
        count: item.count
      }))
    }
  }, [reportData])

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
    if (!processedData) return

    try {
      const csvContent = generateCSV(processedData)
      downloadCSV(csvContent, `sales-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`)
      
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Report has been exported successfully.',
        duration: 3000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export report. Please try again.',
        duration: 5000
      })
    }
  }

  const generateCSV = (data: ReportData) => {
    const headers = ['Date', 'Revenue', 'Sales Count']
    const rows = data.salesData.map(item => [
      item.date,
      item.total.toString(),
      item.count.toString()
    ])
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Error Loading Reports</h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </Card>
    )
  }

  // Show data even if there's no sales data but we have the summary
  if (!processedData && reportData && reportData.summary) {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card className="bg-blue-50 border-blue-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(reportData.summary.totalRevenue)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                    <dd className="text-lg font-medium text-gray-900">{reportData.summary.totalSales}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Order Value</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(reportData.summary.averageOrderValue)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* No chart data message */}
        <Card>
          <div className="p-6 text-center">
            <p className="text-gray-500">No detailed sales data available for the selected period</p>
            <p className="text-sm text-gray-400 mt-2">Summary data is shown above</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!processedData) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-500">No report data available</p>
          <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
            <p className="font-medium">Debug Info:</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
            <p>Has reportData: {reportData ? 'Yes' : 'No'}</p>
            {reportData && (
              <>
                <p>Report data keys: {Object.keys(reportData).join(', ')}</p>
                <p>Has salesData: {reportData.salesData ? 'Yes' : 'No'}</p>
                <p>salesData length: {reportData.salesData?.length || 0}</p>
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {JSON.stringify(reportData, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="mt-2 text-sm text-gray-700">
            Analyze your sales performance and trends
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Period Selector */}
          <div className="flex rounded-md shadow-sm">
            {periods.map((period, index) => (
              <button
                key={period.value}
                onClick={() => handlePeriodChange(period.value as 'today' | 'week' | 'month')}
                className={`px-4 py-2 text-sm font-medium ${
                  selectedPeriod === period.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${
                  index === 0 ? 'rounded-l-md' : ''
                } ${
                  index === periods.length - 1 ? 'rounded-r-md' : ''
                } border border-gray-300`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-2 text-sm font-medium ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } rounded-l-md border border-gray-300`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-2 text-sm font-medium ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } rounded-r-md border border-gray-300`}
            >
              Bar
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={handleExportReport}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                     <dd className="text-lg font-medium text-gray-900">{formatCurrency(processedData.summary.totalRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                                     <dd className="text-lg font-medium text-gray-900">{processedData.summary.totalSales}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Order Value</dt>
                                     <dd className="text-lg font-medium text-gray-900">{formatCurrency(processedData.summary.averageOrderValue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Period</dt>
                  <dd className="text-lg font-medium text-gray-900 capitalize">{selectedPeriod}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Trend</h3>
          <SalesTrendChart 
            data={processedData.chartData}
            period={selectedPeriod}
            chartType={chartType}
          />
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.chartData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useCurrency } from '@/contexts/CurrencyContext'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface SalesData {
  date: string
  total: number
  count: number
}

interface SalesTrendChartProps {
  data: SalesData[]
  period: 'today' | 'week' | 'month'
  chartType?: 'line' | 'bar'
}

export default function SalesTrendChart({ data, period, chartType = 'line' }: SalesTrendChartProps) {
  const { formatCurrency } = useCurrency()

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    // Debug: Log the raw data to see what we're working with
    console.log('SalesTrendChart - Raw data:', data)
    console.log('SalesTrendChart - Period:', period)

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Debug: Log sorted data
    console.log('SalesTrendChart - Sorted data:', sortedData)
    
    // Format labels based on period
    const formatLabel = (dateString: string) => {
      try {
        console.log('Formatting date string:', dateString)
        const date = new Date(dateString)
        console.log('Parsed date object:', date)
        console.log('Date timestamp:', date.getTime())
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date string:', dateString)
          return dateString
        }
        
        let formattedLabel: string
        switch (period) {
          case 'today':
            // For today, check if the date string contains time information
            if (dateString.includes('T') && dateString.includes(':')) {
              // Has time info, format as time
              formattedLabel = date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
              })
            } else {
              // Only date, format as date
              formattedLabel = date.toLocaleDateString('en-US', { 
                month: 'short',
                day: 'numeric'
              })
            }
            break
          case 'week':
            // For week, show day and date
            formattedLabel = date.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })
            break
          case 'month':
            // For month, show month and day
            formattedLabel = date.toLocaleDateString('en-US', { 
              month: 'short',
              day: 'numeric'
            })
            break
          default:
            formattedLabel = date.toLocaleDateString('en-US')
        }
        
        console.log('Formatted label:', formattedLabel)
        return formattedLabel
      } catch (error) {
        console.error('Error formatting date:', dateString, error)
        return dateString
      }
    }



    const baseConfig = {
      labels: sortedData.map(item => formatLabel(item.date)),
      datasets: [
        {
          label: 'Revenue',
          data: sortedData.map(item => item.total),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Sales Count',
          data: sortedData.map(item => item.count),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: false,
          yAxisID: 'y1',
        }
      ]
    }

    if (chartType === 'bar') {
      return {
        ...baseConfig,
        datasets: [
          {
            label: 'Revenue',
            data: sortedData.map(item => item.total),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Sales Count',
            data: sortedData.map(item => item.count),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
            yAxisID: 'y1',
          }
        ]
      }
    }

    return baseConfig
  }, [data, period, chartType])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (tooltipItems: { label: string }[]) => {
            return tooltipItems[0]?.label || ''
          },
          label: (context: { datasetIndex: number; parsed: { y: number } }) => {
            if (context.datasetIndex === 0) {
              return `Revenue: ${formatCurrency(context.parsed.y)}`
            } else {
              return `Sales: ${context.parsed.y} transactions`
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: 'normal' as const
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: 'normal' as const
          },
          callback: function(tickValue: string | number) {
            if (typeof tickValue === 'number') {
              return formatCurrency(tickValue)
            }
            return tickValue
          }
        },
        title: {
          display: true,
          text: 'Revenue',
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: 'normal' as const
          }
        },
        title: {
          display: true,
          text: 'Sales Count',
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      }
    }
  }), [formatCurrency])

  if (!chartData) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No sales data available</p>
          <p className="text-gray-400 text-xs mt-1">Select a different time period or check your data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-80">
      {chartType === 'line' ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  )
}

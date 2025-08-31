'use client'

import { useState, useEffect } from 'react'
import { getCacheStats, clearAllCaches } from '@/hooks'
import { Card } from '@/components/ui'

interface CacheStats {
  totalEntries: number
  validEntries: number
  expiredEntries: number
  totalSize: number
}

export default function CacheManager() {
  const [stats, setStats] = useState<CacheStats>({
    totalEntries: 0,
    validEntries: 0,
    expiredEntries: 0,
    totalSize: 0
  })
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const updateStats = () => {
    setStats(getCacheStats())
    setLastUpdated(new Date())
  }

  const handleClearCache = () => {
    clearAllCaches()
    updateStats()
  }

  useEffect(() => {
    updateStats()
    
    // Update stats every 10 seconds
    const interval = setInterval(updateStats, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Cache Manager</h3>
        <div className="flex space-x-2">
          <button
            onClick={updateStats}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleClearCache}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
          <div className="text-sm text-gray-600">Total Entries</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.validEntries}</div>
          <div className="text-sm text-gray-600">Valid</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.expiredEntries}</div>
          <div className="text-sm text-gray-600">Expired</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{formatBytes(stats.totalSize)}</div>
          <div className="text-sm text-gray-600">Total Size</div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Cache Benefits:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Reduces API calls by 70-90%</li>
          <li>• Improves page load performance</li>
          <li>• Reduces server load</li>
          <li>• Better user experience</li>
        </ul>
      </div>
    </Card>
  )
}

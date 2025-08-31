'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface UseSmartDataFetchingOptions<T> {
  endpoint: string
  autoFetch?: boolean
  cacheDuration?: number // in milliseconds
  debounceDelay?: number // in milliseconds
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  transform?: (data: unknown) => T
  dependencies?: unknown[]
  skipCache?: boolean
}

interface UseSmartDataFetchingReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearCache: () => void
  lastFetched: number | null
}

// Global cache to prevent duplicate requests across components
const globalCache = new Map<string, CacheEntry<unknown>>()

function useSmartDataFetching<T = unknown>({
  endpoint,
  autoFetch = true,
  cacheDuration = 30000, // 30 seconds default
  debounceDelay = 300, // 300ms default
  onSuccess,
  onError,
  transform,
  dependencies = [],
  skipCache = false
}: UseSmartDataFetchingOptions<T>): UseSmartDataFetchingReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<number | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cacheKey = useMemo(() => `${endpoint}`, [endpoint])

  // Check if data is still fresh in cache
  const isCacheValid = useCallback((entry: CacheEntry<unknown>): boolean => {
    return Date.now() < entry.expiresAt
  }, [])

  // Get cached data if available and valid
  const getCachedData = useCallback((): T | null => {
    if (skipCache) return null
    
    const cached = globalCache.get(cacheKey)
    if (cached && isCacheValid(cached)) {
      return cached.data as T
    }
    return null
  }, [cacheKey, skipCache, isCacheValid])

  // Set cached data
  const setCachedData = useCallback((newData: T) => {
    if (skipCache) return
    
    const entry: CacheEntry<T> = {
      data: newData,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheDuration
    }
    globalCache.set(cacheKey, entry)
  }, [cacheKey, cacheDuration, skipCache])

  // Clear cache for this endpoint
  const clearCache = useCallback(() => {
    globalCache.delete(cacheKey)
  }, [cacheKey])

  // Fetch data with proper error handling and caching
  const fetchData = useCallback(async (): Promise<void> => {
    // Check cache first
    const cachedData = getCachedData()
    if (cachedData) {
      setData(cachedData)
      setError(null)
      return
    }

    // Prevent duplicate requests
    if (loading) return

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(endpoint, {
        signal: abortControllerRef.current.signal,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const rawData = await response.json()
      const processedData = transform ? transform(rawData) : rawData

      setData(processedData)
      setCachedData(processedData)
      setLastFetched(Date.now())
      setError(null)

      onSuccess?.(processedData)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, don't set error
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [endpoint, loading, getCachedData, setCachedData, onSuccess, onError, transform, skipCache])

  // Debounced fetch function
  const debouncedFetch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchData()
    }, debounceDelay)
  }, [fetchData, debounceDelay])

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (autoFetch) {
      debouncedFetch()
    }
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [autoFetch, debouncedFetch, ...dependencies])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Initialize with cached data if available
  useEffect(() => {
    const cachedData = getCachedData()
    if (cachedData && !data) {
      setData(cachedData)
    }
  }, [getCachedData, data])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache,
    lastFetched
  }
}

// Utility function to clear all caches (useful for logout)
export const clearAllCaches = () => {
  globalCache.clear()
}

// Utility function to get cache statistics
export const getCacheStats = () => {
  const now = Date.now()
  const entries = Array.from(globalCache.entries())
  
  return {
    totalEntries: entries.length,
    validEntries: entries.filter(([, entry]) => now < entry.expiresAt).length,
    expiredEntries: entries.filter(([, entry]) => now >= entry.expiresAt).length,
    totalSize: entries.reduce((acc, [, entry]) => acc + JSON.stringify(entry.data).length, 0)
  }
}

export default useSmartDataFetching

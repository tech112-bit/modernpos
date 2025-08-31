'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  role: string
}

interface UseSmartAuthReturn {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Global auth state to prevent duplicate auth checks
let globalAuthState: {
  user: User | null
  loading: boolean
  lastCheck: number
} = {
  user: null,
  loading: false,
  lastCheck: 0
}

// Auth check cooldown (5 seconds)
const AUTH_CHECK_COOLDOWN = 5000

function useSmartAuth(): UseSmartAuthReturn {
  const [user, setUser] = useState<User | null>(globalAuthState.user)
  const [loading, setLoading] = useState(globalAuthState.loading)
  const router = useRouter()
  const abortControllerRef = useRef<AbortController | null>(null)

  const isAuthenticated = !!user

  // Check if we should skip auth check (cooldown period)
  const shouldSkipAuthCheck = useCallback((): boolean => {
    const now = Date.now()
    return now - globalAuthState.lastCheck < AUTH_CHECK_COOLDOWN
  }, [])

  // Update global auth state
  const updateGlobalAuthState = useCallback((updates: Partial<typeof globalAuthState>) => {
    globalAuthState = { ...globalAuthState, ...updates }
  }, [])

  // Check authentication status
  const checkAuth = useCallback(async (): Promise<void> => {
    // Skip if already loading or within cooldown period
    if (globalAuthState.loading || shouldSkipAuthCheck()) {
      return
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    updateGlobalAuthState({ loading: true })
    setLoading(true)

    try {
      const response = await fetch('/api/auth/me', {
        signal: abortControllerRef.current.signal,
        credentials: 'include'
      })

      if (response.ok) {
        const userData = await response.json()
        const userInfo = userData.user
        
        updateGlobalAuthState({ 
          user: userInfo, 
          loading: false, 
          lastCheck: Date.now() 
        })
        setUser(userInfo)
      } else {
        updateGlobalAuthState({ 
          user: null, 
          loading: false, 
          lastCheck: Date.now() 
        })
        setUser(null)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      
      console.error('Auth check error:', error)
      updateGlobalAuthState({ 
        user: null, 
        loading: false, 
        lastCheck: Date.now() 
      })
      setUser(null)
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [updateGlobalAuthState, shouldSkipAuthCheck])

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login for:', email)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      console.log('🔐 Login response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Login successful, user data:', data)
        
        // Update both local and global state
        updateGlobalAuthState({ 
          user: data.user, 
          loading: false, 
          lastCheck: Date.now() 
        })
        setUser(data.user)
        
        // Clear any cached data to ensure fresh data
        if (typeof window !== 'undefined' && window.clearAllCaches) {
          window.clearAllCaches()
        }
        
        return true
      } else {
        const errorData = await response.json()
        console.log('❌ Login failed:', errorData)
        return false
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      return false
    }
  }, [updateGlobalAuthState])

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('🚪 Logging out user')
      
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        console.log('✅ Logout successful')
      } else {
        console.error('❌ Logout failed:', response.status)
      }
    } catch (error) {
      console.error('❌ Logout error:', error)
    } finally {
      // Always clear state and redirect, even if logout fails
      updateGlobalAuthState({ 
        user: null, 
        loading: false, 
        lastCheck: Date.now() 
      })
      setUser(null)
      
      // Clear all caches
      if (typeof window !== 'undefined' && window.clearAllCaches) {
        window.clearAllCaches()
      }
      
      router.push('/login')
    }
  }, [updateGlobalAuthState, router])

  // Refresh user data (force refresh)
  const refreshUser = useCallback(async (): Promise<void> => {
    // Force refresh by clearing cooldown
    updateGlobalAuthState({ lastCheck: 0 })
    await checkAuth()
  }, [checkAuth, updateGlobalAuthState])

  // Initialize auth state
  useEffect(() => {
    // If we have cached user data, use it immediately
    if (globalAuthState.user && !user) {
      setUser(globalAuthState.user)
      setLoading(false)
    }
    
    // Check auth if needed
    if (!globalAuthState.user && !shouldSkipAuthCheck()) {
      checkAuth()
    }
  }, [checkAuth, shouldSkipAuthCheck, user])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    refreshUser
  }
}

// Utility function to get current auth state
export const getCurrentAuthState = () => ({ ...globalAuthState })

// Utility function to clear auth state (useful for testing)
export const clearAuthState = () => {
  globalAuthState = {
    user: null,
    loading: false,
    lastCheck: 0
  }
}

export default useSmartAuth

// Global cache functions for easy access
import { clearAllCaches, getCacheStats } from '@/hooks'

// Extend Window interface
declare global {
  interface Window {
    clearAllCaches: () => void
    getCacheStats: () => ReturnType<typeof getCacheStats>
  }
}

// Add cache functions to window object
if (typeof window !== 'undefined') {
  window.clearAllCaches = clearAllCaches
  window.getCacheStats = getCacheStats
}

export {}

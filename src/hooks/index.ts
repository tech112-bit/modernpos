export { default as useDataFetching } from './useDataFetching'
export { default as useSmartDataFetching } from './useSmartDataFetching'
export { default as useSmartAuth } from './useSmartAuth'
export { default as useDeleteConfirmation } from './useDeleteConfirmation'
export { default as useSearch } from './useSearch'

// Named exports for utility functions
export { clearAllCaches, getCacheStats } from './useSmartDataFetching'
export { getCurrentAuthState, clearAuthState } from './useSmartAuth'

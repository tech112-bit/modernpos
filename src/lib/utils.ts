import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to show relative time (e.g., "2 days ago", "1 week ago")
 * This makes data appear less "new" and more realistic
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  if (diffInYears > 0) {
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
  } else if (diffInMonths > 0) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  } else if (diffInWeeks > 0) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
  } else if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  } else {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
      } else {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        if (diffInMinutes > 0) {
          return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
        } else {
          return 'Just now'
        }
      }
    }
  }

/**
 * Format a date to show both relative time and actual date
 * Useful for showing both "2 days ago" and "Aug 26, 2025"
 */
export function formatDateWithRelative(date: string | Date): string {
  const relative = formatRelativeTime(date)
  const actual = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  // If it's more than 1 year ago, show both relative and actual
  // If it's recent (within a few days), just show relative
  const targetDate = new Date(date)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays > 7) {
    return `${relative} (${actual})`
  } else {
    return relative
  }
}

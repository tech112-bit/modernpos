// Production error handler to prevent information leakage
export class ProductionErrorHandler {
  private static isProduction = process.env.NODE_ENV === 'production'

  static handle(error: unknown, context?: string): { message: string; status: number } {
    // Log the full error for debugging (but don't expose to client)
    console.error(`Error in ${context || 'unknown context'}:`, error)

    if (this.isProduction) {
      // In production, return generic error messages
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('JWT_SECRET')) {
          return { message: 'Configuration error', status: 500 }
        }
        if (error.message.includes('database') || error.message.includes('prisma')) {
          return { message: 'Database error', status: 500 }
        }
        if (error.message.includes('authentication') || error.message.includes('token')) {
          return { message: 'Authentication error', status: 401 }
        }
      }
      
      // Default production error
      return { message: 'Internal server error', status: 500 }
    } else {
      // In development, return more detailed errors
      if (error instanceof Error) {
        return { message: error.message, status: 500 }
      }
      return { message: 'Unknown error occurred', status: 500 }
    }
  }

  static sanitizeError(error: unknown): string {
    if (this.isProduction) {
      return 'An error occurred. Please try again later.'
    }
    
    if (error instanceof Error) {
      return error.message
    }
    
    return String(error)
  }

  static logError(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString()
    const errorInfo = {
      timestamp,
      context: context || 'unknown',
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    }
    
    console.error('ERROR_LOG:', JSON.stringify(errorInfo, null, 2))
  }
}

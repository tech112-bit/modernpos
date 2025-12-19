export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined

  const text = await response.text().catch(() => '')
  if (!text) return undefined

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function inferErrorMessage(data: unknown, fallback: string): string {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    const maybeError = (data as { error?: unknown }).error
    if (typeof maybeError === 'string' && maybeError.trim()) return maybeError
    const maybeMessage = (data as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage
  }
  return fallback
}

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init
  })

  const data = await parseBody(response)

  if (!response.ok) {
    const fallback = response.statusText || 'Request failed'
    throw new ApiError(inferErrorMessage(data, fallback), response.status, data)
  }

  return data as T
}

export async function apiRequestVoid(url: string, init?: RequestInit): Promise<void> {
  await apiRequest<unknown>(url, init)
}

export function getErrorMessage(error: unknown, fallback: string = 'Request failed'): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message || fallback
  return fallback
}

import { apiRequest, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type Customer, type CustomersApiResponse } from '@/types/customer'

type CustomerApiResponse = {
  id: string
  name: string
  phone?: string
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  createdAt: string
  totalSpent?: number | string | null
  _count?: { sales?: number }
}

export async function listCustomers(signal?: AbortSignal): Promise<CustomersApiResponse> {
  return apiRequest<CustomersApiResponse>('/api/customers', { signal })
}

export async function getCustomer(customerId: string): Promise<Customer> {
  const data = await apiRequest<CustomerApiResponse>(`/api/customers/${customerId}`)
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    address: data.address || undefined,
    city: data.city || undefined,
    state: data.state || undefined,
    zip_code: data.zip_code || undefined,
    createdAt: data.createdAt,
    totalSpent: Number(data.totalSpent || 0),
    orderCount: data._count?.sales ?? 0
  }
}

export async function createCustomer(payload: unknown): Promise<{ id: string; phone?: string; email?: string }> {
  return apiRequestJson<{ id: string; phone?: string; email?: string }>('/api/customers', 'POST', payload)
}

export async function updateCustomer(customerId: string, payload: unknown): Promise<unknown> {
  return apiRequestJson<unknown>(`/api/customers/${customerId}`, 'PUT', payload)
}

export async function deleteCustomer(customerId: string): Promise<void> {
  await apiRequestVoid(`/api/customers/${customerId}`, { method: 'DELETE' })
}

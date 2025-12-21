import { apiRequest, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type Sale, type SaleCustomerSummary, type SaleProduct, type SalesApiResponse } from '@/types/sale'

type ProductsForSaleResponse = {
  products: SaleProduct[]
}

type CustomersForSaleResponse = {
  customers: SaleCustomerSummary[]
}

export async function listSales(signal?: AbortSignal): Promise<Sale[]> {
  const data = await apiRequest<SalesApiResponse>('/api/sales', { signal })
  return data.sales || []
}

export async function listSaleProducts(): Promise<SaleProduct[]> {
  const data = await apiRequest<ProductsForSaleResponse>('/api/products')
  return data.products || []
}

export async function listSaleCustomers(): Promise<SaleCustomerSummary[]> {
  const data = await apiRequest<CustomersForSaleResponse>('/api/customers')
  return data.customers || []
}

export async function createSale(payload: unknown): Promise<unknown> {
  return apiRequestJson<unknown>('/api/sales', 'POST', payload)
}

export async function getSale(saleId: string): Promise<Sale> {
  return apiRequest<Sale>(`/api/sales/${saleId}`)
}

export async function deleteSale(saleId: string): Promise<void> {
  await apiRequestVoid(`/api/sales/${saleId}`, { method: 'DELETE' })
}

export async function updateSalePaymentStatus(
  saleId: string,
  payment_status: 'PAID' | 'NOT_PAID' | 'CASH_ON_DELIVERY'
): Promise<Sale> {
  return apiRequestJson<Sale>(`/api/sales/${saleId}`, 'PATCH', { payment_status })
}

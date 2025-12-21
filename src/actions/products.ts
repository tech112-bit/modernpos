import { apiRequest, apiRequestForm, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type ImportApiResponse } from '@/types/import'
import { type Category } from '@/types/category'
import { type ApiProduct, type ProductDetail, type ProductsApiResponse } from '@/types/product'
import { transformProductData } from '@/lib/utils'
import { listCategories } from '@/actions/categories'

export async function getProduct(productId: string): Promise<ProductDetail> {
  const apiProduct = await apiRequest<ApiProduct>(`/api/products/${productId}`)
  return transformProductData(apiProduct)
}

export async function listProducts(signal?: AbortSignal): Promise<ProductsApiResponse> {
  return apiRequest<ProductsApiResponse>('/api/products', { signal })
}

export async function listCategoriesForProducts(signal?: AbortSignal): Promise<Category[]> {
  return listCategories(signal)
}

export async function createProduct(payload: unknown): Promise<unknown> {
  return apiRequestJson<unknown>('/api/products', 'POST', payload)
}

export async function updateProduct(productId: string, payload: unknown): Promise<unknown> {
  return apiRequestJson<unknown>(`/api/products/${productId}`, 'PUT', payload)
}

export async function deleteProduct(productId: string, csrfToken?: string): Promise<void> {
  if (csrfToken) {
    await apiRequestJson<void>(`/api/products/${productId}`, 'DELETE', { csrfToken })
    return
  }

  await apiRequestVoid(`/api/products/${productId}`, { method: 'DELETE' })
}

export async function importProducts(file: File): Promise<ImportApiResponse> {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequestForm<ImportApiResponse>('/api/products/import', formData)
}

import { apiRequest, apiRequestForm, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type ImportApiResponse } from '@/types/import'
import { type Category } from '@/types/category'

export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  return apiRequest<Category[]>('/api/categories', { signal })
}

export async function getCategory(categoryId: string): Promise<Category> {
  return apiRequest<Category>(`/api/categories/${categoryId}`)
}

export async function createCategory(name: string): Promise<Category> {
  return apiRequestJson<Category>('/api/categories', 'POST', { name })
}

export async function updateCategory(categoryId: string, name: string): Promise<Category> {
  return apiRequestJson<Category>(`/api/categories/${categoryId}`, 'PUT', { name })
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await apiRequestVoid(`/api/categories/${categoryId}`, { method: 'DELETE' })
}

export async function importCategories(file: File): Promise<ImportApiResponse> {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequestForm<ImportApiResponse>('/api/categories/import', formData)
}

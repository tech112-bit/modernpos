import { apiRequest, apiRequestVoid } from '@/actions/http'
import { type ImportApiResponse } from '@/types/import'
import { type Category } from '@/types/category'

export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  return apiRequest<Category[]>('/api/categories', { signal })
}

export async function getCategory(categoryId: string): Promise<Category> {
  return apiRequest<Category>(`/api/categories/${categoryId}`)
}

export async function createCategory(name: string): Promise<Category> {
  return apiRequest<Category>('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
}

export async function updateCategory(categoryId: string, name: string): Promise<Category> {
  return apiRequest<Category>(`/api/categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await apiRequestVoid(`/api/categories/${categoryId}`, { method: 'DELETE' })
}

export async function importCategories(file: File): Promise<ImportApiResponse> {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest<ImportApiResponse>('/api/categories/import', {
    method: 'POST',
    body: formData
  })
}

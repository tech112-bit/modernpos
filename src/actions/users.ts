import { apiRequest, apiRequestVoid } from '@/actions/http'
import { type User, type UserRole, type UserStatus, type UsersApiResponse } from '@/types/user'

type CreateUserPayload = {
  email: string
  password: string
  role: UserRole
  status: UserStatus
}

type CreateUserResponse = {
  user: User
}

export async function listUsers(signal?: AbortSignal): Promise<UsersApiResponse> {
  return apiRequest<UsersApiResponse>('/api/users', { signal })
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const data = await apiRequest<CreateUserResponse>('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return data.user
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await apiRequestVoid(`/api/users/${userId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword })
  })
}

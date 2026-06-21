import { apiRequest } from './http'
import { type PageVO } from './shop'
import type { UserInfo } from '@/stores/user'

export type UserProfileVO = Partial<UserInfo>

export const getUserProfileApi = (token: string) => {
  return apiRequest<UserProfileVO>('/api/user/profile', { token })
}

// --- 修改用户资料 ---

export interface UserUpdateRequest {
  nickname?: string
  avatar?: string
}

export const updateUserProfileApi = (payload: UserUpdateRequest, token: string) => {
  return apiRequest<UserProfileVO>('/api/user/profile', {
    method: 'PUT',
    body: payload,
    token,
  })
}

// --- 用户头像昵称 ---

export interface UserBriefVO {
  userId: string
  nickname: string
  avatar: string
}

export const getUserBriefApi = (userId: string) => {
  return apiRequest<UserBriefVO>(`/api/user/brief/${userId}`)
}

// --- 收货地址 ---

export interface UserLocationCreateRequest {
  name: string
  phone: string
  address: string
  longitude: number
  latitude: number
}

export interface UserLocationVO {
  locationId: string
  name: string
  phone: string
  address: string
  longitude: number
  latitude: number
  createTime: string
  updateTime: string
}

export const createUserLocationApi = (payload: UserLocationCreateRequest, token: string) => {
  return apiRequest<UserLocationVO>('/api/user/add-location', {
    method: 'POST',
    body: payload,
    token,
  })
}

export const deleteUserLocationApi = (locationId: string, token: string) => {
  return apiRequest<null>(`/api/user/delete-location/${locationId}`, {
    method: 'DELETE',
    token,
  })
}

export const listUserLocationsApi = (page: number, size: number) => {
  const query = new URLSearchParams()
  if (page) query.set('page', String(page))
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<PageVO<UserLocationVO>>(`/api/user/list-location${qs ? `?${qs}` : ''}`)
}


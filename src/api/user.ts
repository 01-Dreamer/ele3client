import { apiRequest } from './http'
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
    body: JSON.stringify(payload),
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
  return apiRequest<UserLocationVO>('/api/user/location', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export const deleteUserLocationApi = (locationId: string, token: string) => {
  return apiRequest<null>(`/api/user/location/${locationId}`, {
    method: 'DELETE',
    token,
  })
}

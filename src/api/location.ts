import { apiRequest } from './http'

// --- 类型 ---

export interface CoordinateUploadRequest {
  longitude: number
  latitude: number
}

export interface CoordinateVO {
  longitude: number
  latitude: number
  updateTime: number
}

// --- API ---

/** 上传自己的经纬度 */
export const uploadCoordinateApi = (payload: CoordinateUploadRequest, token?: string) => {
  return apiRequest<CoordinateVO>('/api/location/coordinate', {
    method: 'POST',
    body: payload,
    token,
  })
}

/** 获取指定用户经纬度 */
export const getCoordinateApi = (userId: string) => {
  return apiRequest<CoordinateVO>(`/api/location/coordinate?userId=${userId}`)
}

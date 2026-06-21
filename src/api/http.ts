export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

interface ApiRequestOptions extends RequestInit {
  token?: string
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const hasApiBaseUrl = () => Boolean(API_BASE_URL)

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}) => {
  const { token, headers, ...requestOptions } = options
  const requestHeaders = new Headers(headers)

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (requestOptions.body && !(requestOptions.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders
  })

  const body = (await response.json()) as ApiResponse<T>

  if (!response.ok || body.code !== 200) {
    throw new Error(body.message || '请求失败')
  }

  return body.data
}

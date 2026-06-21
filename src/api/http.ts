import axios from 'axios'
import { ElMessage } from 'element-plus'
import { requestRiskChallenge } from '@/services/riskChallenge'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

interface ApiRequestOptions {
  token?: string
  skipRiskChallenge?: boolean
  riskRetried?: boolean
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const USER_STORAGE_KEY = 'ele3_user'
const ERROR_MESSAGE_DURATION = 2000
const RISK_CHALLENGE_CODE = 40103

export const hasApiBaseUrl = () => Boolean(API_BASE_URL)

export class ApiRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export const showErrorMessage = (error: unknown, fallback = '请求失败') => {
  ElMessage({
    message: error instanceof Error && error.message ? error.message : fallback,
    type: 'error',
    duration: ERROR_MESSAGE_DURATION,
    grouping: true,
  })
}

const getStoredToken = () => {
  if (typeof window === 'undefined') return ''
  const raw = window.localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return ''
  try {
    const state = JSON.parse(raw) as { token?: unknown }
    return typeof state.token === 'string' ? state.token : ''
  } catch {
    return ''
  }
}

const http = axios.create({
  baseURL: API_BASE_URL,
})

// 请求拦截器：注入 Authorization
http.interceptors.request.use((config) => {
  const token = (config as Record<string, unknown>)._token as string | undefined
  const authToken = token || getStoredToken()
  if (authToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

// 响应拦截器：风控拦截 + 业务错误
http.interceptors.response.use(
  async (response) => {
    const body = response.data as ApiResponse<unknown>
    const config = response.config as Record<string, unknown>

    if (body.code === RISK_CHALLENGE_CODE && !config._skipRiskChallenge && !config._riskRetried) {
      await requestRiskChallenge(body.message || '请提交验证码')
      config._riskRetried = true
      return http.request(response.config)
    }

    if (body.code === 401) {
      // 登录失效：清数据，跳登录页
      Object.keys(localStorage).forEach(k => { if (k.startsWith('ele3_')) localStorage.removeItem(k) })
      window.location.href = '/login'
      throw new ApiRequestError(body.message || '登录已失效')
    }

    if (body.code !== 200) {
      throw new ApiRequestError(body.message || '请求失败')
    }

    return response
  },
  (error) => {
    if (error.response?.data?.code === 401 || error.response?.status === 401) {
      Object.keys(localStorage).forEach(k => { if (k.startsWith('ele3_')) localStorage.removeItem(k) })
      window.location.href = '/login'
      return Promise.reject(new ApiRequestError('登录已失效'))
    }
    const msg = error.response?.data?.message || error.message || '请求失败'
    throw new ApiRequestError(msg)
  },
)

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const { token, skipRiskChallenge, riskRetried, method = 'GET', body, headers } = options

  const config: Record<string, unknown> = {
    url: path,
    method,
    headers: { ...headers },
    _token: token,
    _skipRiskChallenge: skipRiskChallenge,
    _riskRetried: riskRetried,
  }

  if (body !== undefined) {
    config.data = body
    if (!(body instanceof FormData) && !(config.headers as Record<string, string>)['Content-Type']) {
      (config.headers as Record<string, string>)['Content-Type'] = 'application/json'
    }
  }

  const response = await http.request(config)
  return (response.data as ApiResponse<T>).data
}

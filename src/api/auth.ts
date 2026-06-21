import { apiRequest } from './http'
import type { UserInfo } from '@/stores/user'

export interface LoginRequest {
  email: string
  password: string
  captchaId?: string
  captchaCode?: string
}

export interface LoginVO {
  token: string
  userInfo: UserInfo
}

export type YnuQrCodeVO = Record<string, unknown>
export type YnuQrCodeCheckVO = Record<string, unknown>

export interface ThirdAccountVO {
  id: string
  userId: string
  provider: string
  openId: string
  createTime: string
}

export interface EmailCaptchaSendRequest {
  email: string
  captchaId: string
  captchaData: unknown
}

export interface EmailCaptchaSendVO {
  expireSeconds: number
}

export interface RegisterRequest {
  email: string
  password: string
  emailCaptcha: string
}

export interface RegisterVO {
  userId: string
  email: string
  role: string
  status: number
}

export const loginApi = (payload: LoginRequest) => {
  return apiRequest<LoginVO>('/api/auth/public/login', {
    method: 'POST',
    body: {
      email: payload.email,
      password: payload.password,
      captchaId: payload.captchaId || '',
      captchaCode: payload.captchaCode || ''
    }
  })
}

export const logoutApi = (token: string) => {
  return apiRequest<null>('/api/auth/logout', {
    method: 'POST',
    body: { token },
    token
  })
}

export const getPublicYnuQrCodeApi = () => {
  return apiRequest<YnuQrCodeVO>('/api/auth/public/ynu-oauth/get-qrcode')
}

export const checkPublicYnuQrCodeApi = (uuid: string) => {
  return apiRequest<YnuQrCodeCheckVO>(`/api/auth/public/ynu-oauth/check-qrcode?uuid=${encodeURIComponent(uuid)}`)
}

export const getYnuBindQrCodeApi = (token: string) => {
  return apiRequest<YnuQrCodeVO>('/api/auth/ynu-oauth/get-qrcode', { token })
}

export const checkYnuBindQrCodeApi = (uuid: string, token: string) => {
  return apiRequest<YnuQrCodeCheckVO>(`/api/auth/ynu-oauth/check-qrcode?uuid=${encodeURIComponent(uuid)}`, {
    token
  })
}

export const listThirdAccountBindingApi = (token: string) => {
  return apiRequest<ThirdAccountVO[]>('/api/auth/binding', { token })
}

export const sendRegisterEmailCaptchaApi = (payload: EmailCaptchaSendRequest) => {
  return apiRequest<EmailCaptchaSendVO>('/api/auth/public/register/email-captcha', {
    method: 'POST',
    body: payload
  })
}

export const registerApi = (payload: RegisterRequest) => {
  return apiRequest<RegisterVO>('/api/auth/public/register', {
    method: 'POST',
    body: payload
  })
}

// --- 忘记密码 ---

export interface ForgotPasswordResetRequest {
  email: string
  emailCaptcha: string
  newPassword: string
}

export const sendForgotPasswordEmailCaptchaApi = (payload: EmailCaptchaSendRequest) => {
  return apiRequest<EmailCaptchaSendVO>('/api/auth/public/forgot-password/email-captcha', {
    method: 'POST',
    body: payload
  })
}

export const forgotPasswordResetApi = (payload: ForgotPasswordResetRequest) => {
  return apiRequest<null>('/api/auth/public/forgot-password', {
    method: 'PUT',
    body: payload
  })
}

// --- 修改密码（需登录） ---

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export const sendChangePasswordEmailCaptchaApi = (payload: EmailCaptchaSendRequest, token: string) => {
  return apiRequest<EmailCaptchaSendVO>('/api/auth/change-password/email-captcha', {
    method: 'POST',
    body: payload,
    token
  })
}

export const changePasswordApi = (payload: ChangePasswordRequest, token: string) => {
  return apiRequest<null>('/api/auth/change-password', {
    method: 'PUT',
    body: payload,
    token
  })
}

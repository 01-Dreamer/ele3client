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

export interface EmailCaptchaSendRequest {
  email: string
  captchaId: string
  captchaData: Record<string, unknown>
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
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      captchaId: payload.captchaId || '',
      captchaCode: payload.captchaCode || ''
    })
  })
}

export const sendRegisterEmailCaptchaApi = (payload: EmailCaptchaSendRequest) => {
  return apiRequest<EmailCaptchaSendVO>('/api/auth/public/register/email-captcha', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export const registerApi = (payload: RegisterRequest) => {
  return apiRequest<RegisterVO>('/api/auth/public/register', {
    method: 'POST',
    body: JSON.stringify(payload)
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
    body: JSON.stringify(payload)
  })
}

export const forgotPasswordResetApi = (payload: ForgotPasswordResetRequest) => {
  return apiRequest<null>('/api/auth/public/forgot-password', {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

// --- 修改密码（需登录） ---

export interface ChangePasswordRequest {
  oldPassword: string
  emailCaptcha: string
  newPassword: string
}

export const sendChangePasswordEmailCaptchaApi = (payload: EmailCaptchaSendRequest, token: string) => {
  return apiRequest<EmailCaptchaSendVO>('/api/auth/change-password/email-captcha', {
    method: 'POST',
    body: JSON.stringify(payload),
    token
  })
}

export const changePasswordApi = (payload: ChangePasswordRequest, token: string) => {
  return apiRequest<null>('/api/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(payload),
    token
  })
}

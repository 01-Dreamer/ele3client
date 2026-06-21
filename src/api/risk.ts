import { apiRequest } from './http'

export interface TextCaptchaVO {
  id: string
  type: 'IMAGE' | string
  image: string
  width: number
  height: number
}

export interface SliderCaptchaVO {
  id: string
  type: 'SLIDER' | string
  backgroundImage: string
  templateImage: string
  backgroundImageTag?: string
  templateImageTag?: string
  backgroundImageWidth: number
  backgroundImageHeight: number
  templateImageWidth: number
  templateImageHeight: number
  data?: unknown
}

export interface SliderCaptchaTrackPoint {
  x: number
  y: number
  t: number
  type: 'DOWN' | 'MOVE' | 'UP'
}

export interface SliderCaptchaTrack {
  bgImageWidth: number
  bgImageHeight: number
  templateImageWidth: number
  templateImageHeight: number
  startTime: number
  stopTime: number
  left: number
  top: number
  trackList: SliderCaptchaTrackPoint[]
  data?: unknown
}

export const getImageCaptchaApi = () => {
  return apiRequest<TextCaptchaVO>('/api/risk/public/captcha/image', {
    method: 'POST'
  })
}

export const getSliderCaptchaApi = () => {
  return apiRequest<SliderCaptchaVO>('/api/risk/public/captcha/slider', {
    method: 'POST'
  })
}

// --- 清空风险分 ---

export interface RiskClearBySliderRequest {
  userId: string
  captchaId: string
  captchaData: SliderCaptchaTrack
}

export const clearRiskBySliderApi = (payload: RiskClearBySliderRequest) => {
  return apiRequest<null>('/api/risk/public/captcha/clear-risk-by-slider', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

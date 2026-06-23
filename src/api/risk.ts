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
    method: 'POST',
    skipRiskChallenge: true,
  })
}

export const getSliderCaptchaApi = () => {
  return apiRequest<SliderCaptchaVO>('/api/risk/public/captcha/slider', {
    method: 'POST',
    skipRiskChallenge: true,
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
    body: payload,
    skipRiskChallenge: true,
  })
}

// --- 管理员接口 ---

export interface RiskTextRecordVO {
  id: string
  sourceType: string
  sourceId: string
  userId: string
  content: string
  status: number  // 0待处理,1已处理
  handleOpinion: string
  handleTime: string
  createTime: string
  updateTime: string
}

export interface PageVO<T> {
  records: T[]
  total: number
  page: number
  size: number
}

export const listRiskTextRecordsApi = (params: { status?: number; page?: number; size?: number }) => {
  const query = new URLSearchParams()
  if (params.status !== undefined) query.set('status', String(params.status))
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.size !== undefined) query.set('size', String(params.size))
  const qs = query.toString()
  return apiRequest<PageVO<RiskTextRecordVO>>(`/api/risk/admin/text-records${qs ? `?${qs}` : ''}`)
}

export const handleTextRecordApi = (id: string, handleOpinion: string) => {
  return apiRequest<null>('/api/risk/admin/handle-text-record', {
    method: 'POST',
    body: { id, handleOpinion },
  })
}

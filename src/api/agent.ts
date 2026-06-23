import { apiRequest } from './http'
import { getPowResponse, invalidatePow } from '@/services/agentPow'

// --- 类型 ---

export interface ChatHistoryItem {
  id: string
  role: string
  content: string
  createTime: string
}

export interface CursorPageVO<T> {
  records: T[]
  nextCursor: string
  hasMore: boolean
}

// --- API ---

export const getWasmModuleApi = () => {
  return apiRequest<{ js: string; wasm: string }>('/api/agent/wasm-module')
}

export const getChallengeApi = () => {
  return apiRequest<{ challenge: string; difficulty: number; expireSeconds: number }>('/api/agent/challenge')
}

/** 获取对话历史（游标分页） */
export const getChatHistoryApi = (cursor?: string, size = 30) => {
  const query = new URLSearchParams()
  if (cursor) query.set('cursor', cursor)
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<CursorPageVO<ChatHistoryItem>>(`/api/agent/chat-history${qs ? `?${qs}` : ''}`)
}

export interface AgentContext {
  longitude?: number
  latitude?: number
  address?: string
  pageContext?: string
}

/** Agent 对话（SSE 流式），返回 ReadableStream 供逐行读取 */
export const chatStreamApi = async (content: string, ctx?: AgentContext): Promise<ReadableStream<Uint8Array>> => {
  const getToken = () => {
    try { return JSON.parse(localStorage.getItem('ele3_user') || '{}').token || '' } catch { return '' }
  }

  const { API_BASE_URL: base } = await import('./http')
  const doFetch = async () => {
    const pow = await getPowResponse()
    if (!pow) throw new Error('PoW 验证失败')
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Agent-Pow-Response': pow }
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${base}/api/agent/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content,
        longitude: ctx?.longitude ?? null,
        latitude: ctx?.latitude ?? null,
        address: ctx?.address ?? null,
        pageContext: ctx?.pageContext ?? null,
      }),
    })
  }

  let res = await doFetch()
  if (res.status === 403) {
    invalidatePow()
    res = await doFetch()
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || '请求失败')
  }
  if (!res.body) throw new Error('不支持流式响应')
  return res.body
}

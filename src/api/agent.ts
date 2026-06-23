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

/** Agent 对话（SSE 流式），返回 ReadableStream 供逐行读取 */
export const chatStreamApi = async (content: string): Promise<ReadableStream<Uint8Array>> => {
  let pow = await getPowResponse()
  if (!pow) throw new Error('PoW 验证失败')

  const { http } = await import('./http')
  const tryRequest = (currentPow: string) =>
    http.post('/api/agent/chat', { content }, {
      headers: { 'X-Agent-Pow-Response': currentPow },
      responseType: 'stream',
    })

  let response = await tryRequest(pow)
  if (response.status === 403) {
    invalidatePow()
    pow = await getPowResponse()
    if (!pow) throw new Error('PoW 重试失败')
    response = await tryRequest(pow)
  }
  return response.data as ReadableStream<Uint8Array>
}

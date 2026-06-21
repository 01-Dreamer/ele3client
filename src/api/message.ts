import { apiRequest } from './http'

// --- 类型 ---

export interface MessageSessionVO {
  id: string
  smallerUserId: string
  largerUserId: string
  lastMessageId: string
  lastMessageContent: string
  lastMessageTime: string
  smallerUserUnreadCount: number
  largerUserUnreadCount: number
  smallerUserShow: number
  largerUserShow: number
  createTime: string
  updateTime: string
}

export interface MessageChatVO {
  id: string
  senderId: string
  receiverId: string
  content: string
  createTime: string
}

export interface MessageNoticeVO {
  id: string
  userId: string
  title: string
  content: string
  isRead: number
  createTime: string
  updateTime: string
}

export interface CursorPageVO<T> {
  items: T[]
  nextCursor: string
  hasMore: boolean
}

// --- API ---

/** 获取自己的会话列表 */
export const listSessionApi = (cursor?: string, size?: number) => {
  const query = new URLSearchParams()
  if (cursor) query.set('cursor', cursor)
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<CursorPageVO<MessageSessionVO>>(`/api/message/list-session${qs ? `?${qs}` : ''}`, )
}

/** 获取自己的聊天消息 */
export const listChatApi = (cursor?: string, size?: number) => {
  const query = new URLSearchParams()
  if (cursor) query.set('cursor', cursor)
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<CursorPageVO<MessageChatVO>>(`/api/message/list-chat${qs ? `?${qs}` : ''}`, )
}

/** 获取自己的通知列表 */
export const listNoticeApi = (cursor?: string, size?: number) => {
  const query = new URLSearchParams()
  if (cursor) query.set('cursor', cursor)
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<CursorPageVO<MessageNoticeVO>>(`/api/message/list-notice${qs ? `?${qs}` : ''}`, )
}

/** 标记通知为已读 */
/** 全部通知标记为已读 */
export const readAllNoticeApi = () => {
  return apiRequest<null>('/api/message/read-all-notice', { method: 'PUT' })
}

/** 标记通知为已读 */
export const readNoticeApi = (noticeId: string) => {
  return apiRequest<null>(`/api/message/read-notice/${noticeId}`, {
    method: 'PUT',
  })
}

/** 清空会话未读计数 */
export const clearUnreadApi = (sessionId: string) => {
  return apiRequest<null>(`/api/message/clear-unread/${sessionId}`, {
    method: 'PUT',
    
  })
}

/** 隐藏会话 */
export const hideSessionApi = (sessionId: string) => {
  return apiRequest<null>(`/api/message/hide-session/${sessionId}`, {
    method: 'DELETE',
    
  })
}

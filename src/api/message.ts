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
  records: T[]
  nextCursor: string
  hasMore: boolean
}

// --- API ---

/** 获取自己的会话列表 */
export const listSessionApi = (token: string, cursor?: string, size?: number) => {
  const query = new URLSearchParams()
  if (cursor) query.set('cursor', cursor)
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<CursorPageVO<MessageSessionVO>>(`/api/message/list-session${qs ? `?${qs}` : ''}`, { token })
}

/** 获取自己的聊天消息 */
export const listChatApi = (token: string, cursor?: string, size?: number) => {
  const query = new URLSearchParams()
  if (cursor) query.set('cursor', cursor)
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<CursorPageVO<MessageChatVO>>(`/api/message/list-chat${qs ? `?${qs}` : ''}`, { token })
}

/** 获取自己的通知列表 */
export const listNoticeApi = (token: string, cursor?: string, size?: number) => {
  const query = new URLSearchParams()
  if (cursor) query.set('cursor', cursor)
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<CursorPageVO<MessageNoticeVO>>(`/api/message/list-notice${qs ? `?${qs}` : ''}`, { token })
}

/** 标记通知为已读 */
export const readNoticeApi = (noticeId: string, token: string) => {
  return apiRequest<null>(`/api/message/read-notice/${noticeId}`, {
    method: 'PUT',
    token,
  })
}

/** 清空会话未读计数 */
export const clearUnreadApi = (sessionId: string, token: string) => {
  return apiRequest<null>(`/api/message/clear-unread/${sessionId}`, {
    method: 'PUT',
    token,
  })
}

/** 隐藏会话 */
export const hideSessionApi = (sessionId: string, token: string) => {
  return apiRequest<null>(`/api/message/hide-session/${sessionId}`, {
    method: 'DELETE',
    token,
  })
}

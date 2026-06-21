import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'

export interface WsMessage {
  type: 'CHAT' | 'NOTICE' | 'PING' | 'PONG'
  senderId: string
  receiverId: string
  data: string | null
  timestamp: number
}

export const useWebsocketStore = defineStore('websocket', () => {
  const socket = shallowRef<WebSocket | null>(null)
  const connected = ref(false)
  const messages = ref<WsMessage[]>([])
  const listeners = new Set<(msg: WsMessage) => void>()

  let reconnectTimer: number | undefined
  let pingTimer: number | undefined
  let currentToken = ''
  let userStore: any = null

  const setUserStore = (store: any) => { userStore = store }

  const getStoredToken = () => {
    try {
      const raw = localStorage.getItem('ele3_user')
      if (!raw) return ''
      return JSON.parse(raw).token || ''
    } catch { return '' }
  }

  const connect = (token?: string) => {
    const t = token || getStoredToken()
    if (!t) return
    currentToken = t
    disconnect()

    const base = (import.meta.env.VITE_API_BASE_URL || '').replace('http://', 'ws://').replace('https://', 'wss://')
    const wsUrl = `${base}/api/message/ws`

    const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(t)}`)
    ws.onopen = () => {
      connected.value = true
      startPing(ws)
    }

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data)
        if (msg.type === 'PONG') return

        messages.value.push(msg)

        // NOTICE: 左下角弹窗 1s
        if (msg.type === 'NOTICE') {
          let title = '通知', content = ''
          if (typeof msg.data === 'string') {
            try {
              const obj = JSON.parse(msg.data)
              title = obj.title || obj.name || '通知'
              content = obj.content || obj.message || obj.body || ''
            } catch {
              title = msg.data.slice(0, 20) || '通知'
              content = msg.data
            }
          } else if (msg.data && typeof msg.data === 'object') {
            const obj = msg.data as Record<string, unknown>
            title = String(obj.title || obj.name || '通知')
            content = String(obj.content || obj.message || '')
          }
          ElNotification({
            title: title.length > 15 ? title.slice(0, 15) + '...' : title,
            message: content.length > 15 ? content.slice(0, 15) + '...' : content,
            type: 'info',
            duration: 1000,
            position: 'bottom-left',
          })
        }

        // 分发给监听器（chat等）
        listeners.forEach(fn => fn(msg))
      } catch { /* 忽略无法解析的消息 */ }
    }

    ws.onclose = () => {
      connected.value = false
      stopPing()
      reconnectTimer = window.setTimeout(() => {
        if (currentToken) connect(currentToken)
      }, 5000)
    }

    ws.onerror = () => { ws.close() }

    socket.value = ws
  }

  const startPing = (ws: WebSocket) => {
    pingTimer = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PING', senderId: '', receiverId: '', data: null, timestamp: Date.now() }))
      }
    }, 10000)
  }

  const stopPing = () => {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = undefined }
  }

  const disconnect = () => {
    connected.value = false
    stopPing()
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = undefined }
    socket.value?.close()
    socket.value = null
    currentToken = ''
  }

  const sendChat = (senderId: string, receiverId: string, content: string) => {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      connect()
      return false
    }
    socket.value.send(JSON.stringify({ type: 'CHAT', senderId, receiverId, data: content, timestamp: Date.now() }))
    return true
  }

  const addListener = (fn: (msg: WsMessage) => void) => {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }

  const clearMessages = () => { messages.value = [] }

  return {
    socket, connected, messages,
    connect, disconnect, sendChat,
    addListener, clearMessages, setUserStore,
  }
})

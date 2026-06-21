import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

export interface WsMessage {
  type: 'CHAT' | 'NOTICE' | 'PING' | 'PONG'
  senderId: string
  receiverId: string
  data: string | null
  timestamp: number
}

export const useWebsocketStore = defineStore('websocket', () => {
  const socket = shallowRef<WebSocket | null>(null)
  const connected = computed(() => socket.value?.readyState === WebSocket.OPEN)
  const messages = ref<WsMessage[]>([])
  const listeners = new Set<(msg: WsMessage) => void>()

  let reconnectTimer: number | undefined
  let pingTimer: number | undefined
  let currentToken = ''

  const connect = (token: string) => {
    if (!token) return
    currentToken = token

    // 如果已有连接，先断开
    disconnect()

    const wsUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/message/ws`.replace('http://', 'ws://').replace('https://', 'wss://')

    const ws = new WebSocket(wsUrl)
    ws.onopen = () => {
      // 发送认证 token
      ws.send(JSON.stringify({
        type: 'AUTH',
        senderId: '',
        receiverId: '',
        data: token,
        timestamp: Date.now(),
      }))
      startPing(ws)
    }

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data)
        // 过滤 PONG 心跳响应
        if (msg.type === 'PONG') return

        messages.value.push(msg)
        listeners.forEach(fn => fn(msg))
      } catch {
        // 无法解析的消息忽略
      }
    }

    ws.onclose = () => {
      stopPing()
      // 自动重连
      reconnectTimer = window.setTimeout(() => {
        if (currentToken) {
          connect(currentToken)
        }
      }, 5000)
    }

    ws.onerror = () => {
      ws.close()
    }

    socket.value = ws
  }

  const startPing = (ws: WebSocket) => {
    pingTimer = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'PING',
          senderId: '',
          receiverId: '',
          data: null,
          timestamp: Date.now(),
        }))
      }
    }, 30000)
  }

  const stopPing = () => {
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = undefined
    }
  }

  const disconnect = () => {
    stopPing()
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = undefined
    }
    socket.value?.close()
    socket.value = null
    currentToken = ''
  }

  const sendChat = (senderId: string, receiverId: string, content: string) => {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) return false

    socket.value.send(JSON.stringify({
      type: 'CHAT',
      senderId,
      receiverId,
      data: content,
      timestamp: Date.now(),
    }))
    return true
  }

  const addListener = (fn: (msg: WsMessage) => void) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  const clearMessages = () => {
    messages.value = []
  }

  return {
    socket,
    connected,
    messages,
    connect,
    disconnect,
    sendChat,
    addListener,
    clearMessages,
  }
})

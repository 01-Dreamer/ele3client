<template>
  <div class="chat-page">
    <header class="chat-header">
      <h2>{{ chatNickname }}</h2>
    </header>

    <main ref="messageListRef" class="chat-message-list">
      <div v-if="loadingHistory" class="loading-state">
        <el-icon class="is-loading" size="20"><Loading /></el-icon>
        <span>加载消息...</span>
      </div>

      <div
        v-for="message in chatMessages"
        :key="message.id"
        :class="['chat-message', message.sender === 'me' ? 'is-me' : 'is-other']"
      >
        <el-avatar
          class="message-avatar"
          :size="36"
          :src="message.sender === 'me' ? userStore.avatar : '/default-avatar.svg'"
        />
        <div class="message-body">
          <span class="message-time">{{ message.time }}</span>
          <p>{{ message.content }}</p>
        </div>
      </div>

      <div v-if="!loadingHistory && chatMessages.length === 0" class="empty-chat">
        <el-empty description="暂无消息，发送一条消息吧" :image-size="60" />
      </div>
    </main>

    <footer class="chat-input-bar">
      <el-input
        v-model="messageInput"
        placeholder="输入消息"
        clearable
        :disabled="!wsConnected"
        @keyup.enter="sendMessage"
      />
      <el-button
        type="primary"
        :disabled="!wsConnected || !messageInput.trim()"
        @click="sendMessage"
      >
        发送
      </el-button>
    </footer>

    <div v-if="!wsConnected && userStore.token" class="ws-status">
      正在连接消息服务...
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useWebsocketStore, type WsMessage } from '@/stores/websocket'
import { listChatApi, type MessageChatVO } from '@/api/message'

interface DisplayMessage {
  id: string
  sender: 'me' | 'other'
  content: string
  time: string
}

const route = useRoute()
const userStore = useUserStore()
const wsStore = useWebsocketStore()

const messageInput = ref('')
const messageListRef = ref<HTMLElement | null>(null)
const loadingHistory = ref(false)
const chatMessages = ref<DisplayMessage[]>([])
let removeListener: (() => void) | null = null

const chatNickname = computed(() => {
  const nickname = route.query.nickname
  return typeof nickname === 'string' && nickname ? nickname : '聊天'
})

const otherUserId = computed(() => {
  const uid = route.query.userId
  return typeof uid === 'string' ? uid : ''
})

const wsConnected = computed(() => wsStore.connected)

const fetchHistory = async () => {
  if (!userStore.token) return
  loadingHistory.value = true
  try {
    const result = await listChatApi(userStore.token)
    const records = result.records || []
    chatMessages.value = records.map((m: MessageChatVO) => ({
      id: m.id,
      sender: m.senderId === userStore.userId ? 'me' : 'other',
      content: m.content,
      time: formatMsgTime(m.createTime),
    }))
  } catch {
    // 静默处理
  } finally {
    loadingHistory.value = false
  }
}

const sendMessage = () => {
  const content = messageInput.value.trim()
  if (!content) return
  if (!wsStore.connected) return

  const receiverId = otherUserId.value || chatNickname.value
  const sent = wsStore.sendChat(userStore.userId, receiverId, content)

  if (sent) {
    chatMessages.value.push({
      id: `local-${Date.now()}`,
      sender: 'me',
      content,
      time: getCurrentTime(),
    })
    messageInput.value = ''
    scrollToBottom()
  }
}

const handleWsMessage = (msg: WsMessage) => {
  if (msg.type !== 'CHAT') return

  // 判断是否属于当前会话
  const otherId = otherUserId.value || chatNickname.value
  if (msg.senderId !== otherId && msg.receiverId !== otherId) return

  chatMessages.value.push({
    id: `ws-${msg.timestamp}`,
    sender: msg.senderId === userStore.userId ? 'me' : 'other',
    content: msg.data || '',
    time: formatMsgTime(new Date(msg.timestamp).toISOString()),
  })
  scrollToBottom()
}

const getCurrentTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const formatMsgTime = (timeStr: string) => {
  if (!timeStr) return getCurrentTime()
  try {
    const d = new Date(timeStr)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return timeStr
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

onMounted(() => {
  if (userStore.token) {
    wsStore.connect(userStore.token)
  }

  removeListener = wsStore.addListener(handleWsMessage)
  fetchHistory()
  scrollToBottom()
})

onUnmounted(() => {
  if (removeListener) {
    removeListener()
    removeListener = null
  }
})
</script>

<style scoped>
.chat-page {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.chat-header {
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  background-image: linear-gradient(90deg, #0af, #0085ff);
}

.chat-header h2 {
  margin: 0;
  max-width: 80%;
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-message-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 12px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #999;
  gap: 8px;
  font-size: 14px;
}

.empty-chat {
  padding-top: 40px;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 14px;
}

.chat-message.is-me {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  background-color: #f2f2f2;
}

.message-body {
  max-width: 72%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.chat-message.is-me .message-body {
  align-items: flex-end;
}

.message-time {
  color: #999999;
  font-size: 11px;
  line-height: 1;
}

.message-body p {
  margin: 0;
  padding: 9px 11px;
  border-radius: 8px;
  color: #222222;
  font-size: 14px;
  line-height: 1.45;
  word-break: break-word;
  background-color: #ffffff;
}

.chat-message.is-me .message-body p {
  color: #ffffff;
  background-color: #0085ff;
}

.chat-input-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background-color: #ffffff;
  border-top: 1px solid #e8e8e8;
}

.chat-input-bar :deep(.el-input__wrapper) {
  border-radius: 18px;
}

.chat-input-bar :deep(.el-button) {
  margin-left: 0;
  border-radius: 18px;
}

.ws-status {
  position: fixed;
  bottom: 65px;
  left: 50%;
  transform: translateX(-50%);
  background: #fdf6ec;
  color: #e6a23c;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  z-index: 100;
}
</style>

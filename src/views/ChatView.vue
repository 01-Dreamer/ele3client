<template>
  <div class="chat-page">
    <header class="chat-header">
      <h2>{{ chatNickname }}</h2>
    </header>

    <main ref="messageListRef" class="chat-message-list" @scroll="onScroll">
      <div v-if="loadingHistory" class="loading-state">
        <el-icon class="is-loading" size="20"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="loadingMore" class="loading-state">
        <el-icon class="is-loading" size="16"><Loading /></el-icon>
        <span>加载历史消息...</span>
      </div>
      <div v-else-if="chatMessages.length === 0" class="empty-chat">
        <el-empty description="暂无消息" :image-size="60" />
      </div>

      <div
        v-for="(message, idx) in chatMessages"
        :key="idx"
        :class="['chat-message', message.sender === 'me' ? 'is-me' : 'is-other']"
      >
        <el-avatar class="message-avatar" :size="36"
          :src="message.sender === 'me' ? userStore.avatar : otherAvatar" />
        <div class="message-body">
          <span class="message-time">{{ message.time }}</span>
          <p>{{ message.content }}</p>
        </div>
      </div>
    </main>

    <footer class="chat-input-bar">
      <el-input v-model="messageInput" placeholder="输入消息" clearable
        :disabled="!wsConnected" @keyup.enter="sendMessage" />
      <el-button type="primary" :disabled="!wsConnected || !messageInput.trim()" @click="sendMessage">发送</el-button>
    </footer>

    <div v-if="!wsConnected" class="ws-status">正在连接...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useWebsocketStore, type WsMessage } from '@/stores/websocket'
import { listChatApi, clearUnreadApi, type MessageChatVO } from '@/api/message'
import { fetchUserBrief, getUserNickname, getUserAvatar } from '@/services/userBrief'

interface DisplayMessage { id: string; sender: 'me' | 'other'; content: string; time: string }

const route = useRoute()
const userStore = useUserStore()
const wsStore = useWebsocketStore()

const otherAvatar = ref('/default-avatar.svg')

const messageInput = ref('')
const messageListRef = ref<HTMLElement | null>(null)
const loadingHistory = ref(false)
const loadingMore = ref(false)
const chatMessages = ref<DisplayMessage[]>([])
const nextCursor = ref<string | undefined>(undefined)
const hasMore = ref(true)
let removeListener: (() => void) | null = null

const otherUserId = computed(() => (route.query.userId as string) || '')
const chatNickname = ref('聊天')

// 加载聊天对象信息。
const loadUserBrief = async () => {
  if (!otherUserId.value) return
  const brief = await fetchUserBrief(otherUserId.value)
  if (brief) {
    chatNickname.value = brief.nickname || otherUserId.value
    otherAvatar.value = brief.avatar || '/default-avatar.svg'
  } else {
    chatNickname.value = otherUserId.value
  }
}
const wsConnected = computed(() => wsStore.connected)

const toDisplay = (m: MessageChatVO): DisplayMessage => ({
  id: m.id,
  sender: m.senderId === userStore.userId ? 'me' : 'other',
  content: m.content,
  time: formatTime(m.createTime),
})

// 加载聊天历史。
const fetchHistory = async () => {
  loadingHistory.value = true
  try {
    const result = await listChatApi(undefined, 15)
    const records = (result.items || []) as MessageChatVO[]
    chatMessages.value = records
      .filter(m => otherUserId.value
        ? (m.senderId === otherUserId.value || m.receiverId === otherUserId.value)
        : true)
      .reverse()
      .map(toDisplay)
    nextCursor.value = result.nextCursor || undefined
    hasMore.value = result.hasMore ?? false
    await nextTick()
    scrollToBottom()
  } catch (e) { console.error('fetchHistory failed', e) }
  finally { loadingHistory.value = false }
}

// 加载更多数据。
const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  const prevHeight = messageListRef.value?.scrollHeight || 0
  try {
    const result = await listChatApi(nextCursor.value, 15)
    const records = (result.items || []) as MessageChatVO[]
    const older = records
      .filter(m => otherUserId.value
        ? (m.senderId === otherUserId.value || m.receiverId === otherUserId.value)
        : true)
      .reverse()
      .map(toDisplay)
    chatMessages.value.unshift(...older)
    nextCursor.value = result.nextCursor || undefined
    hasMore.value = result.hasMore ?? false
    await nextTick()
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight - prevHeight
    }
  } catch (e) { console.error('loadMore failed', e) }
  finally { loadingMore.value = false }
}

// 处理聊天列表滚动。
const onScroll = () => {
  if (messageListRef.value && messageListRef.value.scrollTop < 50) loadMore()
}

// 发送聊天消息。
const sendMessage = () => {
  const content = messageInput.value.trim()
  if (!content || !otherUserId.value) return
  const sent = wsStore.sendChat(userStore.userId, otherUserId.value, content)
  if (sent) {
    chatMessages.value.push({ id: `local-${Date.now()}`, sender: 'me', content, time: formatTime() })
    messageInput.value = ''
    scrollToBottom()
  }
}

// 处理 WebSocket 消息。
const handleWsMessage = (msg: WsMessage) => {
  if (msg.type !== 'CHAT') return
  if (!otherUserId.value) return
  if (msg.senderId !== otherUserId.value && msg.receiverId !== otherUserId.value) return
  chatMessages.value.push({
    id: `ws-${msg.timestamp}`,
    sender: msg.senderId === userStore.userId ? 'me' : 'other',
    content: typeof msg.data === 'string' ? msg.data : '',
    time: formatTime(new Date(msg.timestamp).toISOString()),
  })
  scrollToBottom()
}

// 格式化时间显示。
const formatTime = (t?: string) => {
  const d = t ? new Date(t) : new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// 滚动到消息列表底部。
const scrollToBottom = () => { nextTick(() => { if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight }) }

onMounted(() => {
  if (!wsStore.connected) wsStore.connect()
  removeListener = wsStore.addListener(handleWsMessage)
  loadUserBrief()
  fetchHistory()
  scrollToBottom()
})

onUnmounted(() => {
  if (removeListener) removeListener()
  const sid = route.query.sessionId as string
  if (sid) clearUnreadApi(sid).catch(() => {})
})
</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
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
  color: #fff;
  font-size: 20px;
  max-width: 80%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-message-list {
  flex: 1;
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
  background: #f2f2f2;
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
  color: #999;
  font-size: 11px;
}
.message-body p {
  margin: 0;
  padding: 9px 11px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.45;
  background: #fff;
  color: #222;
  word-break: break-word;
}
.chat-message.is-me .message-body p {
  background: #0085ff;
  color: #fff;
}
.chat-input-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #fff;
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
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  z-index: 100;
}
</style>

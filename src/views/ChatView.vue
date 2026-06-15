<template>
  <div class="chat-page">
    <header class="chat-header">
      <h2>{{ chatNickname }}</h2>
    </header>

    <main ref="messageListRef" class="chat-message-list">
      <div
        v-for="message in chatMessages"
        :key="message.id"
        :class="['chat-message', message.sender === 'me' ? 'is-me' : 'is-other']"
      >
        <el-avatar
          class="message-avatar"
          :size="36"
          :src="message.sender === 'me' ? currentUser.avatarUrl : chatUser.avatarUrl"
        />
        <div class="message-body">
          <span class="message-time">{{ message.time }}</span>
          <p>{{ message.content }}</p>
        </div>
      </div>
    </main>

    <footer class="chat-input-bar">
      <el-input
        v-model="messageInput"
        placeholder="输入消息"
        clearable
        @keyup.enter="sendMessage"
      />
      <el-button type="primary" @click="sendMessage">
        发送
      </el-button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

interface ChatUser {
  nickname: string
  avatarUrl: string
}

interface ChatMessage {
  id: number
  sender: 'me' | 'other'
  content: string
  time: string
}

const route = useRoute()
const messageInput = ref('')
const messageListRef = ref<HTMLElement | null>(null)
const defaultAvatarUrl = '/default-avatar.svg'

const chatNickname = computed(() => {
  const nickname = route.query.nickname
  return typeof nickname === 'string' && nickname ? nickname : '骑手小陈'
})

const currentUser: ChatUser = {
  nickname: '饿了么用户',
  avatarUrl: defaultAvatarUrl
}

const chatUser = computed<ChatUser>(() => ({
  nickname: chatNickname.value,
  avatarUrl: defaultAvatarUrl
}))

const chatMessages = ref<ChatMessage[]>([
  {
    id: 1,
    sender: 'other',
    content: '您好，我已经接到订单了，正在前往商家取餐。',
    time: '12:08'
  },
  {
    id: 2,
    sender: 'me',
    content: '好的，麻烦帮我看一下有没有备注不要香菜。',
    time: '12:09'
  },
  {
    id: 3,
    sender: 'other',
    content: '看到了，我会提醒商家。',
    time: '12:10'
  }
])

const sendMessage = () => {
  const content = messageInput.value.trim()

  if (!content) {
    return
  }

  chatMessages.value.push({
    id: Date.now(),
    sender: 'me',
    content,
    time: getCurrentTime()
  })

  messageInput.value = ''
  scrollToBottom()
}

const getCurrentTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

onMounted(scrollToBottom)
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
</style>

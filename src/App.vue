<template>
  <div class="app-container">
    <div class="content-wrap">
      <RouterView />
    </div>

    <GlobalRiskChallenge />

    <!-- AI Chat Window -->
    <transition name="el-zoom-in-bottom">
      <div 
        v-show="isAiOpen" 
        class="ai-chat-window"
        :style="{ transform: `translate(${translate.x}px, ${translate.y}px)` }"
      >
        <div class="chat-header" @mousedown="dragStart" @touchstart.passive="dragStart">
          <div class="header-title">
            <el-icon><Cpu /></el-icon> AI 助手
          </div>
          <el-button link type="info" @click.stop="closeAiChat">关闭</el-button>
        </div>
        
        <div class="chat-messages" ref="messageContainer">
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            :class="['message-bubble', msg.role === 'user' ? 'message-user' : 'message-ai']"
          >
            <div v-if="msg.role === 'ai' && msg.text === 'LOADING'" class="message-content message-loading">
              <span class="loading-dots">...</span>
            </div>
            <div v-else-if="msg.role === 'ai'" class="message-content message-md" v-html="renderMarkdown(msg.text)"></div>
            <div v-else class="message-content">{{ msg.text }}</div>
          </div>
        </div>
        
        <div class="chat-input-area">
          <el-input
            v-model="chatInput"
            placeholder="输入消息..."
            @keyup.enter="sendMessage"
          >
            <template #append>
              <el-button :icon="Position" @click="sendMessage"></el-button>
            </template>
          </el-input>
        </div>
      </div>
    </transition>

    <!-- 全局底部导航栏 -->
    <div class="bottom-nav">
      <div 
        class="nav-item" 
        :class="{ active: isNavActive('/') }" 
        @click="navigateTo('/')"
      >
        <el-icon size="22"><HomeFilled /></el-icon>
        <span>首页</span>
      </div>
      <div 
        class="nav-item" 
        :class="{ active: isNavActive('/message') }"
        @click="navigateTo('/message')"
      >
        <el-icon size="22"><Message /></el-icon>
        <span>消息</span>
      </div>
      
      <!-- AI Center Button -->
      <div 
        class="nav-item" 
        :class="{ 'ai-active': isAiOpen }"
        @click="toggleAiChat"
      >
        <el-icon size="22"><Cpu /></el-icon>
        <span>助手</span>
      </div>

      <div 
        class="nav-item" 
        :class="{ active: isNavActive('/order') }"
        @click="navigateTo('/order')"
      >
        <el-icon size="22"><Document /></el-icon>
        <span>订单</span>
      </div>
      <div 
        class="nav-item" 
        :class="{ active: isNavActive('/profile') }"
        @click="navigateTo('/profile')"
      >
        <el-icon size="22"><User /></el-icon>
        <span>我的</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { HomeFilled, Message, Document, User, Cpu, Position } from '@element-plus/icons-vue'
import GlobalRiskChallenge from '@/components/GlobalRiskChallenge.vue'
import { chatStreamApi, getChatHistoryApi, type ChatHistoryItem, type AgentContext } from '@/api/agent'
import { marked } from 'marked'
import { useLocationStore } from '@/stores/location'
import { getPageContext } from '@/services/pageContext'

const router = useRouter()
const route = useRoute()
const locationStore = useLocationStore()

// Map routes to nav labels for setting active state
const isNavActive = (path: string) => {
  return route.path === path || (path === '/' && route.path === '/home')
}

const navigateTo = (path: string) => {
  router.push(path)
}

// AI Chat Logic
const isAiOpen = ref(false)
const chatInput = ref('')
const messages = ref<{role: 'user'|'ai'|'tool', text: string}[]>([])
const messageContainer = ref<HTMLElement | null>(null)

const renderMarkdown = (text: string) => {
  if (!text) return ''
  return marked.parse(text) as string
}
const loadingHistory = ref(false)
const historyCursor = ref<string | undefined>(undefined)
const historyHasMore = ref(true)

const loadHistory = async () => {
  loadingHistory.value = true
  try {
    const result = await getChatHistoryApi(undefined, 30)
    const items = (result.records as ChatHistoryItem[]) || []
    messages.value = items.reverse().map(m => ({
      role: (m.role === 'AGENT' ? 'ai' : m.role === 'USER' ? 'user' : 'tool') as 'user' | 'ai' | 'tool',
      text: m.content,
    }))
    historyCursor.value = result.nextCursor || undefined
    historyHasMore.value = result.hasMore ?? false
    await nextTick()
    scrollToBottom()
  } catch { /* */ }
  finally { loadingHistory.value = false }
}

const toggleAiChat = () => {
  if (!isAiOpen.value) {
    isAiOpen.value = true
    if (messages.value.length === 0) loadHistory()
  }
}

const closeAiChat = () => {
  isAiOpen.value = false
}

const aiLoading = ref(false)

const sendMessage = async () => {
  const text = chatInput.value.trim()
  if (!text || aiLoading.value) return

  messages.value.push({ role: 'user', text })
  chatInput.value = ''
  scrollToBottom()
  aiLoading.value = true

  // 预占 AI 回复位置，显示加载动画
  const aiIdx = messages.value.push({ role: 'ai', text: 'LOADING' }) - 1

  try {
    const ctx: AgentContext = {
      longitude: locationStore.currentCoordinate?.longitude,
      latitude: locationStore.currentCoordinate?.latitude,
      address: locationStore.currentAddress,
      pageContext: getPageContext(),
    }
    const stream = await chatStreamApi(text, ctx)
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let currentEvent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''

      for (const part of parts) {
        const lines = part.split('\n')
        let eventType = ''
        let dataLines: string[] = []
        for (const line of lines) {
          if (line.startsWith('event:')) eventType = line.slice(6).trim()
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
        }
        const data = dataLines.join('\n')
        if (!data) continue

        if (eventType === 'tool_call') {
          try {
            const obj = JSON.parse(data)
            messages.value[aiIdx].text = obj.status || data
          } catch { messages.value[aiIdx].text = data }
        } else if (eventType === 'tool_result') {
          messages.value[aiIdx].text += ' ' + data
        } else if (eventType === 'reply') {
          messages.value[aiIdx].text = data
        } else if (eventType === 'error') {
          messages.value.splice(aiIdx, 1)
          ElMessage({ message: data, type: 'error', duration: 2000 })
          break
        }
      }
    }
  } catch (e: any) {
    messages.value.splice(aiIdx, 1)  // 移除占位
    ElMessage({ message: e?.message || '请求失败', type: 'error', duration: 2000 })
  } finally {
    aiLoading.value = false
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

// AI Chat Drag Logic
const translate = ref({ x: 0, y: 0 })
let startPos = { x: 0, y: 0 }

const dragStart = (e: any) => {
  let clientX = 0;
  let clientY = 0;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.clientX !== undefined) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    return;
  }
  startPos = { x: clientX - translate.value.x, y: clientY - translate.value.y }
  
  document.addEventListener('mousemove', dragMove)
  document.addEventListener('mouseup', dragEnd)
  document.addEventListener('touchmove', dragMove, { passive: false })
  document.addEventListener('touchend', dragEnd)
}

const dragMove = (e: any) => {
  let clientX = 0;
  let clientY = 0;
  if (e.touches && e.touches.length > 0) {
    e.preventDefault(); // Prevent scrolling while dragging
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.clientX !== undefined) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    return;
  }
  translate.value.x = clientX - startPos.x
  translate.value.y = clientY - startPos.y
}

const dragEnd = () => {
  document.removeEventListener('mousemove', dragMove)
  document.removeEventListener('mouseup', dragEnd)
  document.removeEventListener('touchmove', dragMove)
  document.removeEventListener('touchend', dragEnd)
}
</script>

<style scoped>
.app-container {
  max-width: 414px; /* Mobile width simulation */
  margin: 0 auto;
  height: 100vh;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  position: relative;
  display: flex;
  flex-direction: column;
}

.content-wrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.bottom-nav {
  height: 55px;
  background-color: #fafafa;
  border-top: 1px solid #ebebeb;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
  font-size: 11px;
  cursor: pointer;
  gap: 3px;
  transition: color 0.2s;
}

.nav-item.active {
  color: #00aaff;
}

.nav-item.ai-active {
  color: #67c23a;
}

/* AI Chat Window Styles */
.ai-chat-window {
  position: absolute;
  bottom: 60px; /* Above the nav bar */
  left: 10px;
  right: 10px;
  height: 400px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  z-index: 90;
  overflow: hidden;
  transition: transform 0.1s ease-out; /* Smooth drag */
}

.ai-chat-window.is-dragging {
  transition: none; /* Removed transition while dragging */
}

.chat-header {
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: grab;
  user-select: none;
}

.chat-header:active {
  cursor: grabbing;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: bold;
  color: #333;
}

.chat-messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-bubble {
  max-width: 80%;
  display: flex;
}

.message-content {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}
.message-loading {
  padding: 12px 20px;
  font-size: 18px;
}
.loading-dots {
  animation: dotPulse 1.4s infinite;
}
@keyframes dotPulse {
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}
.message-md {
  padding: 10px 14px;
}
.message-md :deep(table) {
  border-collapse: collapse;
  margin: 6px 0;
  font-size: 12px;
}
.message-md :deep(th), .message-md :deep(td) {
  border: 1px solid #ddd;
  padding: 4px 8px;
  text-align: left;
}
.message-md :deep(th) {
  background: #f5f5f5;
}
.message-md :deep(p) { margin: 4px 0; }
.message-md :deep(strong) { font-weight: 600; }
.message-md :deep(code) {
  background: rgba(0,0,0,0.05);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 13px;
}
.message-md :deep(pre) {
  background: rgba(0,0,0,0.05);
  padding: 8px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
}

.message-user {
  align-self: flex-end;
}

.message-user .message-content {
  background-color: #ecf5ff;
  color: #409eff;
  border-bottom-right-radius: 2px;
}

.message-ai {
  align-self: flex-start;
}

.message-ai .message-content {
  background-color: #f0f2f5;
  color: #333;
  border-bottom-left-radius: 2px;
}

.chat-input-area {
  padding: 10px;
  border-top: 1px solid #ebeef5;
}
</style>

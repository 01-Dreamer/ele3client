<template>
  <div class="app-container">
    <div class="content-wrap">
      <RouterView />
    </div>

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
            <div class="message-content">{{ msg.text }}</div>
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
import { RouterView, useRouter, useRoute } from 'vue-router'
import { HomeFilled, Message, Document, User, Cpu, Position } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

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
const messages = ref<{role: 'user'|'ai', text: string}[]>([
  { role: 'ai', text: '你好！我是你的专属AI小助手，有什么可以帮你的吗？' }
])
const messageContainer = ref<HTMLElement | null>(null)

const toggleAiChat = () => {
  if (!isAiOpen.value) {
    isAiOpen.value = true
  }
}

const closeAiChat = () => {
  isAiOpen.value = false
}

const sendMessage = () => {
  if (!chatInput.value.trim()) return
  
  // Add user message
  messages.value.push({ role: 'user', text: chatInput.value })
  const currentUserInput = chatInput.value
  chatInput.value = ''
  
  scrollToBottom()
  
  // Simulate AI response
  setTimeout(() => {
    messages.value.push({ role: 'ai', text: '你好' })
    scrollToBottom()
  }, 500)
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
  word-break: break-well;
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

<template>
  <div class="message-page">
    <header class="message-header">
      <h2>消息</h2>
    </header>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" stretch class="msg-tabs">
      <el-tab-pane label="会话" name="session" />
      <el-tab-pane label="通知" name="notice" />
    </el-tabs>

    <!-- 会话列表 -->
    <ul v-if="activeTab === 'session'" class="conversation-list">
      <div v-if="sessionLoading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
      </div>

      <li
        v-for="conv in sessions"
        :key="conv.id"
        class="conversation-item"
        @click="openChat(conv)"
      >
        <el-badge
          class="avatar-badge"
          :value="sessionUnread(conv)"
          :hidden="sessionUnread(conv) === 0"
        >
          <el-avatar
            class="avatar"
            shape="square"
            :size="48"
            :src="getSessionAvatar(conv)"
          />
        </el-badge>

        <div class="conversation-main">
          <div class="conversation-top">
            <h3>{{ getSessionName(conv) }}</h3>
            <span class="message-time">{{ formatTime(conv.lastMessageTime) }}</span>
          </div>
          <div class="conversation-bottom">
            <p>{{ conv.lastMessageContent }}</p>
          </div>
        </div>
      </li>

      <el-empty v-if="!sessionLoading && sessions.length === 0" description="暂无会话" :image-size="60" />
    </ul>

    <!-- 通知列表 -->
    <ul v-if="activeTab === 'notice'" class="conversation-list">
      <div v-if="noticeLoading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
      </div>

      <li
        v-for="notice in notices"
        :key="notice.id"
        class="conversation-item"
        @click="readNotice(notice.id)"
      >
        <el-badge
          class="avatar-badge"
          :value="notice.isRead ? 0 : 1"
          :hidden="notice.isRead === 1"
        >
          <el-avatar
            class="avatar notice-avatar"
            shape="square"
            :size="48"
            :icon="Bell"
          />
        </el-badge>

        <div class="conversation-main">
          <div class="conversation-top">
            <h3>{{ notice.title }}</h3>
            <span class="message-time">{{ formatTime(notice.createTime) }}</span>
          </div>
          <div class="conversation-bottom">
            <p>{{ notice.content }}</p>
          </div>
        </div>
      </li>

      <el-empty v-if="!noticeLoading && notices.length === 0" description="暂无通知" :image-size="60" />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Bell, Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { listSessionApi, listNoticeApi, readNoticeApi, clearUnreadApi, type MessageSessionVO, type MessageNoticeVO } from '@/api/message'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('session')
const sessions = ref<MessageSessionVO[]>([])
const notices = ref<MessageNoticeVO[]>([])
const sessionLoading = ref(false)
const noticeLoading = ref(false)

const sessionUnread = (s: MessageSessionVO) => {
  const myId = userStore.userId
  if (!myId) return 0
  return myId === s.smallerUserId ? s.smallerUserUnreadCount : s.largerUserUnreadCount
}

const getSessionName = (s: MessageSessionVO) => {
  const myId = userStore.userId
  if (!myId) return '对方'
  return myId === s.smallerUserId ? s.largerUserId : s.smallerUserId
}

const getSessionAvatar = (_s: MessageSessionVO) => '/default-avatar.svg'

const fetchSessions = async () => {
  if (!userStore.token) return
  sessionLoading.value = true
  try {
    const result = await listSessionApi(userStore.token)
    sessions.value = result.records || []
  } catch {
    // 静默处理
  } finally {
    sessionLoading.value = false
  }
}

const fetchNotices = async () => {
  if (!userStore.token) return
  noticeLoading.value = true
  try {
    const result = await listNoticeApi(userStore.token)
    notices.value = result.records || []
  } catch {
    // 静默处理
  } finally {
    noticeLoading.value = false
  }
}

const openChat = (s: MessageSessionVO) => {
  const otherId = getSessionName(s)
  router.push({
    path: '/chat',
    query: {
      nickname: otherId,
      userId: otherId,
    },
  })
}

const readNotice = async (noticeId: string) => {
  if (!userStore.token) return
  try {
    await readNoticeApi(noticeId, userStore.token)
    // 更新本地状态
    const n = notices.value.find(item => item.id === noticeId)
    if (n) n.isRead = 1
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  }
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    if (diff < 172800000) return '昨天'
    return `${d.getMonth() + 1}月${d.getDate()}日`
  } catch {
    return timeStr
  }
}

onMounted(() => {
  fetchSessions()
  fetchNotices()
})
</script>

<style scoped>
.message-page {
  min-height: 100%;
  background-color: #f5f5f5;
}

.message-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  background-image: linear-gradient(90deg, #0af, #0085ff);
}

.message-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

.msg-tabs {
  background-color: #ffffff;
}

.msg-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.msg-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

.conversation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background-color: #ffffff;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 30px;
  color: #999;
}

.conversation-item {
  display: flex;
  align-items: center;
  min-height: 76px;
  padding: 9px 12px;
  cursor: pointer;
}

.conversation-item:active {
  background-color: #eeeeee;
}

.avatar-badge {
  flex-shrink: 0;
}

.avatar-badge :deep(.el-badge__content) {
  top: 1px;
  right: 5px;
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  border: 2px solid #ffffff;
  line-height: 15px;
}

.avatar {
  border-radius: 6px;
  background-color: #f2f2f2;
  overflow: hidden;
}

.notice-avatar {
  background-color: #e6f7ff;
  color: #0085ff;
}

.conversation-main {
  min-width: 0;
  flex: 1;
  height: 58px;
  padding: 5px 0 8px 12px;
  border-bottom: 1px solid #eeeeee;
}

.conversation-top,
.conversation-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.conversation-top h3 {
  margin: 0;
  min-width: 0;
  flex: 1;
  color: #111111;
  font-size: 17px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-time {
  flex-shrink: 0;
  margin-left: 8px;
  color: #999999;
  font-size: 13px;
}

.conversation-bottom {
  margin-top: 8px;
}

.conversation-bottom p {
  margin: 0;
  min-width: 0;
  flex: 1;
  color: #999999;
  font-size: 15px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

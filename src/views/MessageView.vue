<template>
  <div class="message-page">
    <header class="message-header">
      <h2>消息</h2>
    </header>

    <el-tabs v-model="activeTab" stretch class="msg-tabs">
      <el-tab-pane label="会话" name="session" />
      <el-tab-pane label="通知" name="notice" />
    </el-tabs>
<template v-if="activeTab === 'session'">
      <div v-if="sessionLoading" class="loading-state">
        <el-icon class="is-loading" size="20"><Loading /></el-icon>
      </div>
      <el-empty v-else-if="sessions.length === 0" description="暂无会话" :image-size="80" />
      <ul v-else class="msg-list">
        <li v-for="s in sessions" :key="s.id" class="msg-item" @click="openChat(s)">
          <el-badge :value="sessionUnread(s)" :hidden="sessionUnread(s) === 0">
            <el-avatar shape="square" :size="48" :src="getSessionAvatar(s)" />
          </el-badge>
          <div class="msg-main">
            <div class="msg-top">
              <h3>{{ getSessionName(s) }}</h3>
              <span class="msg-time">{{ formatTime(s.lastMessageTime) }}</span>
            </div>
            <div class="msg-bottom"><p>{{ s.lastMessageContent || '' }}</p></div>
          </div>
          <el-icon class="hide-icon" @click.stop="confirmHide(s)"><Close /></el-icon>
        </li>
      </ul>
    </template>

    <template v-if="activeTab === 'notice'">
      <div class="notice-top-bar">
        <el-button size="small" @click="readAll">全部已读</el-button>
      </div>
      <div v-if="noticeLoading" class="loading-state">
        <el-icon class="is-loading" size="20"><Loading /></el-icon>
      </div>
      <el-empty v-else-if="notices.length === 0" description="暂无通知" :image-size="80" />
      <ul v-else class="msg-list">
        <li v-for="n in notices" :key="n.id" class="msg-item" :class="{ unread: n.isRead === 0 }" @click="openNotice(n)">
          <div class="msg-main" style="margin-left:0">
            <div class="msg-top">
              <h3>{{ n.title }}</h3>
              <div class="msg-top-right">
                <span v-if="n.isRead === 0" class="unread-dot"></span>
                <span class="msg-time">{{ formatTime(n.createTime) }}</span>
              </div>
            </div>
            <div class="msg-bottom"><p>{{ n.content }}</p></div>
          </div>
        </li>
      </ul>
    </template>

    <el-dialog v-model="noticeDialogVisible" :title="noticeDialogTitle" width="85%">
      <p style="white-space:pre-wrap;color:#333;font-size:14px;line-height:1.6">{{ noticeDialogContent }}</p>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Close } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { listSessionApi, listNoticeApi, readNoticeApi, readAllNoticeApi, clearUnreadApi, hideSessionApi, type MessageSessionVO, type MessageNoticeVO } from '@/api/message'
import { showErrorMessage } from '@/api/http'
import { fetchUserBriefs, getUserNickname, getUserAvatar } from '@/services/userBrief'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('session')
const sessions = ref<MessageSessionVO[]>([])
const notices = ref<MessageNoticeVO[]>([])
const sessionLoading = ref(false)
const noticeLoading = ref(false)

// 处理 sessionUnread 逻辑。
const sessionUnread = (s: MessageSessionVO) => {
  const myId = userStore.userId
  if (!myId) return 0
  return myId === s.smallerUserId ? s.smallerUserUnreadCount : s.largerUserUnreadCount
}
// 处理 getSessionName 逻辑。
const getSessionName = (s: MessageSessionVO) => {
  const myId = userStore.userId; if (!myId) return '对方'
  const otherId = myId === s.smallerUserId ? s.largerUserId : s.smallerUserId
  return getUserNickname(otherId)
}
// 处理 getSessionAvatar 逻辑。
const getSessionAvatar = (s: MessageSessionVO) => {
  const myId = userStore.userId; if (!myId) return '/default-avatar.svg'
  const otherId = myId === s.smallerUserId ? s.largerUserId : s.smallerUserId
  return getUserAvatar(otherId)
}

// 加载消息会话。
const fetchSessions = async () => {
  sessionLoading.value = true
  try {
    sessions.value = (await listSessionApi()).items || []
    // 批量拉取对方用户信息
    const myId = userStore.userId
    const otherIds = sessions.value.map(s => myId === s.smallerUserId ? s.largerUserId : s.smallerUserId)
    await fetchUserBriefs(otherIds)
  } catch (e) { showErrorMessage(e) }
  finally { sessionLoading.value = false }
}

// 加载通知列表。
const fetchNotices = async () => {
  noticeLoading.value = true
  try { notices.value = (await listNoticeApi()).items || [] }
  catch (e) { showErrorMessage(e) }
  finally { noticeLoading.value = false }
}

// 打开聊天会话。
const openChat = async (s: MessageSessionVO) => {
  // 清除未读
  try { await clearUnreadApi(s.id) } catch { /* */ }
  const myId = userStore.userId
  // 本地清零
  if (myId === s.smallerUserId) s.smallerUserUnreadCount = 0
  else s.largerUserUnreadCount = 0
  const otherId = myId === s.smallerUserId ? s.largerUserId : s.smallerUserId
  router.push({ path: '/chat', query: { userId: otherId, nickname: getUserNickname(otherId), sessionId: s.id } })
}

// 确认隐藏会话。
const confirmHide = async (s: MessageSessionVO) => {
  try {
    await ElMessageBox.confirm('隐藏该会话？', '提示', { confirmButtonText: '隐藏', cancelButtonText: '取消', type: 'warning' })
    await hideSessionApi(s.id)
    sessions.value = sessions.value.filter(item => item.id !== s.id)
  } catch { /* 取消 */ }
}

const noticeDialogVisible = ref(false)
const noticeDialogTitle = ref('')
const noticeDialogContent = ref('')
let noticeDialogTarget: MessageNoticeVO | null = null

// 全部通知标记已读。
const readAll = async () => {
  try {
    await readAllNoticeApi()
    notices.value.forEach(n => { n.isRead = 1 })
  } catch (e) { showErrorMessage(e) }
}

// 打开通知详情。
const openNotice = (n: MessageNoticeVO) => {
  noticeDialogTarget = n
  noticeDialogTitle.value = n.title
  noticeDialogContent.value = n.content
  noticeDialogVisible.value = true
  if (n.isRead === 0) {
    readNoticeApi(n.id).then(() => { n.isRead = 1 }).catch(() => {})
  }
}

// 标记通知已读。
const readNotice = async (n: MessageNoticeVO) => {
  if (n.isRead === 1) return
  try {
    await readNoticeApi(n.id)
    n.isRead = 1
  } catch (e) { showErrorMessage(e) }
}

// 格式化时间显示。
const formatTime = (t: string) => {
  if (!t) return ''
  try {
    const d = new Date(t)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    if (diff < 172800000) return '昨天'
    return `${d.getMonth() + 1}月${d.getDate()}日`
  } catch { return t }
}

onMounted(() => { fetchSessions(); fetchNotices() })
</script>

<style scoped>
.message-page {
  min-height: 100%;
  background: #f5f5f5;
}
.message-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(90deg, #0af, #0085ff);
}
.message-header h2 {
  margin: 0;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}
.msg-tabs {
  background: #fff;
}
.msg-tabs :deep(.el-tabs__header) {
  margin: 0;
}
.msg-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 0;
}
.notice-top-bar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  background: #fff;
}
.loading-state {
  display: flex;
  justify-content: center;
  padding: 30px;
  color: #999;
}
.msg-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: #fff;
}
.msg-item {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}
.msg-item:active {
  background: #f5f5f5;
}
.msg-item.unread {
  background: #f0f7ff;
}
.msg-main {
  flex: 1;
  min-width: 0;
}
.msg-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.msg-top h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.msg-top-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 8px;
}
.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f56c6c;
  flex-shrink: 0;
}
.msg-time {
  font-size: 12px;
  color: #999;
}
.msg-bottom p {
  margin: 0;
  font-size: 14px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hide-icon {
  flex-shrink: 0;
  color: #ccc;
  cursor: pointer;
  font-size: 14px;
}
</style>

<template>
  <div class="message-page">
    <header class="message-header">
      <h2>消息</h2>
    </header>

    <ul class="conversation-list">
      <li
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversation-item"
        @click="openChat(conversation)"
      >
        <el-badge
          class="avatar-badge"
          :value="conversation.unreadCount"
          :hidden="!conversation.unreadCount"
        >
          <el-avatar
            class="avatar"
            shape="square"
            :size="48"
            :src="conversation.avatarUrl"
          />
        </el-badge>

        <div class="conversation-main">
          <div class="conversation-top">
            <h3>{{ conversation.nickname }}</h3>
            <span class="message-time">{{ conversation.messageTime }}</span>
          </div>

          <div class="conversation-bottom">
            <p>{{ conversation.latestMessage }}</p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface Conversation {
  id: number
  avatarUrl: string
  nickname: string
  messageTime: string
  latestMessage: string
  unreadCount: number
}

const conversations = ref<Conversation[]>([
  {
    id: 1,
    avatarUrl: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/sj01.png',
    nickname: '文件传输助手',
    messageTime: '昨天 15:25',
    latestMessage: 'https://synxlab.feishu.cn/share/base/form/shrcn...',
    unreadCount: 0
  },
  {
    id: 2,
    avatarUrl: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/sj02.png',
    nickname: '饿了么客服',
    messageTime: '10:48',
    latestMessage: '您的订单已送达，欢迎对本次服务进行评价。',
    unreadCount: 2
  },
  {
    id: 3,
    avatarUrl: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/dcfl05.png',
    nickname: '优惠活动通知',
    messageTime: '09:12',
    latestMessage: '今日有满减红包待领取，附近好店正在热卖。',
    unreadCount: 1
  },
  {
    id: 4,
    avatarUrl: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/dcfl03.png',
    nickname: '骑手小陈',
    messageTime: '周日',
    latestMessage: '我已经到楼下了，方便下来取一下餐吗？',
    unreadCount: 0
  },
  {
    id: 5,
    avatarUrl: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/sj01.png',
    nickname: '万家饺子（软件园店）',
    messageTime: '周六',
    latestMessage: '新品虾仁水饺上线，老顾客下单享折扣。',
    unreadCount: 0
  }
])

const router = useRouter()

const openChat = (conversation: Conversation) => {
  router.push({
    path: '/chat',
    query: {
      nickname: conversation.nickname
    }
  })
}
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

.conversation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background-color: #ffffff;
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

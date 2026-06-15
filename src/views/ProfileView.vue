<template>
  <div class="profile-page">
    <header class="profile-header">
      <h2>我的</h2>
    </header>

    <section class="profile-card">
      <el-avatar
        class="profile-avatar"
        :size="68"
        :src="userProfile.avatarUrl"
      />

      <div class="profile-info">
        <h3>{{ userProfile.nickname }}</h3>
        <p>{{ userProfile.phone }}</p>
      </div>
    </section>

    <section class="balance-section">
      <div class="balance-main">
        <span>账户余额</span>
        <strong>&yen;{{ userProfile.balance.toFixed(2) }}</strong>
      </div>
      <div class="balance-actions">
        <el-button type="primary" plain round>充值</el-button>
        <el-button type="success" plain round>提现</el-button>
      </div>
    </section>

    <section class="info-list">
      <div class="info-item">
        <el-button type="primary" link class="profile-link-btn" @click="router.push('/location')">
          位置管理
        </el-button>
        <strong>{{ userProfile.currentAddress }}</strong>
      </div>
      <div class="info-item">
        <el-button type="primary" link class="profile-link-btn">我的店铺</el-button>
        <strong>{{ userProfile.shopName }}</strong>
      </div>
    </section>

    <section class="bind-card">
      <div class="bind-card-title">身份绑定</div>
      <div
        v-for="item in bindOptions"
        :key="item.name"
        class="bind-item"
      >
        <div class="bind-left">
          <span class="bind-icon" :style="{ backgroundColor: item.color }">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
          </span>
          <span>{{ item.name }}</span>
        </div>
        <span class="bind-account">{{ item.account }}</span>
        <el-tag size="small" effect="plain" :type="item.account ? 'primary' : 'info'">
          {{ item.account ? '切换绑定' : '未绑定' }}
        </el-tag>
      </div>
    </section>

    <section class="account-actions">
      <el-button plain round>切换账号</el-button>
      <el-button type="danger" plain round>安全退出</el-button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChatRound, Message, Money, School } from '@element-plus/icons-vue'

interface UserProfile {
  nickname: string
  phone: string
  avatarUrl: string
  balance: number
  currentAddress: string
  shopName: string
}

interface BindOption {
  name: string
  color: string
  icon: typeof Money
  account: string
}

const userProfile = ref<UserProfile>({
  nickname: '饿了么用户',
  phone: '138****8888',
  avatarUrl: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/sj02.png',
  balance: 88.5,
  currentAddress: '成都市天府软件园D区',
  shopName: '万家饺子（软件园店）'
})

const router = useRouter()

const bindOptions = ref<BindOption[]>([
  {
    name: '邮箱',
    color: '#409eff',
    icon: Message,
    account: ''
  },
  {
    name: '支付宝',
    color: '#1677ff',
    icon: Money,
    account: ''
  },
  {
    name: '微信',
    color: '#07c160',
    icon: ChatRound,
    account: ''
  },
  {
    name: '今日校园',
    color: '#f5a623',
    icon: School,
    account: '20231120171'
  }
])
</script>

<style scoped>
.profile-page {
  min-height: 100%;
  background-color: #f5f5f5;
}

.profile-header {
  padding: 0 18px;
  background-image: linear-gradient(90deg, #0af, #0085ff);
  color: #ffffff;
}

.profile-header h2 {
  height: 52px;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

.profile-card {
  display: flex;
  align-items: center;
  margin: 12px;
  padding: 16px;
  border-radius: 8px;
  background-color: #ffffff;
}

.profile-avatar {
  flex-shrink: 0;
  border: 3px solid #f0f7ff;
  background-color: #f2f2f2;
}

.profile-info {
  min-width: 0;
  margin-left: 14px;
}

.profile-info h3 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  color: #222222;
}

.profile-info p {
  margin: 0;
  color: #888888;
  font-size: 14px;
}

.balance-section {
  margin: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 8px;
  background-color: #ffffff;
}

.balance-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.balance-main span {
  color: #666666;
  font-size: 14px;
}

.balance-main strong {
  color: #ff5339;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}

.balance-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.balance-actions :deep(.el-button) {
  margin-left: 0;
}

.info-list {
  margin: 0 12px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 50px;
  padding: 0 14px;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item span {
  flex-shrink: 0;
  color: #666666;
  font-size: 14px;
}

.profile-link-btn {
  flex-shrink: 0;
  padding: 0;
  font-size: 14px;
}

.info-item strong {
  min-width: 0;
  color: #222222;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bind-card {
  margin: 12px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
}

.bind-card-title {
  padding: 14px;
  color: #222222;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}

.bind-item {
  min-height: 54px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.bind-item:last-child {
  border-bottom: none;
}

.bind-left {
  width: 108px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #222222;
  font-size: 14px;
}

.bind-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 17px;
}

.bind-account {
  min-width: 0;
  flex: 1;
  color: #666666;
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-actions {
  margin: 16px 12px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.account-actions :deep(.el-button) {
  width: 100%;
  margin-left: 0;
}
</style>

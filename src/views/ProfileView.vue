<template>
  <div class="profile-page">
    <header class="profile-header">
      <h2>我的</h2>
    </header>

    <section class="profile-card">
      <el-avatar
        class="profile-avatar"
        :size="68"
        :src="userStore.avatar"
      />

      <div class="profile-info">
        <h3>{{ userStore.nickname }}</h3>
        <p>{{ userStore.userInfo?.email || '' }}</p>
      </div>
    </section>

    <section class="balance-section">
      <div class="balance-main">
        <span>账户余额</span>
        <strong>&yen;{{ balance.toFixed(2) }}</strong>
      </div>
      <div class="balance-actions">
        <el-button type="primary" plain round @click="handleRecharge">充值</el-button>
        <el-button type="success" plain round @click="handleWithdraw">提现</el-button>
      </div>
    </section>

    <section class="info-list">
      <div class="info-item">
        <el-button type="primary" link class="profile-link-btn" @click="router.push('/location')">
          位置管理
        </el-button>
        <strong>{{ locationStore.currentAddress }}</strong>
      </div>
      <div class="info-item">
        <el-button type="primary" link class="profile-link-btn" @click="router.push('/shop')">
          我的店铺
        </el-button>
        <strong>查看店铺</strong>
      </div>
    </section>

    <section class="bind-card">
      <div class="bind-card-title">账号信息</div>
      <div class="bind-item">
        <div class="bind-left">
          <span class="bind-icon" style="background-color: #409eff;">
            <el-icon><Message /></el-icon>
          </span>
          <span>邮箱</span>
        </div>
        <span class="bind-account">{{ userStore.userInfo?.email || '未绑定' }}</span>
      </div>
      <div class="bind-item">
        <div class="bind-left">
          <span class="bind-icon" style="background-color: #67c23a;">
            <el-icon><User /></el-icon>
          </span>
          <span>角色</span>
        </div>
        <el-tag size="small" effect="plain">{{ roleLabel }}</el-tag>
      </div>
      <div class="bind-item">
        <div class="bind-left">
          <span class="bind-icon" style="background-color: #e6a23c;">
            <el-icon><Key /></el-icon>
          </span>
          <span>密码</span>
        </div>
        <el-button type="primary" link size="small" @click="showChangePassword = true">
          修改密码
        </el-button>
      </div>
    </section>

    <section class="account-actions">
      <el-button v-if="!userStore.isLoggedIn" type="primary" round @click="router.push('/login')">
        登录 / 注册
      </el-button>
      <el-button v-else type="danger" plain round @click="handleLogout">
        安全退出
      </el-button>
    </section>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showChangePassword" title="修改密码" width="90%">
      <el-form label-position="top" size="default">
        <el-form-item label="旧密码">
          <el-input v-model="pwForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="邮箱验证码">
          <div style="display:flex;gap:8px;">
            <el-input v-model="pwForm.emailCaptcha" placeholder="验证码" />
            <el-button
              :loading="pwSending"
              :disabled="pwCountdown > 0"
              @click="sendChangePwCaptcha"
            >
              {{ pwCountdown > 0 ? `${pwCountdown}s` : '获取' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangePassword = false">取消</el-button>
        <el-button type="primary" :loading="pwSubmitting" @click="submitChangePassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Message, Key } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useLocationStore } from '@/stores/location'
import { getBalanceApi, alipayRechargeApi, alipayWithdrawApi } from '@/api/payment'
import { changePasswordApi, sendChangePasswordEmailCaptchaApi } from '@/api/auth'

const userStore = useUserStore()
const locationStore = useLocationStore()
const router = useRouter()

const balance = ref(0)
const showChangePassword = ref(false)

const loadingBalance = ref(false)

const pwForm = reactive({
  oldPassword: '',
  newPassword: '',
  emailCaptcha: '',
})
const pwSubmitting = ref(false)
const pwSending = ref(false)
const pwCountdown = ref(0)
let pwTimer: number | undefined

const roleLabel = computedRoleLabel()

function computedRoleLabel() {
  const role = userStore.userInfo?.role
  const map: Record<string, string> = {
    USER: '普通用户',
    ADMIN: '管理员',
    MERCHANT: '商家',
    RIDER: '骑手',
  }
  return map[role || ''] || role || '普通用户'
}

const fetchBalance = async () => {
  if (!userStore.token) return
  loadingBalance.value = true
  try {
    const result = await getBalanceApi(userStore.token)
    balance.value = result.balance
  } catch {
    // 未登录或接口不可用时静默处理
  } finally {
    loadingBalance.value = false
  }
}

const handleRecharge = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const amount = 20
    const result = await alipayRechargeApi({ amount }, userStore.token)
    ElMessage.success(`充值订单已创建：${result.payUrl}`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '充值失败')
  }
}

const handleWithdraw = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const amount = 10
    const result = await alipayWithdrawApi(
      { alipayUserId: 'example', amount },
      userStore.token
    )
    ElMessage.success(`提现申请已提交，状态：${result.status}`)
    fetchBalance()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '提现失败')
  }
}

const sendChangePwCaptcha = async () => {
  if (!userStore.token || !userStore.userInfo?.email) return
  pwSending.value = true
  try {
    await sendChangePasswordEmailCaptchaApi(
      {
        email: userStore.userInfo.email,
        captchaId: '',
        captchaData: {},
      },
      userStore.token
    )
    ElMessage.success('验证码已发送')
    pwCountdown.value = 60
    pwTimer = window.setInterval(() => {
      pwCountdown.value--
      if (pwCountdown.value <= 0 && pwTimer) {
        clearInterval(pwTimer)
        pwTimer = undefined
      }
    }, 1000)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '发送失败')
  } finally {
    pwSending.value = false
  }
}

const submitChangePassword = async () => {
  if (!userStore.token) return
  if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.emailCaptcha) {
    ElMessage.warning('请填写完整信息')
    return
  }
  pwSubmitting.value = true
  try {
    await changePasswordApi(
      {
        oldPassword: pwForm.oldPassword,
        emailCaptcha: pwForm.emailCaptcha,
        newPassword: pwForm.newPassword,
      },
      userStore.token
    )
    ElMessage.success('密码修改成功，请重新登录')
    showChangePassword.value = false
    handleLogout()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '修改失败')
  } finally {
    pwSubmitting.value = false
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  }).catch(() => {})
}

onMounted(() => {
  fetchBalance()
})
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
  display: flex;
  justify-content: center;
}

.account-actions :deep(.el-button) {
  min-width: 200px;
  margin-left: 0;
}
</style>

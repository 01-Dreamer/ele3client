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
        <el-button type="primary" link class="profile-link-btn" @click="router.push('/my-shops')">
          我的店铺
        </el-button>
        <strong>管理店铺</strong>
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
        <div class="bind-right">
          <span class="bind-account">已设置</span>
          <el-button type="primary" link size="small" @click="showChangePassword = true">
            修改密码
          </el-button>
        </div>
      </div>
      <div class="bind-item">
        <div class="bind-left">
          <span class="bind-icon" style="background-color: #8b5cf6;">
            <el-icon><Connection /></el-icon>
          </span>
          <span>校园</span>
        </div>
        <div class="bind-right">
          <span class="bind-account">{{ campusAccount }}</span>
          <el-button
            type="primary"
            link
            size="small"
            :loading="campusLoading"
            @click="openCampusBind"
          >
            {{ userStore.userInfo?.campusId ? '换绑定' : '绑定校园' }}
          </el-button>
        </div>
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
      </el-form>
      <template #footer>
        <el-button @click="showChangePassword = false">取消</el-button>
        <el-button type="primary" :loading="pwSubmitting" @click="submitChangePassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="campusDialogVisible"
      title="校园账号绑定"
      width="320px"
      align-center
      @closed="stopCampusPolling"
    >
      <div class="campus-bind-panel">
        <div class="campus-qr-box">
          <template v-if="campusQrImage">
            <img :src="campusQrImage" alt="校园认证二维码" />
            <div v-if="campusScanned" class="qr-success-mask">
              <span class="qr-success-check">✓</span>
            </div>
          </template>
          <span v-else>{{ campusLoading ? '二维码加载中...' : '二维码加载失败' }}</span>
        </div>
        <p :class="{ success: campusScanned }">{{ campusStatusText }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Connection, User, Message, Key } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useLocationStore } from '@/stores/location'
import { showErrorMessage } from '@/api/http'
import { getBalanceApi, alipayRechargeApi, alipayWithdrawApi } from '@/api/payment'
import {
  changePasswordApi,
  checkYnuBindQrCodeApi,
  getYnuBindQrCodeApi,
} from '@/api/auth'
import { createQrCodeDataUrl } from '@/utils/qrcode'

const userStore = useUserStore()
const locationStore = useLocationStore()
const router = useRouter()

const balance = ref(0)
const showChangePassword = ref(false)
const campusDialogVisible = ref(false)
const campusLoading = ref(false)
const campusQrImage = ref('')
const campusUuid = ref('')
const campusStatusText = ref('请使用校园认证扫码绑定')
const campusScanned = ref(false)

const loadingBalance = ref(false)

const pwForm = reactive({
  oldPassword: '',
  newPassword: '',
})
const pwSubmitting = ref(false)
let campusTimer: number | undefined
let campusSuccessTimer: number | undefined

const roleLabel = computed(() => {
  const role = userStore.userInfo?.role
  const map: Record<string, string> = {
    USER: '普通用户',
    ADMIN: '管理员',
    MERCHANT: '商家',
    RIDER: '骑手',
  }
  return map[role || ''] || role || '普通用户'
})

const campusAccount = computed(() => userStore.userInfo?.campusId || '未绑定')

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

const fetchBindings = async () => {
  if (!userStore.token) return

  try {
    await userStore.syncBindings()
  } catch {
    // 绑定信息只是展示辅助，失败时保留本地已有状态。
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
    showErrorMessage(error)
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
    showErrorMessage(error)
  }
}

const submitChangePassword = async () => {
  if (!userStore.token) return
  if (!pwForm.oldPassword || !pwForm.newPassword) {
    ElMessage.warning('请填写旧密码和新密码')
    return
  }
  pwSubmitting.value = true
  try {
    await changePasswordApi(
      {
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      },
      userStore.token
    )
    ElMessage.success('密码修改成功，请重新登录')
    showChangePassword.value = false
    handleLogout()
  } catch (error) {
    showErrorMessage(error)
  } finally {
    pwSubmitting.value = false
  }
}

const openCampusBind = async () => {
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    return
  }

  campusDialogVisible.value = true
  campusLoading.value = true
  campusQrImage.value = ''
  campusUuid.value = ''
  campusScanned.value = false
  campusStatusText.value = '二维码加载中...'
  stopCampusPolling()

  try {
    const data = await getYnuBindQrCodeApi(userStore.token)
    campusUuid.value = pickString(data, ['uuid', 'id', 'qrId', 'qrcodeId', 'qrCodeId'])
    campusQrImage.value = await resolveQrImage(data)

    if (!campusQrImage.value) {
      throw new Error('二维码内容为空')
    }

    if (!campusUuid.value) {
      throw new Error('二维码 uuid 为空')
    }

    campusStatusText.value = '请使用校园认证扫码绑定'
    startCampusPolling()
  } catch (error) {
    campusStatusText.value = error instanceof Error ? error.message : '二维码加载失败'
  } finally {
    campusLoading.value = false
  }
}

const resolveQrImage = async (data: unknown) => {
  const image = pickString(data, [
      'qrCode',
      'qrcode',
      'qr_code',
      'qrCodeUrl',
      'qrcodeUrl',
      'image',
      'img',
      'url',
    ])
  const text = pickString(data, ['qr_url', 'qrUrl', 'qrURL', 'loginUrl', 'login_url'])

  if (text) {
    return createQrCodeDataUrl(text)
  }

  return normalizeQrImage(image)
}

const startCampusPolling = () => {
  stopCampusPolling()
  campusTimer = window.setInterval(pollCampusBind, 1800)
  pollCampusBind()
}

const stopCampusPolling = () => {
  if (campusTimer) {
    window.clearInterval(campusTimer)
    campusTimer = undefined
  }
  if (campusSuccessTimer) {
    window.clearTimeout(campusSuccessTimer)
    campusSuccessTimer = undefined
  }
}

const pollCampusBind = async () => {
  if (!campusUuid.value || !userStore.token) return

  try {
    const data = await checkYnuBindQrCodeApi(campusUuid.value, userStore.token)
    const studentId = pickString(data, ['studentId', 'student_id', 'openId'])

    if (studentId) {
      campusScanned.value = true
      campusStatusText.value = '扫码成功，校园账号已绑定'
      userStore.setCampusId(studentId)
      stopCampusPolling()
      campusSuccessTimer = window.setTimeout(() => {
        campusDialogVisible.value = false
        ElMessage.success('校园账号已绑定')
      }, 800)
      return
    }

    const statusText = pickString(data, ['message', 'msg', 'statusText', 'status', 'state'])
    campusScanned.value = hasScannedQr(data) || hasScannedText(statusText)
    campusStatusText.value = campusScanned.value ? (statusText || '已扫码，请在手机端确认') : (statusText || '等待扫码确认...')
  } catch (error) {
    campusStatusText.value = error instanceof Error ? error.message : '等待扫码确认...'
  }
}

const pickString = (value: unknown, keys: string[]): string => {
  if (!value || typeof value !== 'object') return ''

  const record = value as Record<string, unknown>
  for (const key of keys) {
    const direct = record[key]
    if (typeof direct === 'string' && direct) return direct
    if (typeof direct === 'number') return String(direct)
  }

  for (const nested of Object.values(record)) {
    const result = pickString(nested, keys)
    if (result) return result
  }

  return ''
}

const normalizeQrImage = (image: string) => {
  if (!image) return ''
  if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
    return image
  }
  return `data:image/png;base64,${image}`
}

const hasScannedQr = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false

  const record = value as Record<string, unknown>
  return Object.values(record).some((item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return hasScannedText(String(item))
    }
    return hasScannedQr(item)
  })
}

const hasScannedText = (text: string) => {
  const normalized = text.toLowerCase()
  return [
    'scanned',
    'confirmed',
    'scan_success',
    'bind_success',
    'bound',
    '已扫码',
    '已扫描',
    '扫码成功',
    '已确认',
    '登录成功',
    '绑定成功',
  ].some((keyword) => normalized.includes(keyword.toLowerCase()))
}

const handleLogout = async () => {
  try {
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch {
    ElMessage.success('已退出登录')
    router.push('/')
  }
}

onMounted(() => {
  fetchBalance()
  fetchBindings()
})

onUnmounted(() => {
  stopCampusPolling()
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
  color: #666666;
  font-size: 14px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bind-right {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.account-actions {
  margin: 16px 12px 24px;
  display: flex;
  justify-content: center;
}

.account-actions :deep(.el-button) {
  width: 100%;
  height: 42px;
  border-radius: 8px;
  margin-left: 0;
}

.campus-bind-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.campus-qr-box {
  position: relative;
  width: 210px;
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background-color: #f8fafc;
  color: #909399;
  font-size: 14px;
  overflow: hidden;
}

.qr-success-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(2px);
}

.qr-success-check {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #18c37e;
  color: #ffffff;
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 12px 28px rgba(24, 195, 126, 0.32);
}

.campus-qr-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.campus-bind-panel p {
  margin: 0;
  color: #666666;
  font-size: 14px;
}

.campus-bind-panel p.success {
  color: #18a66a;
  font-size: 16px;
  font-weight: 700;
}
</style>

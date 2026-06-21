<template>
  <div class="profile-page">
    <header class="profile-header">
      <h2>我的</h2>
    </header>

    <section class="profile-card">
      <div class="avatar-upload" @click="triggerAvatar">
        <el-avatar class="profile-avatar" :size="68" :src="avatarPreview" />
        <div class="avatar-overlay"><el-icon><Camera /></el-icon></div>
        <input ref="avatarInputRef" type="file" accept="image/*" style="display:none" @change="onAvatarChange" />
      </div>

      <div class="profile-info">
        <h3 @click="editNickname" class="nickname-editable">{{ userStore.nickname }}</h3>
        <p class="profile-loc">{{ selectedLocName }} {{ selectedLocPhone }}</p>
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
        <strong>{{ selectedLocAddr }}</strong>
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
      <div class="bind-item" :class="{ clickable: isAdmin }" @click="goAdmin">
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
    <el-dialog v-model="nicknameEditing" title="修改昵称" width="80%">
      <el-input v-model="nicknameForm" placeholder="输入新昵称" maxlength="20" />
      <template #footer>
        <el-button @click="nicknameEditing = false">取消</el-button>
        <el-button type="primary" @click="saveNickname">保存</el-button>
      </template>
    </el-dialog>

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

    <el-dialog v-model="rechargeVisible" :title="rechargeStep === 'qrcode' ? '支付宝充值' : '充值'" width="300px" :close-on-click-modal="false" align-center>
      <div v-if="rechargeStep === 'choose'" class="pay-choose">
        <el-form label-position="top">
          <el-form-item label="金额"><el-input-number v-model="rechargeAmount" :min="1" :precision="2" style="width:100%" /></el-form-item>
        </el-form>
        <el-button type="primary" size="large" style="width:100%" :loading="recharging" @click="doRecharge">确认充值</el-button>
      </div>
      <div v-else style="text-align:center;padding:10px 0">
        <img v-if="rechargeQr" :src="rechargeQr" style="display:block;margin:0 auto;width:200px;height:200px" />
        <p style="font-size:14px;color:#666;margin:12px 0 0">请使用支付宝扫码充值</p>
      </div>
    </el-dialog>

    <el-dialog v-model="withdrawVisible" title="提现" width="90%">
      <el-form label-position="top" size="default">
        <el-form-item label="支付宝UID"><el-input v-model="withdrawUid" placeholder="请输入支付宝UID" /></el-form-item>
        <el-form-item label="金额"><el-input-number v-model="withdrawAmount" :min="1" :precision="2" style="width:100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="withdrawVisible = false">取消</el-button>
        <el-button type="primary" :loading="withdrawing" @click="doWithdraw">确认提现</el-button>
      </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Connection, User, Message, Key, Camera, LocationFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useLocationStore } from '@/stores/location'
import { showErrorMessage } from '@/api/http'
import { updateUserProfileApi } from '@/api/user'
import { uploadImage, cleanupUpload, type UploadResult } from '@/services/fileUpload'
import { getBalanceApi, alipayRechargeApi, alipayWithdrawApi, getPaymentStatusApi } from '@/api/payment'
import {
  changePasswordApi,
  checkYnuBindQrCodeApi,
  getYnuBindQrCodeApi,
} from '@/api/auth'
import { createQrCodeDataUrl } from '@/utils/qrcode'

const userStore = useUserStore()
const locationStore = useLocationStore()
const selectedLocName = computed(() => {
  const loc = locationStore.selectedLocation as Record<string, unknown> | null
  return (loc?.name as string) || '未设置'
})
const selectedLocPhone = computed(() => {
  const loc = locationStore.selectedLocation as Record<string, unknown> | null
  return (loc?.phone as string) || ''
})
const selectedLocAddr = computed(() => {
  const loc = locationStore.selectedLocation as Record<string, unknown> | null
  return (loc?.address as string) || '未选择'
})
const router = useRouter()

// 头像/昵称编辑
const avatarPreview = computed(() => userStore.avatar)
const avatarInputRef = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)
const pendingAvatarResult = ref<UploadResult | null>(null)
const nicknameEditing = ref(false)
const nicknameForm = ref('')

// 触发头像选择。
const triggerAvatar = () => avatarInputRef.value?.click()
// 处理头像上传。
const onAvatarChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarUploading.value = true
  const result = await uploadImage(file, userStore.token)
  if (result) {
    await updateUserProfileApi({ avatar: result.url }, userStore.token)
    await userStore.fetchProfile()
    if (pendingAvatarResult.value) cleanupUpload(pendingAvatarResult.value.objectName, userStore.token)
    pendingAvatarResult.value = result
    ElMessage.success('头像已更新')
  }
  avatarUploading.value = false
}
// 进入昵称编辑。
const editNickname = () => {
  nicknameForm.value = userStore.nickname
  nicknameEditing.value = true
}
// 保存昵称。
const saveNickname = async () => {
  if (!nicknameForm.value.trim()) return
  try {
    await updateUserProfileApi({ nickname: nicknameForm.value.trim() }, userStore.token)
    await userStore.fetchProfile()
    nicknameEditing.value = false
    ElMessage.success('昵称已更新')
  } catch (e) { showErrorMessage(e) }
}

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

const isAdmin = computed(() => userStore.userInfo?.role === 'ADMIN')
// 进入管理页面。
const goAdmin = () => { if (isAdmin.value) router.push('/admin') }

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

// 加载账户余额。
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

// 加载账号绑定信息。
const fetchBindings = async () => {
  if (!userStore.token) return

  try {
    await userStore.syncBindings()
  } catch {
    // 绑定信息只是展示辅助，失败时保留本地已有状态。
  }
}

  // 充值
  const rechargeVisible = ref(false)
  const rechargeStep = ref<'choose' | 'qrcode'>('choose')
  const rechargeAmount = ref(20)
  const rechargeQr = ref('')
  const recharging = ref(false)
  let rechargeTimer: number | undefined

  // 打开充值弹窗。
  const handleRecharge = () => {
    if (!userStore.isLoggedIn) { ElMessage.warning('请先登录'); return }
    rechargeStep.value = 'choose'
    rechargeAmount.value = 20
    rechargeVisible.value = true
  }

  // 提交充值。
  const doRecharge = async () => {
    recharging.value = true
    try {
      const result = await alipayRechargeApi({ amount: rechargeAmount.value }, userStore.token)
      rechargeQr.value = await createQrCodeDataUrl(result.payUrl)
      rechargeStep.value = 'qrcode'
      startRechargePoll(result.paymentId)
    } catch (e) { showErrorMessage(e) }
    finally { recharging.value = false }
  }

  // 启动充值支付轮询。
  const startRechargePoll = (paymentId: string) => {
    stopRechargePoll()
    rechargeTimer = window.setInterval(async () => {
      try {
        const r = await getPaymentStatusApi(paymentId, '')
        if (r.status !== 0) {
          stopRechargePoll()
          if (r.status === 1) { ElMessage.success('充值成功'); rechargeVisible.value = false; fetchBalance() }
          else if (r.status === 2) ElMessage.error('充值已过期')
          else ElMessage.error('充值状态异常')
        }
      } catch { /* */ }
    }, 2000)
  }

  // 停止充值支付轮询。
  const stopRechargePoll = () => {
    if (rechargeTimer) { clearInterval(rechargeTimer); rechargeTimer = undefined }
  }
  watch(rechargeVisible, (v) => { if (!v) stopRechargePoll() })

  // 提现
  const withdrawVisible = ref(false)
  const withdrawUid = ref('')
  const withdrawAmount = ref(10)
  const withdrawing = ref(false)

  // 打开提现弹窗。
  const handleWithdraw = () => {
    if (!userStore.isLoggedIn) { ElMessage.warning('请先登录'); return }
    withdrawUid.value = ''
    withdrawAmount.value = 10
    withdrawVisible.value = true
  }

  // 提交提现。
  const doWithdraw = async () => {
    if (!withdrawUid.value || !withdrawAmount.value) { ElMessage.warning('请填写完整信息'); return }
    withdrawing.value = true
    try {
      await alipayWithdrawApi({ alipayUserId: withdrawUid.value, amount: withdrawAmount.value }, userStore.token)
      ElMessage.success('提现申请已提交')
      withdrawVisible.value = false
      fetchBalance()
    } catch (e) { showErrorMessage(e) }
    finally { withdrawing.value = false }
  }

// 提交密码修改。
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

// 打开校园账号绑定。
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

// 解析二维码图片内容。
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

// 启动校园绑定轮询。
const startCampusPolling = () => {
  stopCampusPolling()
  campusTimer = window.setInterval(pollCampusBind, 1800)
  pollCampusBind()
}

// 停止校园绑定轮询。
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

// 轮询校园绑定状态。
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

// 标准化二维码图片地址。
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

// 判断扫码状态文本。
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

// 处理退出登录。
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

.avatar-upload {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}
.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
  opacity: 0;
  transition: opacity .2s;
  color: #fff;
  font-size: 22px;
}
.avatar-upload:hover .avatar-overlay {
  opacity: 1;
}
.nickname-editable {
  cursor: pointer;
}
.nickname-editable:hover {
  color: #0085ff;
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
.profile-loc {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
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
.bind-item.clickable {
  cursor: pointer;
}
.bind-item.clickable:hover {
  background: #f0f7ff;
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

.pay-choose {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.pay-qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
}

.qr-img {
  width: 200px;
  height: 200px;
  border-radius: 4px;
  display: block;
}
.qr-tip {
  font-size: 14px;
  color: #666;
  margin: 0;
  text-align: center;
}
}
</style>

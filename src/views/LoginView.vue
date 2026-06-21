<template>
  <div class="auth-page">
    <div class="logo-container">
      <img src="/favicon.ico" alt="饿了么" class="logo-img" />
      <div class="app-name">饿了么</div>
    </div>
    
    <div class="form-container">
      <el-form size="large">
        <el-form-item>
          <el-input 
            v-model="email" 
            placeholder="请输入邮箱" 
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-input 
            v-model="password" 
            placeholder="请输入密码" 
            type="password"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <div class="captcha-row">
            <el-input
              v-model="captchaCode"
              placeholder="请输入验证码"
              clearable
            />
            <button
              type="button"
              class="captcha-image-btn"
              @click="loadCaptcha"
            >
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
              <span v-else>刷新</span>
            </button>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            class="primary-btn" 
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="action-links">
        <el-link :underline="false" @click="router.push('/forgot-password')">忘记密码？</el-link>
        <el-link type="primary" :underline="false" @click="router.push('/register')">新用户注册</el-link>
      </div>

      <div class="campus-login">
        <div class="campus-divider">
          <span></span>
          <em>其他方式登录</em>
          <span></span>
        </div>
        <el-button
          class="campus-login-btn"
          plain
          :loading="qrLoading"
          @click="openCampusLogin"
        >
          校园认证扫码登录
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model="qrDialogVisible"
      title="校园认证扫码登录"
      width="320px"
      align-center
      @closed="stopQrPolling"
    >
      <div class="qr-login-panel">
        <div class="qr-box">
          <template v-if="qrImage">
            <img :src="qrImage" alt="校园认证二维码" />
            <div v-if="qrScanned" class="qr-success-mask">
              <span class="qr-success-check">✓</span>
            </div>
          </template>
          <span v-else>{{ qrLoading ? '二维码加载中...' : '二维码加载失败' }}</span>
        </div>
        <p :class="{ success: qrScanned }">{{ qrStatusText }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getImageCaptchaApi } from '@/api/risk'
import {
  checkPublicYnuQrCodeApi,
  getPublicYnuQrCodeApi,
  type LoginVO,
} from '@/api/auth'
import { showErrorMessage } from '@/api/http'
import { createQrCodeDataUrl } from '@/utils/qrcode'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const email = ref('')
const password = ref('')
const captchaId = ref('')
const captchaCode = ref('')
const captchaImage = ref('')
const loading = ref(false)
const qrDialogVisible = ref(false)
const qrLoading = ref(false)
const qrImage = ref('')
const qrUuid = ref('')
const qrStatusText = ref('请使用校园认证扫码')
const qrScanned = ref(false)
let qrTimer: number | undefined
let qrSuccessTimer: number | undefined

// 处理账号密码登录。
const handleLogin = async () => {
  if (!email.value || !password.value || !captchaCode.value) {
    ElMessage.warning('请输入邮箱、密码和验证码')
    return
  }
  
  loading.value = true

  try {
    await userStore.login({
      email: email.value,
      password: password.value,
      captchaId: captchaId.value,
      captchaCode: captchaCode.value
    })

    loading.value = false
    ElMessage.success('登录成功！')
    router.replace(getRedirectPath())
  } catch (error) {
    loading.value = false
    showErrorMessage(error)
    captchaCode.value = ''
    loadCaptcha()
  }
}

// 加载图形验证码。
const loadCaptcha = async () => {
  try {
    const captcha = await getImageCaptchaApi()
    captchaId.value = captcha.id
    captchaImage.value = captcha.image
  } catch (error) {
    showErrorMessage(error)
  }
}

// 打开校园认证扫码登录。
const openCampusLogin = async () => {
  qrDialogVisible.value = true
  qrLoading.value = true
  qrImage.value = ''
  qrUuid.value = ''
  qrScanned.value = false
  qrStatusText.value = '二维码加载中...'
  stopQrPolling()

  try {
    const data = await getPublicYnuQrCodeApi()
    qrUuid.value = pickString(data, ['uuid', 'id', 'qrId', 'qrcodeId', 'qrCodeId'])
    qrImage.value = await resolveQrImage(data)

    if (!qrImage.value) {
      throw new Error('二维码内容为空')
    }

    if (!qrUuid.value) {
      throw new Error('二维码 uuid 为空')
    }

    qrStatusText.value = '请使用校园认证扫码'
    startQrPolling()
  } catch (error) {
    qrStatusText.value = error instanceof Error ? error.message : '二维码加载失败'
  } finally {
    qrLoading.value = false
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

// 启动二维码轮询。
const startQrPolling = () => {
  stopQrPolling()
  qrTimer = window.setInterval(pollCampusLogin, 1800)
  pollCampusLogin()
}

// 停止二维码轮询。
const stopQrPolling = () => {
  if (qrTimer) {
    window.clearInterval(qrTimer)
    qrTimer = undefined
  }
  if (qrSuccessTimer) {
    window.clearTimeout(qrSuccessTimer)
    qrSuccessTimer = undefined
  }
}

// 轮询校园扫码登录状态。
const pollCampusLogin = async () => {
  if (!qrUuid.value) return

  try {
    const data = await checkPublicYnuQrCodeApi(qrUuid.value)
    const loginResult = extractLoginResult(data)

    if (loginResult) {
      const studentId = pickString(data, ['studentId', 'student_id'])
      qrScanned.value = true
      qrStatusText.value = '扫码成功，正在登录...'
      userStore.setLoginState(loginResult.token, {
        ...loginResult.userInfo,
        campusId: studentId || loginResult.userInfo.campusId
      })
      stopQrPolling()
      qrSuccessTimer = window.setTimeout(() => {
        qrDialogVisible.value = false
        ElMessage.success('登录成功！')
        router.replace(getRedirectPath())
      }, 800)
      return
    }

    const statusText = pickString(data, ['message', 'msg', 'statusText', 'status', 'state'])
    qrScanned.value = hasScannedQr(data) || hasScannedText(statusText)
    qrStatusText.value = qrScanned.value ? (statusText || '已扫码，请在手机端确认') : (statusText || '等待扫码确认...')
  } catch (error) {
    qrStatusText.value = error instanceof Error ? error.message : '等待扫码确认...'
  }
}

const extractLoginResult = (value: unknown): LoginVO | null => {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  if (typeof record.token === 'string' && record.userInfo && typeof record.userInfo === 'object') {
    return {
      token: record.token,
      userInfo: record.userInfo as LoginVO['userInfo']
    }
  }

  if (record.login) {
    return extractLoginResult(record.login)
  }

  return null
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
    'login_success',
    'bound',
    '已扫码',
    '已扫描',
    '扫码成功',
    '已确认',
    '登录成功',
    '绑定成功',
  ].some((keyword) => normalized.includes(keyword.toLowerCase()))
}

// 获取登录后的跳转地址。
const getRedirectPath = () => {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect
  }

  return '/'
}

onMounted(loadCaptcha)
onUnmounted(stopQrPolling)
</script>

<style scoped>
.auth-page {
  display: flex;
  flex-direction: column;
  padding: 30px;
  min-height: 100%;
  background-color: #ffffff;
  box-sizing: border-box;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60px;
  margin-bottom: 50px;
}

.logo-img {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  box-shadow: 0 8px 16px rgba(0, 136, 204, 0.15);
  margin-bottom: 16px;
  object-fit: cover;
}

.app-name {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  letter-spacing: 1px;
}

.form-container {
  flex: 1;
  width: 100%;
}

.primary-btn {
  width: 100%;
  border-radius: 8px;
  font-size: 16px;
  margin-top: 10px;
}

.captcha-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-image-btn {
  width: 116px;
  height: 40px;
  flex-shrink: 0;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background-color: #f7f8fa;
  color: #888888;
  cursor: pointer;
  overflow: hidden;
}

.captcha-image-btn img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.action-links {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.campus-login {
  margin-top: 28px;
}

.campus-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  color: #999999;
  font-size: 13px;
}

.campus-divider span {
  flex: 1;
  height: 1px;
  background-color: #eeeeee;
}

.campus-divider em {
  font-style: normal;
}

.campus-login-btn {
  width: 100%;
  border-radius: 8px;
}

.qr-login-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-box {
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

.qr-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-login-panel p {
  margin: 0;
  color: #666666;
  font-size: 14px;
}

.qr-login-panel p.success {
  color: #18a66a;
  font-size: 16px;
  font-weight: 700;
}

</style>

<template>
  <div class="auth-page">
    <div class="header">
      <h2>新用户注册</h2>
      <p class="subtitle">注册饿了么账号以体验点餐</p>
    </div>

    <div class="form-container">
      <el-form size="large">
        <el-form-item>
          <el-input
            v-model="email"
            placeholder="请输入邮箱"
            :prefix-icon="Message"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <div class="code-input-wrapper">
            <el-input
              v-model="code"
              placeholder="输入邮箱验证码"
              :prefix-icon="Key"
              class="code-input"
            />
            <el-button
              type="primary"
              link
              class="code-btn"
              :loading="codeLoading"
              :disabled="captchaCountdown > 0"
              @click="sendCode"
            >
              {{ captchaCountdown > 0 ? `${captchaCountdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="password"
            placeholder="设置密码 (至少6位)"
            type="password"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="confirmPassword"
            placeholder="请再次确认密码"
            type="password"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="primary-btn"
            :loading="loading"
            @click="handleRegister"
          >
            注册账号
          </el-button>
        </el-form-item>
      </el-form>

      <div class="action-links">
        <el-link type="primary" :underline="false" @click="router.push('/login')">已有账号？马上登录</el-link>
      </div>
    </div>
    <SliderCaptcha
      v-model:visible="sliderVisible"
      @success="onSliderSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Message, Lock, Key } from '@element-plus/icons-vue'
import SliderCaptcha from '@/components/SliderCaptcha.vue'
import { registerApi, sendRegisterEmailCaptchaApi } from '@/api/auth'
import { showErrorMessage } from '@/api/http'
import type { SliderCaptchaTrack } from '@/api/risk'

const router = useRouter()
const email = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const codeLoading = ref(false)
const captchaCountdown = ref(0)
const sliderVisible = ref(false)
let countdownTimer: number | undefined

// 提交注册。
const handleRegister = async () => {
  if (!email.value || !code.value || !password.value || !confirmPassword.value) {
    ElMessage.warning('请填写完整注册信息')
    return
  }
  if (password.value !== confirmPassword.value) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  loading.value = true

  try {
    await registerApi({
      email: email.value,
      password: password.value,
      emailCaptcha: code.value
    })

    loading.value = false
    ElMessage.success('注册成功，请登录！')
    router.push('/login')
  } catch (error) {
    loading.value = false
    showErrorMessage(error)
  }
}

// 发送邮箱验证码。
const sendCode = async () => {
  if (!email.value) {
    ElMessage.warning('请先输入邮箱')
    return
  }

  // 弹出滑块验证码，用户完成拼图后触发 onSliderSuccess
  sliderVisible.value = true
}

// 处理滑块验证码通过。
const onSliderSuccess = async (result: { captchaId: string; captchaData: SliderCaptchaTrack }) => {
  sliderVisible.value = false
  codeLoading.value = true

  try {
    await sendRegisterEmailCaptchaApi({
      email: email.value,
      captchaId: result.captchaId,
      captchaData: result.captchaData,
    })

    codeLoading.value = false
    ElMessage.success('验证码已发送')
    startCountdown(60)
  } catch (error) {
    codeLoading.value = false
    showErrorMessage(error)
  }
}

// 启动验证码倒计时。
const startCountdown = (seconds: number) => {
  captchaCountdown.value = seconds

  if (countdownTimer) {
    window.clearInterval(countdownTimer)
  }

  countdownTimer = window.setInterval(() => {
    captchaCountdown.value -= 1

    if (captchaCountdown.value <= 0 && countdownTimer) {
      window.clearInterval(countdownTimer)
      countdownTimer = undefined
    }
  }, 1000)
}

onUnmounted(() => {
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
  }
})
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

.header {
  margin-top: 40px;
  margin-bottom: 40px;
}

.header h2 {
  font-size: 30px;
  color: #222;
  margin-bottom: 10px;
  font-weight: bold;
}

.subtitle {
  font-size: 14px;
  color: #888;
}

.form-container {
  flex: 1;
  width: 100%;
}

.code-input-wrapper {
  display: flex;
  width: 100%;
  align-items: center;
}

.code-input {
  flex: 1;
}

.code-btn {
  margin-left: 10px;
}

.primary-btn {
  width: 100%;
  border-radius: 8px;
  font-size: 16px;
  margin-top: 10px;
}

.action-links {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
</style>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getImageCaptchaApi } from '@/api/risk'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const email = ref('')
const password = ref('')
const captchaId = ref('')
const captchaCode = ref('')
const captchaImage = ref('')
const loading = ref(false)

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
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
    captchaCode.value = ''
    loadCaptcha()
  }
}

const loadCaptcha = async () => {
  try {
    const captcha = await getImageCaptchaApi()
    captchaId.value = captcha.id
    captchaImage.value = captcha.image
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '验证码加载失败')
  }
}

const getRedirectPath = () => {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect
  }

  return '/'
}

onMounted(loadCaptcha)
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

</style>

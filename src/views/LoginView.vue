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
        <el-link :underline="false">忘记密码？</el-link>
        <el-link type="primary" :underline="false" @click="router.push('/register')">新用户注册</el-link>
      </div>
    </div>
    
    <div class="agreement">
      <p>登录即代表您已同意 <el-link type="primary">《用户服务协议》</el-link> 和 <el-link type="primary">《隐私政策》</el-link></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = () => {
  if (!email.value || !password.value) {
    ElMessage.warning('请输入邮箱和密码')
    return
  }
  
  loading.value = true
  
  // Mock login logic
  console.log('Login', { email: email.value, password: password.value })
  
  setTimeout(() => {
    loading.value = false
    ElMessage.success('登录成功！')
    // router.push('/') // Navigate to home later
  }, 1000)
}
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

.action-links {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.agreement {
  text-align: center;
  font-size: 13px;
  color: #999;
  margin-bottom: 20px;
  line-height: 1.5;
}
</style>

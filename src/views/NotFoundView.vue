<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <h1>404</h1>
      <p>页面不存在</p>
      <el-button type="primary" round @click="router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.not-found-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: #f5f5f5;
}

.not-found-content {
  width: 100%;
  padding: 34px 20px;
  border-radius: 8px;
  text-align: center;
  background-color: #ffffff;
}

.not-found-content h1 {
  margin: 0;
  color: #0085ff;
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
}

.not-found-content p {
  margin: 14px 0 22px;
  color: #777777;
  font-size: 14px;
}
</style>

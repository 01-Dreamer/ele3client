<template>
  <div class="location-page">
    <header class="location-header">
      <h2>位置管理</h2>
    </header>

    <section class="current-card">
      <div class="current-icon">
        <el-icon><LocationFilled /></el-icon>
      </div>
      <div class="current-info">
        <span>当前位置</span>
        <strong>{{ currentLocation.address }}</strong>
        <p>{{ currentLocation.detail }}</p>
      </div>
    </section>

    <section class="search-card">
      <el-input
        v-model="addressKeyword"
        :prefix-icon="Search"
        placeholder="请输入学校、楼栋或详细地址"
        clearable
      />
    </section>

    <section class="address-card">
      <div class="section-title">常用位置</div>
      <div
        v-for="address in addressList"
        :key="address.id"
        class="address-item"
      >
        <div class="address-left">
          <el-icon><MapLocation /></el-icon>
          <div>
            <strong>{{ address.name }}</strong>
            <p>{{ address.detail }}</p>
          </div>
        </div>
        <el-tag v-if="address.isDefault" size="small" effect="plain">当前</el-tag>
      </div>
    </section>

    <section class="location-actions">
      <el-button type="primary" round>确认使用该位置</el-button>
      <el-button plain round>新增位置</el-button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LocationFilled, MapLocation, Search } from '@element-plus/icons-vue'

interface LocationInfo {
  address: string
  detail: string
}

interface AddressItem {
  id: number
  name: string
  detail: string
  isDefault: boolean
}

const addressKeyword = ref('')

const currentLocation = ref<LocationInfo>({
  address: '成都市天府软件园D区',
  detail: 'D区 3栋 1206，门口可取餐'
})

const addressList = ref<AddressItem[]>([
  {
    id: 1,
    name: '天府软件园D区',
    detail: '成都市高新区天府大道中段，D区 3栋',
    isDefault: true
  },
  {
    id: 2,
    name: '天府软件园A区',
    detail: '成都市高新区天府大道中段，A区 1栋',
    isDefault: false
  },
  {
    id: 3,
    name: '学生公寓北门',
    detail: '今日校园生活区北门，靠近便利店',
    isDefault: false
  }
])
</script>

<style scoped>
.location-page {
  min-height: 100%;
  padding-bottom: 18px;
  background-color: #f5f5f5;
}

.location-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  background-image: linear-gradient(90deg, #0af, #0085ff);
}

.location-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
}

.current-card,
.search-card,
.address-card,
.location-actions {
  margin: 12px;
  border-radius: 8px;
  background-color: #ffffff;
}

.current-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}

.current-icon {
  width: 38px;
  height: 38px;
  border-radius: 19px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 20px;
  background-color: #0085ff;
}

.current-info {
  min-width: 0;
  flex: 1;
}

.current-info span,
.section-title {
  color: #666666;
  font-size: 13px;
}

.current-info strong {
  display: block;
  margin-top: 6px;
  color: #222222;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.25;
}

.current-info p,
.address-left p {
  margin: 6px 0 0;
  color: #999999;
  font-size: 13px;
  line-height: 1.35;
}

.search-card {
  padding: 12px;
}

.search-card :deep(.el-input__wrapper) {
  border-radius: 18px;
}

.address-card {
  overflow: hidden;
}

.section-title {
  padding: 13px 14px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
}

.address-item {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
}

.address-item:last-child {
  border-bottom: none;
}

.address-left {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.address-left .el-icon {
  margin-top: 2px;
  flex-shrink: 0;
  color: #0085ff;
  font-size: 18px;
}

.address-left strong {
  color: #222222;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
}

.location-actions {
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.location-actions :deep(.el-button) {
  width: 100%;
  margin-left: 0;
}
</style>

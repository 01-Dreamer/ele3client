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
        <strong>{{ locationStore.currentAddress }}</strong>
        <p v-if="locationStore.currentCoordinate">
          {{ locationStore.currentCoordinate.longitude.toFixed(6) }},
          {{ locationStore.currentCoordinate.latitude.toFixed(6) }}
        </p>
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

      <div v-if="addrLoading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
      </div>

      <div
        v-for="addr in addressList"
        :key="addr.locationId"
        class="address-item"
      >
        <div class="address-left">
          <el-icon><MapLocation /></el-icon>
          <div>
            <strong>{{ addr.name }}</strong>
            <p>{{ addr.address }}</p>
            <p>{{ addr.phone }}</p>
          </div>
        </div>
        <div class="address-right">
          <el-button
            type="danger"
            link
            size="small"
            @click="deleteAddress(addr.locationId)"
          >
            删除
          </el-button>
        </div>
      </div>

      <div v-if="!addrLoading && addressList.length === 0" class="empty-hint">
        暂无常用位置，点击下方新增
      </div>
    </section>

    <section class="location-actions">
      <el-button type="primary" round @click="uploadCoordinate">上传当前位置</el-button>
      <el-button plain round @click="showAddDialog = true">新增位置</el-button>
    </section>

    <!-- 新增地址弹窗 -->
    <el-dialog v-model="showAddDialog" title="新增收货地址" width="90%">
      <el-form label-position="top" size="default">
        <el-form-item label="联系人">
          <el-input v-model="addrForm.name" placeholder="姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="addrForm.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="addrForm.address" placeholder="详细地址" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input-number v-model="addrForm.longitude" :precision="6" style="width:100%" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input-number v-model="addrForm.latitude" :precision="6" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="addrSubmitting" @click="addAddress">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { LocationFilled, MapLocation, Search, Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useLocationStore } from '@/stores/location'
import { showErrorMessage } from '@/api/http'
import { createUserLocationApi, deleteUserLocationApi, type UserLocationVO } from '@/api/user'
import { uploadCoordinateApi } from '@/api/location'

const userStore = useUserStore()
const locationStore = useLocationStore()

const addressKeyword = ref('')
const addressList = ref<UserLocationVO[]>([])
const addrLoading = ref(false)
const showAddDialog = ref(false)
const addrSubmitting = ref(false)

const addrForm = reactive({
  name: '',
  phone: '',
  address: '',
  longitude: 104.066801,
  latitude: 30.572269,
})

// 这里暂时用 getCoordinate 获取位置信息，user locations API 可能需要后端配合
// 目前 addressList 通过 localStorage 临时存储
const STORED_ADDRESSES_KEY = 'ele3_addresses'

const loadAddresses = () => {
  const raw = localStorage.getItem(STORED_ADDRESSES_KEY)
  if (raw) {
    try {
      addressList.value = JSON.parse(raw)
    } catch {
      addressList.value = []
    }
  }
}

const saveAddresses = () => {
  localStorage.setItem(STORED_ADDRESSES_KEY, JSON.stringify(addressList.value))
}

const addAddress = async () => {
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    return
  }
  if (!addrForm.name || !addrForm.phone || !addrForm.address) {
    ElMessage.warning('请填写完整信息')
    return
  }
  addrSubmitting.value = true
  try {
    const result = await createUserLocationApi(
      {
        name: addrForm.name,
        phone: addrForm.phone,
        address: addrForm.address,
        longitude: addrForm.longitude,
        latitude: addrForm.latitude,
      },
      userStore.token
    )
    addressList.value.push(result)
    saveAddresses()
    ElMessage.success('地址已保存')
    showAddDialog.value = false
  } catch (error) {
    showErrorMessage(error)
  } finally {
    addrSubmitting.value = false
  }
}

const deleteAddress = async (locationId: string) => {
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    await deleteUserLocationApi(locationId, userStore.token)
    addressList.value = addressList.value.filter(a => a.locationId !== locationId)
    saveAddresses()
    ElMessage.success('已删除')
  } catch (error) {
    showErrorMessage(error)
  }
}

const uploadCoordinate = async () => {
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    let currentCoordinate = locationStore.currentCoordinate

    if (!currentCoordinate) {
      currentCoordinate = await locationStore.refreshLocationNow()
    }

    if (!currentCoordinate) {
      ElMessage.warning(locationStore.lastError || '暂未获取到当前位置')
      return
    }

    const coord = await uploadCoordinateApi({
      longitude: currentCoordinate.longitude,
      latitude: currentCoordinate.latitude,
    }, userStore.token)
    locationStore.setCoordinate(coord)
    ElMessage.success('位置已上传')
  } catch (error) {
    showErrorMessage(error)
  }
}

onMounted(loadAddresses)
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

.current-info p {
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

.loading-state {
  padding: 20px;
  display: flex;
  justify-content: center;
  color: #999;
}

.empty-hint {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
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

.address-left p {
  margin: 2px 0 0;
  color: #999;
  font-size: 12px;
}

.address-right {
  flex-shrink: 0;
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

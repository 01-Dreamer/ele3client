<template>
  <div class="location-page">
    <header class="location-header">
      <h2>收货地址</h2>
    </header>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        size="small" background
        v-model:current-page="currentPage"
        :page-size="pageSize" :pager-count="5"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchLocations"
      />
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading" size="24"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <el-empty v-else-if="locations.length === 0" description="暂无收货地址" :image-size="90" />

    <ul v-else class="location-list">
      <li v-for="loc in locations" :key="loc.locationId" :class="{ selected: selectedId === loc.locationId }" @click="selectLocation(loc)">
        <div class="loc-left">
          <el-icon :size="20" :color="selectedId === loc.locationId ? '#0085ff' : '#ccc'">
            <LocationFilled />
          </el-icon>
          <div class="loc-info">
            <div class="loc-addr">{{ loc.address }}</div>
            <div class="loc-coord">{{ loc.longitude }}, {{ loc.latitude }}</div>
          </div>
        </div>
        <el-button type="danger" link size="small" @click.stop="confirmDelete(loc)">删除</el-button>
      </li>
    </ul>

    <div class="actions">
      <el-button type="primary" round @click="openAdd">新增地址</el-button>
    </div>
    <el-dialog v-model="dialogVisible" title="新增收货地址" width="90%">
      <el-form label-position="top" size="default">
        <el-form-item label="详细地址">
          <el-input v-model="form.address" placeholder="详细地址" />
          <div class="geo-actions">
            <el-button size="small" :loading="geoLoading" @click="fillCurrentPosition">获取当前位置</el-button>
            <el-button size="small" :loading="geoLoading" @click="geocode">解析位置</el-button>
          </div>
        </el-form-item>
        <el-form-item label="经度">
          <el-input-number v-model="form.longitude" :precision="6" style="width:100%" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input-number v-model="form.latitude" :precision="6" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveLocation">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, LocationFilled } from '@element-plus/icons-vue'
import { listUserLocationsApi, createUserLocationApi, deleteUserLocationApi, type UserLocationVO } from '@/api/user'
import { useLocationStore } from '@/stores/location'
import { showErrorMessage } from '@/api/http'

const locationStore = useLocationStore()

const locations = ref<UserLocationVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 5
const total = ref(0)
const selectedId = computed(() => (locationStore.selectedLocation as any)?.locationId || '')

const dialogVisible = ref(false)
const saving = ref(false)
const geoLoading = ref(false)
const form = reactive({ address: '', longitude: 104.066801, latitude: 30.572269 })

// 选择收货地址。
const selectLocation = (loc: UserLocationVO) => {
  locationStore.saveSelectedLocation(loc as any)
}

// 加载收货地址列表。
const fetchLocations = async () => {
  loading.value = true
  try {
    const result = await listUserLocationsApi(currentPage.value, pageSize)
    locations.value = result.items || []
    total.value = result.total > 0 ? result.total : ((result.items?.length === pageSize) ? currentPage.value * pageSize + 1 : (currentPage.value - 1) * pageSize + (result.items?.length || 0))
  } catch (e) { showErrorMessage(e) }
  finally { loading.value = false }
}

// 打开新增地址弹窗。
const openAdd = () => {
  Object.assign(form, { address: '', longitude: 104.066801, latitude: 30.572269 })
  dialogVisible.value = true
}

// 填充当前位置。
const fillCurrentPosition = async () => {
  geoLoading.value = true
  const pos = await locationStore.getPositionNow()
  if (pos.coordinate) {
    form.longitude = pos.coordinate.longitude
    form.latitude = pos.coordinate.latitude
    if (pos.address && pos.address !== '定位中...' && pos.address !== '地址解析失败') {
      form.address = pos.address
    }
  }
  geoLoading.value = false
}

// 解析地址经纬度。
const geocode = async () => {
  if (!form.address) return
  geoLoading.value = true
  const coord = await locationStore.geocodeAddress(form.address)
  if (coord) { form.longitude = coord.longitude; form.latitude = coord.latitude }
  else { showErrorMessage(new Error('地址解析失败')) }
  geoLoading.value = false
}

// 保存收货地址。
const saveLocation = async () => {
  if (!form.address) { ElMessage.warning('请填写地址'); return }
  saving.value = true
  try {
    await createUserLocationApi({ name: '', phone: '', ...form }, '')
    ElMessage.success('地址已保存')
    dialogVisible.value = false
    fetchLocations()
  } catch (e) { showErrorMessage(e) }
  finally { saving.value = false }
}

// 确认删除。
const confirmDelete = async (loc: UserLocationVO) => {
  try { await ElMessageBox.confirm(`删除「${loc.name} ${loc.address}」？`, '删除地址', { type: 'warning' }) } catch { return }
  try {
    await deleteUserLocationApi(loc.locationId, '')
    if (selectedId.value === loc.locationId) locationStore.clearSelectedLocation()
    ElMessage.success('已删除')
    fetchLocations()
  } catch (e) { showErrorMessage(e) }
}

onMounted(fetchLocations)
</script>

<style scoped>
.location-page {
  min-height: 100%;
  background: #f5f5f5;
  padding-bottom: 18px;
}
.location-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(90deg, #0af, #0085ff);
}
.location-header h2 {
  margin: 0;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #999;
  gap: 10px;
}
.location-list {
  list-style: none;
  margin: 12px;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.location-list li {
  display: flex;
  align-items: center;
  padding: 14px;
  border-bottom: 1px solid #f5f5f5;
  gap: 10px;
  cursor: pointer;
}
.location-list li:last-child {
  border-bottom: none;
}
.location-list li.selected {
  background: #f0f7ff;
}
.loc-left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.loc-info {
  min-width: 0;
}
.loc-addr {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.loc-coord {
  font-size: 11px;
  color: #ccc;
  margin-top: 2px;
}
.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
.actions {
  padding: 12px;
}
.actions .el-button {
  width: 100%;
}
.geo-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
</style>

<template>
  <div class="myshops-page">
    <header class="myshops-header">
      <h2>我的店铺</h2>
    </header>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        size="small" background
        v-model:current-page="currentPage"
        :page-size="pageSize" :pager-count="5"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchShops"
      />
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading" size="24"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <el-empty v-else-if="shops.length === 0" description="暂无店铺" :image-size="90" />

    <ul v-else class="shop-list">
      <li v-for="shop in shops" :key="shop.shopId">
        <el-image :src="shop.avatar" class="shop-img" fit="cover" lazy />
        <div class="shop-info" @click="goShop(shop.shopId)">
          <div class="shop-info-h">
            <h3>{{ shop.name }}</h3>
            <el-tag v-if="shop.status === 0" size="small" effect="plain" type="success">正常</el-tag>
            <el-tag v-else size="small" effect="plain" type="danger">已封禁</el-tag>
          </div>
          <div class="shop-info-star">
            <div class="star-wrapper">
              <el-rate
                :model-value="reviewAvg(shop.reviewScore, shop.reviewCount)"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
                size="small"
              />
              <span class="sales">销售{{ formatSales(shop.salesCount) }}</span>
            </div>
          </div>
          <div class="shop-info-meta">
            <el-tooltip :content="shop.address" placement="top" :show-after="400">
              <span class="text-truncate">{{ shop.address }}</span>
            </el-tooltip>
            <span>{{ shop.longitude }}, {{ shop.latitude }}</span>
          </div>
        </div>
        <div class="shop-actions">
          <el-button
            type="danger"
            plain
            size="small"
            @click.stop="confirmDelete(shop)"
          >
            删除
          </el-button>
        </div>
      </li>
    </ul>

    <div class="actions">
      <el-button type="primary" round @click="openCreate">新增店铺</el-button>
    </div>
    <el-dialog v-model="createVisible" title="新增店铺" width="90%">
      <el-form label-position="top" size="default">
        <el-form-item label="名称">
          <el-input v-model="createForm.name" placeholder="店铺名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" placeholder="店铺描述" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="createForm.address" placeholder="详细地址" />
          <div class="geo-actions">
            <el-button size="small" :loading="cGeoLoading" @click="cFillPosition">获取当前位置</el-button>
            <el-button size="small" :loading="cGeoLoading" @click="cGeocode">解析位置</el-button>
          </div>
        </el-form-item>
        <el-form-item label="经度">
          <el-input-number v-model="createForm.longitude" :precision="6" style="width:100%" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input-number v-model="createForm.latitude" :precision="6" style="width:100%" />
        </el-form-item>
        <el-form-item label="配送费">
          <el-input-number v-model="createForm.deliveryFee" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="营业开始">
          <el-input v-model="createForm.openTime" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="营业结束">
          <el-input v-model="createForm.closeTime" placeholder="HH:mm" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="cSaving" @click="saveCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { listOwnShopsApi, deleteShopApi, createShopApi, type ShopVO } from '@/api/shop'
import { showErrorMessage } from '@/api/http'
import { useLocationStore } from '@/stores/location'

const router = useRouter()
const locationStore = useLocationStore()

const shops = ref<ShopVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 5
const total = ref(0)

// 计算评价平均分。
const reviewAvg = (score: number | string, count: number | string) => {
  const s = Number(score); const c = Number(count)
  if (!c) return 0
  return Math.round((s / c) * 10) / 10
}
// 格式化销量。
const formatSales = (count: number) => {
  if (count >= 1000) return `${(count / 1000).toFixed(0)}k`
  return String(count)
}

// 加载店铺列表。
const fetchShops = async () => {
  loading.value = true
  try {
    const result = await listOwnShopsApi(currentPage.value, pageSize)
    shops.value = result.items || []
    // 后端 total 为 0 时按返回条数估算页数
    total.value = result.total > 0
      ? result.total
      : (result.items?.length === pageSize
        ? currentPage.value * pageSize + 1
        : (currentPage.value - 1) * pageSize + (result.items?.length || 0))
  } catch (error) {
    showErrorMessage(error)
  } finally {
    loading.value = false
  }
}

// 进入店铺详情。
const goShop = (shopId: string) => {
  router.push({ path: `/shop/${shopId}`, query: { role: 'SHOP_OWNER' } })
}

// 确认删除。
const confirmDelete = async (shop: ShopVO) => {
  try {
    await ElMessageBox.confirm(
      `确定删除店铺「${shop.name}」？此操作不可撤销。`,
      '删除店铺',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }
  try {
    await deleteShopApi(shop.shopId)
    ElMessage.success('店铺已删除')
    fetchShops()
  } catch (error) {
    showErrorMessage(error)
  }
}

// 新增店铺
const createVisible = ref(false)
const cSaving = ref(false)
const cGeoLoading = ref(false)
const createForm = reactive({ name: '', description: '', address: '', longitude: 104.066801, latitude: 30.572269, deliveryFee: 0, openTime: '09:00', closeTime: '22:00' })

// 打开创建弹窗。
const openCreate = () => {
  Object.assign(createForm, { name: '', description: '', address: '', longitude: 104.066801, latitude: 30.572269, deliveryFee: 0, openTime: '09:00', closeTime: '22:00' })
  createVisible.value = true
}

// 为新店铺填充当前位置。
const cFillPosition = async () => {
  cGeoLoading.value = true
  const pos = await locationStore.getPositionNow()
  if (pos.coordinate) {
    createForm.longitude = pos.coordinate.longitude
    createForm.latitude = pos.coordinate.latitude
    if (pos.address && pos.address !== '定位中...' && pos.address !== '地址解析失败') createForm.address = pos.address
  }
  cGeoLoading.value = false
}

// 解析新店铺地址坐标。
const cGeocode = async () => {
  if (!createForm.address) return
  cGeoLoading.value = true
  const coord = await locationStore.geocodeAddress(createForm.address)
  if (coord) { createForm.longitude = coord.longitude; createForm.latitude = coord.latitude }
  else showErrorMessage(new Error('地址解析失败'))
  cGeoLoading.value = false
}

// 保存新店铺。
const saveCreate = async () => {
  if (!createForm.name || !createForm.address) { ElMessage.warning('请填写名称和地址'); return }
  cSaving.value = true
  try {
    await createShopApi({ name: createForm.name, avatar: '', description: createForm.description, address: createForm.address, longitude: createForm.longitude, latitude: createForm.latitude, deliveryFee: createForm.deliveryFee, openTime: createForm.openTime, closeTime: createForm.closeTime }, '')
    ElMessage.success('店铺已创建')
    createVisible.value = false
    fetchShops()
  } catch (e) { showErrorMessage(e) }
  finally { cSaving.value = false }
}

onMounted(() => {
  fetchShops()
})
</script>

<style scoped>
.myshops-page {
  min-height: 100%;
  background-color: #f5f5f5;
  padding-bottom: 18px;
}
.myshops-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(90deg, #0af, #0085ff);
}
.myshops-header h2 {
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
.shop-list {
  list-style: none;
  margin: 12px;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.shop-list li {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
}
.shop-list li:last-child {
  border-bottom: none;
}
.shop-img {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  flex-shrink: 0;
}
.shop-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.shop-info-h {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.shop-info-h h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.shop-info-star {
  margin-bottom: 8px;
}
.star-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sales {
  font-size: 11px;
  color: #666;
}
.shop-info-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #666;
}
.shop-info-meta .text-truncate {
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.shop-actions {
  flex-shrink: 0;
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

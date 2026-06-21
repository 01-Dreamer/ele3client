<template>
  <div class="myshops-page">
    <header class="myshops-header">
      <h2>我的店铺</h2>
    </header>

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
            <span>&#165;{{ shop.deliveryFee }} 配送</span>
            <span>{{ shop.openTime }}-{{ shop.closeTime }}</span>
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

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        size="small"
        background
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :pager-count="5"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchShops"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { listOwnShopsApi, deleteShopApi, type ShopVO } from '@/api/shop'
import { showErrorMessage } from '@/api/http'

const router = useRouter()

const shops = ref<ShopVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 5
const total = ref(0)

const reviewAvg = (score: number | string, count: number | string) => {
  const s = Number(score); const c = Number(count)
  if (!c) return 0
  return Math.round((s / c) * 10) / 10
}
const formatSales = (count: number) => {
  if (count >= 1000) return `${(count / 1000).toFixed(0)}k`
  return String(count)
}

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

const goShop = (shopId: string) => {
  router.push({ path: `/shop/${shopId}`, query: { role: 'SHOP_OWNER' } })
}

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

onMounted(() => {
  fetchShops()
})
</script>

<style scoped>
.myshops-page { min-height: 100%; background-color: #f5f5f5; padding-bottom: 18px; }
.myshops-header { height: 52px; display: flex; align-items: center; justify-content: center; background-image: linear-gradient(90deg, #0af, #0085ff); }
.myshops-header h2 { margin: 0; color: #fff; font-size: 20px; font-weight: 600; }
.loading-state { display: flex; flex-direction: column; align-items: center; padding: 40px; color: #999; gap: 10px; }
.shop-list { list-style: none; margin: 12px; padding: 0; border-radius: 8px; overflow: hidden; background: #fff; }
.shop-list li { display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #f5f5f5; gap: 12px; }
.shop-list li:last-child { border-bottom: none; }
.shop-img { width: 80px; height: 80px; border-radius: 4px; flex-shrink: 0; }
.shop-info { flex: 1; min-width: 0; cursor: pointer; }
.shop-info-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.shop-info-h h3 { margin: 0; font-size: 16px; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shop-info-star { margin-bottom: 8px; }
.star-wrapper { display: flex; align-items: center; gap: 8px; }
.sales { font-size: 11px; color: #666; }
.shop-info-meta { display: flex; justify-content: space-between; font-size: 11px; color: #666; }
.shop-actions { flex-shrink: 0; }
.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 20px 12px;
  background: #fff;
  margin: 12px;
  border-radius: 8px;
}
</style>

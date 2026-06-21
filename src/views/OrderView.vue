<template>
  <div class="order-page">
    <header class="order-header">
      <h2>订单</h2>
    </header>

    <section class="status-section">
      <el-radio-group v-model="activeStatus" size="large" class="status-group" @change="fetchOrders">
        <el-radio-button
          v-for="status in statusOptions"
          :key="status.value"
          :value="status.value"
        >
          {{ status.label }}
        </el-radio-button>
      </el-radio-group>
    </section>

    <section class="order-section">
      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading" size="20"><Loading /></el-icon>
        <span>订单加载中...</span>
      </div>

      <el-empty
        v-else-if="orders.length === 0"
        description="暂无订单"
        :image-size="90"
      />

      <el-collapse v-else v-model="openedOrders" class="order-list">
        <el-collapse-item
          v-for="order in orders"
          :key="order.orderId"
          :name="order.orderId"
        >
          <template #title>
            <div class="order-title">
              <div class="order-title-main">
                <strong>{{ order.shopName }}</strong>
                <span>{{ formatTime(order.createTime) }}</span>
              </div>
              <el-tag size="small" :type="statusTagType(order.status)" effect="plain">
                {{ statusText(order.status) }}
              </el-tag>
            </div>
          </template>

          <div class="order-detail">
            <div class="detail-row">
              <span>订单编号</span>
              <strong>{{ order.orderId }}</strong>
            </div>
            <div class="detail-row">
              <span>收货人</span>
              <strong>{{ order.receiverName }}</strong>
            </div>
            <div class="detail-row">
              <span>联系电话</span>
              <strong>{{ order.receiverPhone }}</strong>
            </div>
            <div class="detail-row">
              <span>配送地址</span>
              <strong>{{ order.receiverAddress }}</strong>
            </div>

            <div class="goods-list">
              <div
                v-for="item in order.items"
                :key="item.itemId"
                class="goods-row"
              >
                <span>{{ item.name }} x{{ item.quantity }}</span>
                <strong>&yen;{{ item.amount.toFixed(2) }}</strong>
              </div>
            </div>

            <div class="detail-row total-row">
              <span>合计（含配送费 &yen;{{ order.deliveryFee }}）</span>
              <strong>&yen;{{ order.amount.toFixed(2) }}</strong>
            </div>

            <p v-if="order.remark" class="remark">备注：{{ order.remark }}</p>

            <!-- 操作按钮 -->
            <div class="order-actions" v-if="orderActions(order.status).length > 0">
              <el-button
                v-for="action in orderActions(order.status)"
                :key="action.key"
                :type="action.type"
                size="small"
                @click="handleAction(order, action.key)"
              >
                {{ action.label }}
              </el-button>
            </div>

            <!-- 评价表单 -->
            <div v-if="reviewOrderId === order.orderId" class="review-form">
              <el-rate v-model="reviewScore" show-score />
              <el-input
                v-model="reviewContent"
                type="textarea"
                :rows="2"
                placeholder="写下你的评价..."
              />
              <el-button
                type="primary"
                size="small"
                :loading="reviewSubmitting"
                @click="submitReview(order.orderId)"
              >
                提交评价
              </el-button>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { showErrorMessage } from '@/api/http'
import {
  listOrderApi,
  payOrderAlipayApi,
  payOrderWalletApi,
  merchantAcceptApi,
  merchantRejectApi,
  riderAcceptApi,
  riderArriveApi,
  createOrderReviewApi,
  OrderStatusText,
  type OrderVO,
} from '@/api/order'

const userStore = useUserStore()

const activeStatus = ref<string>('all')
const loading = ref(false)
const orders = ref<OrderVO[]>([])
const openedOrders = ref<string[]>([])

// 评价
const reviewOrderId = ref('')
const reviewScore = ref(5)
const reviewContent = ref('')
const reviewSubmitting = ref(false)

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '待支付', value: '0' },
  { label: '待接单', value: '1' },
  { label: '待配送', value: '2' },
  { label: '待送达', value: '3' },
  { label: '待评价', value: '4' },
  { label: '已完成', value: '5' },
]

const statusText = (status: number) => OrderStatusText[status] || '未知'

const statusTagType = (status: number): 'warning' | 'primary' | 'success' | 'danger' | 'info' => {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'primary',
    5: 'success',
    6: 'info',
    7: 'info',
  }
  return (map[status] || 'info') as 'warning' | 'primary' | 'success' | 'danger' | 'info'
}

interface OrderAction {
  key: string
  label: string
  type: 'primary' | 'success' | 'warning' | 'danger'
}

const orderActions = (status: number): OrderAction[] => {
  const actions: Record<number, OrderAction[]> = {
    0: [
      { key: 'pay-alipay', label: '支付宝支付', type: 'primary' },
      { key: 'pay-wallet', label: '钱包支付', type: 'success' },
    ],
    1: [
      { key: 'merchant-accept', label: '接单', type: 'success' },
      { key: 'merchant-reject', label: '拒单', type: 'danger' },
    ],
    2: [{ key: 'rider-accept', label: '骑手接单', type: 'primary' }],
    3: [{ key: 'rider-arrive', label: '确认送达', type: 'success' }],
    4: [{ key: 'review', label: '评价', type: 'primary' }],
  }
  return actions[status] || []
}

const fetchOrders = async () => {
  if (!userStore.token) return

  loading.value = true
  try {
    const params: { status?: number; page?: number; size?: number } = { size: 50 }
    if (activeStatus.value !== 'all') {
      params.status = Number(activeStatus.value)
    }
    const result = await listOrderApi(params, userStore.token)
    orders.value = result.records || []
  } catch (error) {
    showErrorMessage(error)
  } finally {
    loading.value = false
  }
}

const handleAction = async (order: OrderVO, action: string) => {
  const token = userStore.token
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    switch (action) {
      case 'pay-alipay': {
        const result = await payOrderAlipayApi(order.orderId, token)
        ElMessage.success(`支付订单已创建，请扫码支付：${result.payUrl}`)
        break
      }
      case 'pay-wallet':
        await payOrderWalletApi(order.orderId, token)
        ElMessage.success('支付成功')
        break
      case 'merchant-accept':
        await merchantAcceptApi(order.orderId, token)
        ElMessage.success('已接单')
        break
      case 'merchant-reject':
        await merchantRejectApi(order.orderId, token)
        ElMessage.success('已拒单')
        break
      case 'rider-accept':
        await riderAcceptApi(order.orderId, token)
        ElMessage.success('已接单')
        break
      case 'rider-arrive':
        await riderArriveApi(order.orderId, token)
        ElMessage.success('已确认送达')
        break
      case 'review':
        reviewOrderId.value = order.orderId
        reviewScore.value = 5
        reviewContent.value = ''
        break
    }
    fetchOrders()
  } catch (error) {
    showErrorMessage(error)
  }
}

const submitReview = async (orderId: string) => {
  if (!userStore.token) return
  reviewSubmitting.value = true
  try {
    await createOrderReviewApi(
      orderId,
      { score: reviewScore.value, content: reviewContent.value },
      userStore.token
    )
    ElMessage.success('评价成功')
    reviewOrderId.value = ''
    fetchOrders()
  } catch (error) {
    showErrorMessage(error)
  } finally {
    reviewSubmitting.value = false
  }
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return `今天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
    if (diff < 172800000) return `昨天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return timeStr
  }
}

onMounted(fetchOrders)
</script>

<style scoped>
.order-page {
  min-height: 100%;
  background-color: #f5f5f5;
  padding-bottom: 18px;
}

.order-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  background-image: linear-gradient(90deg, #0af, #0085ff);
}

.order-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
}

.status-section {
  padding: 12px;
  background-color: #ffffff;
}

.status-group {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

.status-group :deep(.el-radio-button) {
  flex: 1;
  min-width: 0;
}

.status-group :deep(.el-radio-button__inner) {
  width: 100%;
  padding: 8px 4px;
  font-size: 12px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
  gap: 8px;
  font-size: 14px;
}

.order-section {
  padding: 12px;
}

.order-list {
  border: none;
  background-color: transparent;
}

.order-list :deep(.el-collapse-item) {
  margin-bottom: 10px;
  overflow: hidden;
  border-radius: 8px;
  background-color: #ffffff;
}

.order-list :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 72px;
  padding: 12px;
  border-bottom: none;
}

.order-list :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

.order-list :deep(.el-collapse-item__content) {
  padding: 0 12px 14px;
}

.order-title {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-title-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.order-title-main strong {
  color: #222222;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-title-main span {
  color: #999999;
  font-size: 12px;
  line-height: 1.2;
}

.order-detail {
  padding-top: 2px;
  border-top: 1px solid #f0f0f0;
}

.detail-row,
.goods-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  color: #666666;
  font-size: 13px;
  line-height: 1.4;
}

.detail-row span,
.goods-row span {
  flex-shrink: 0;
}

.detail-row strong,
.goods-row strong {
  min-width: 0;
  color: #333333;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.goods-list {
  margin-top: 10px;
  padding-top: 2px;
  border-top: 1px dashed #e6e6e6;
}

.total-row strong {
  color: #ff5339;
  font-size: 17px;
  font-weight: 700;
}

.remark {
  margin: 12px 0 0;
  padding: 9px 10px;
  border-radius: 6px;
  background-color: #f7f8fa;
  color: #777777;
  font-size: 13px;
  line-height: 1.45;
}

.order-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.review-form {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>

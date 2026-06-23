<template>
  <div class="order-page">
    <header class="order-header">
      <h2>订单</h2>
    </header>
    <section class="role-section">
      <div class="role-tabs">
        <span
          v-for="r in roles"
          :key="r.value"
          class="role-item"
          :class="{ active: activeRole === r.value }"
          @click="switchRole(r.value)"
        >{{ r.label }}</span>
      </div>
    </section>
    <section class="status-section">
      <el-select v-model="activeStatus" placeholder="订单状态" size="small" @change="switchStatus">
        <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
    </section>
    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        size="small" background
        v-model:current-page="currentPage"
        :page-size="pageSize" :pager-count="5"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchOrders"
      />
    </div>
    <section class="order-section">
      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading" size="24"><Loading /></el-icon>
        <span>订单加载中...</span>
      </div>

      <el-empty v-else-if="orders.length === 0" description="暂无订单" :image-size="90" />

      <div v-else class="order-list">
        <div v-for="order in orders" :key="order.orderId" class="order-card" @click="toggleOrder(order.orderId)">
          <div class="order-top">
            <strong>{{ order.shopName }}</strong>
            <div class="order-top-right">
              <span v-if="order.status === 0 && order.expireTime" class="expire-countdown">{{ countdownText[order.orderId] }}</span>
              <el-tag size="small" :color="statusColor(order.status)" effect="dark" style="border:none">{{ OrderStatusText[order.status] || '未知' }}</el-tag>
            </div>
          </div>
          <div class="order-items">
            <span v-for="item in order.items" :key="item.itemId">{{ item.name }} x{{ item.quantity }}</span>
          </div>
          <div class="order-bottom">
            <span class="order-time">{{ formatTime(order.createTime) }}</span>
            <strong class="order-amount">&yen;{{ order.amount.toFixed(2) }}</strong>
          </div>
    <div v-if="expandedId === order.orderId" class="order-detail">
            <div class="detail-row"><span>订单编号</span><strong>{{ order.orderId }}</strong></div>
            <div class="detail-row"><span>收货人</span><strong>{{ order.receiverName }} {{ order.receiverPhone }}</strong></div>
            <div class="detail-row"><span>地址</span>
              <el-tooltip :content="order.receiverAddress" placement="top" :show-after="400">
                <strong class="text-ellipsis">{{ order.receiverAddress }}</strong>
              </el-tooltip>
            </div>
            <div class="detail-row" v-if="order.remark"><span>备注</span>
              <el-tooltip :content="order.remark" placement="top" :show-after="400">
                <strong class="text-ellipsis">{{ order.remark }}</strong>
              </el-tooltip>
            </div>
            <div class="detail-divider"></div>
            <div class="detail-row" v-for="item in order.items" :key="item.itemId">
              <span>{{ item.name }} x{{ item.quantity }}</span>
              <strong>&yen;{{ item.amount.toFixed(2) }}</strong>
            </div>
            <div class="detail-row total"><span>合计（含配送 &yen;{{ order.deliveryFee }}）</span><strong>&yen;{{ order.amount.toFixed(2) }}</strong></div>
            <div class="detail-contact">
              <el-button size="small" plain @click="contactChat(order.userId)">联系用户</el-button>
              <el-button size="small" plain @click="contactChat(order.shopOwnerId)">联系商家</el-button>
              <el-button size="small" plain @click="contactChat(order.riderId)">联系骑手</el-button>
            </div>
            <div class="detail-actions" v-if="getActions(order).length > 0">
              <el-button
                v-for="act in getActions(order)"
                :key="act.key"
                size="small"
                :type="act.type"
                @click="handleAction(order, act.key)"
              >{{ act.label }}</el-button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <el-dialog v-model="reviewVisible" title="评价订单" width="90%">
      <el-form label-position="top" size="default">
        <el-form-item label="评分">
          <el-rate v-model="reviewScore" show-score :max="5" allow-half />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="reviewContent" type="textarea" :rows="3" placeholder="写下你的评价..." />
        </el-form-item>
        <el-form-item label="图片（最多5张）">
          <div class="review-imgs">
            <div v-for="(img, i) in reviewImages" :key="i" class="review-img-wrap">
              <el-image :src="img" fit="cover" class="review-upload-img" />
              <el-icon class="review-img-del" @click="reviewImages.splice(i, 1)"><CircleCloseFilled /></el-icon>
            </div>
            <div v-if="reviewImages.length < 5" class="review-upload-btn" @click="triggerReviewImg">
              <el-icon size="24"><Plus /></el-icon>
            </div>
            <input ref="reviewImgInputRef" type="file" accept="image/*" style="display:none" @change="onReviewImgChange" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewSubmitting" @click="submitReview">提交评价</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="payVisible" :title="payStep === 'qrcode' ? '支付宝支付' : '选择支付方式'" width="300px" :close-on-click-modal="false" align-center>
      <div v-if="payStep === 'choose'" class="pay-choose">
        <div class="pay-option" :class="{ disabled: payLoading }" @click="doPay('alipay')">
          <span class="pay-icon alipay"><el-icon size="28"><Money /></el-icon></span>
          <span class="pay-label">支付宝支付</span>
        </div>
        <div class="pay-option" :class="{ disabled: payLoading }" @click="doPay('wallet')">
          <span class="pay-icon wallet"><el-icon size="28"><Wallet /></el-icon></span>
          <span class="pay-label">钱包支付</span>
        </div>
      </div>
      <div v-else-if="payStep === 'qrcode'" class="pay-qrcode">
        <img v-if="qrImage" :src="qrImage" class="qr-img" />
        <p class="qr-tip">请使用支付宝扫码支付</p>
        <el-button size="small" :loading="qrRefreshing" @click="refreshQrCode">刷新二维码</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Money, Wallet, Plus, CircleCloseFilled } from '@element-plus/icons-vue'
import {
  listUserOrdersApi, listShopOwnerOrdersApi, listRiderOrdersApi,
  OrderStatusText, type OrderVO,
  payOrderAlipayApi, payOrderWalletApi,
  merchantAcceptApi, merchantRejectApi,
  riderAcceptApi, riderArriveApi,
  cancelOrderApi, createOrderReviewApi,
} from '@/api/order'
import { getPaymentStatusApi, refreshAlipayApi } from '@/api/payment'
import { useUserStore } from '@/stores/user'
import { showErrorMessage } from '@/api/http'
import { uploadImage } from '@/services/fileUpload'
import { createQrCodeDataUrl } from '@/utils/qrcode'

const router = useRouter()
const userStore = useUserStore()

const roles = [
  { label: '用户', value: 'user' },
  { label: '商家', value: 'merchant' },
  { label: '骑手', value: 'rider' },
]

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '待支付', value: '0' },
  { label: '待接单', value: '1' },
  { label: '待配送', value: '2' },
  { label: '待送达', value: '3' },
  { label: '待评价', value: '4' },
  { label: '已完成', value: '5' },
  { label: '已过期', value: '6' },
  { label: '已取消', value: '7' },
]

const activeRole = ref('user')
const activeStatus = ref('all')
const orders = ref<OrderVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 5
const total = ref(0)
const expandedId = ref('')

// 获取订单状态颜色。
const statusColor = (s: number) => {
  const m: Record<number, string> = {
    0: '#e6a23c',   // 待支付 - 橙
    1: '#f56c6c',   // 待接单 - 红
    2: '#b88230',   // 待配送 - 棕
    3: '#409eff',   // 待送达 - 蓝
    4: '#9b59b6',   // 待评价 - 紫
    5: '#67c23a',   // 已完成 - 绿
    6: '#909399',   // 已过期 - 灰
    7: '#c0c4cc',   // 已取消 - 浅灰
  }
  return m[s] || '#909399'
}

// 切换订单角色。
const switchRole = (r: string) => {
  activeRole.value = r; activeStatus.value = 'all'; currentPage.value = 1; fetchOrders()
}
// 切换订单状态筛选。
const switchStatus = () => {
  currentPage.value = 1; fetchOrders()
}
// 切换订单详情展开状态。
const toggleOrder = (id: string) => {
  expandedId.value = expandedId.value === id ? '' : id
}

// 跳转聊天页面。
const contactChat = (userId: string) => {
  if (!userId) { ElMessage.warning('暂无对方信息'); return }
  if (userId === userStore.userId) { ElMessage.warning('不能和自己聊天'); return }
  router.push({ path: '/chat', query: { userId } })
}

interface ActionItem { key: string; label: string; type: 'primary' | 'success' | 'warning' | 'danger' }
const getActions = (order: OrderVO): ActionItem[] => {
  const role = activeRole.value; const s = order.status
  const actions: ActionItem[] = []
  if (role === 'user') {
    if (s === 0 && order.expireTime && new Date(order.expireTime).getTime() > Date.now()) {
      actions.push(
        { key: 'pay', label: '支付订单', type: 'primary' },
        { key: 'cancel', label: '取消订单', type: 'warning' },
      )
    }
    if (s === 4) actions.push({ key: 'review', label: '评价订单', type: 'primary' })
  }
  if (role === 'merchant') {
    if (s === 1) actions.push(
      { key: 'accept', label: '商家接单', type: 'success' },
      { key: 'reject', label: '商家拒单', type: 'danger' },
    )
  }
  if (role === 'rider') {
    if (s === 2) actions.push({ key: 'rider-accept', label: '骑手接单', type: 'primary' })
    if (s === 3) actions.push({ key: 'rider-arrive', label: '确认送达', type: 'success' })
  }
  if (s === 3 && role !== 'rider') actions.push({ key: 'rider-location', label: '骑手位置', type: 'primary' })
  return actions
}

const payVisible = ref(false)
const payStep = ref<'choose' | 'qrcode'>('choose')
const payingOrderId = ref('')
const qrImage = ref('')
const pollingStatus = ref('')
let pollTimer: number | undefined

// 处理订单操作。
const handleAction = async (order: OrderVO, action: string) => {
  if (action === 'pay') {
    payingOrderId.value = order.orderId
    payStep.value = 'choose'
    payVisible.value = true
    return
  }
  if (action === 'rider-location') {
    router.push({
      path: '/map',
      query: {
        riderId: order.riderId,
        destLng: String(order.receiverLongitude),
        destLat: String(order.receiverLatitude),
      },
    })
    return
  }
  if (action === 'review') {
    payingOrderId.value = order.orderId
    reviewScore.value = 5
    reviewContent.value = ''
    reviewImages.value = []
    reviewVisible.value = true
    return
  }
  try {
    switch (action) {
      case 'accept': await merchantAcceptApi(order.orderId, ''); break
      case 'reject': await merchantRejectApi(order.orderId, ''); break
      case 'rider-accept': await riderAcceptApi(order.orderId, ''); break
      case 'rider-arrive': await riderArriveApi(order.orderId, ''); break
      case 'cancel': await cancelOrderApi(order.orderId, ''); break
    }
    fetchOrders()
  } catch (e) { showErrorMessage(e) }
}

// 发起订单支付。
const payLoading = ref(false)

const doPay = async (method: 'alipay' | 'wallet') => {
  if (payLoading.value) return
  payLoading.value = true
  try {
    if (method === 'wallet') {
      await payOrderWalletApi(payingOrderId.value, '')
      payVisible.value = false
      fetchOrders()
      return
    }
    // 支付宝支付
    const result = await payOrderAlipayApi(payingOrderId.value, '')
    qrImage.value = await createQrCodeDataUrl(result.payUrl)
    payStep.value = 'qrcode'
    startPollPayment(result.paymentId)
  } catch (e) { showErrorMessage(e) }
    finally { payLoading.value = false }
}

watch(payVisible, (v) => { if (!v) stopPollPayment() })

// 启动支付状态轮询。
let currentPaymentId = ''
const qrRefreshing = ref(false)

const refreshQrCode = async () => {
  if (!currentPaymentId || qrRefreshing.value) return
  stopPollPayment()
  qrRefreshing.value = true
  try {
    const result = await refreshAlipayApi(currentPaymentId, '')
    qrImage.value = await createQrCodeDataUrl(result.payUrl)
    currentPaymentId = result.paymentId
    startPollPayment(result.paymentId)
    ElMessage.success('二维码已刷新')
  } catch (e) { showErrorMessage(e) }
  finally { qrRefreshing.value = false }
}

const startPollPayment = (paymentId: string) => {
  stopPollPayment()
  currentPaymentId = paymentId
  pollingStatus.value = '等待支付...'
  pollTimer = window.setInterval(async () => {
    try {
      const r = await getPaymentStatusApi(paymentId, '')
      if (r.status !== 0) {
        stopPollPayment()
        if (r.status === 1) { pollingStatus.value = '支付成功！'; setTimeout(() => { payVisible.value = false; fetchOrders() }, 1500) }
        else if (r.status === 2) pollingStatus.value = '支付已过期'
        else if (r.status === 3) pollingStatus.value = '订单已取消'
        else pollingStatus.value = '状态异常'
      } else { pollingStatus.value = '等待支付...' }
    } catch { pollingStatus.value = '查询状态失败' }
  }, 2000)
}

// 停止支付状态轮询。
const stopPollPayment = () => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = undefined }
}

// 评价
const reviewVisible = ref(false)
const reviewScore = ref(5)
const reviewContent = ref('')
const reviewImages = ref<string[]>([])
const reviewSubmitting = ref(false)
const reviewImgInputRef = ref<HTMLInputElement | null>(null)

// 触发评价图片选择。
const triggerReviewImg = () => reviewImgInputRef.value?.click()
// 处理评价图片选择。
const onReviewImgChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const result = await uploadImage(file, '')
  if (result) reviewImages.value.push(result.url)
  input.value = ''  // 重置，允许再次选择同一文件
}

// 提交订单评价。
const submitReview = async () => {
  if (!reviewContent.value.trim()) { showErrorMessage(new Error('请填写评价内容')); return }
  reviewSubmitting.value = true
  try {
    await createOrderReviewApi(payingOrderId.value, {
      score: reviewScore.value,
      content: reviewContent.value.trim(),
      images: reviewImages.value,
    }, '')
    ElMessage.success('评价成功')
    reviewVisible.value = false
    fetchOrders()
  } catch (e) { showErrorMessage(e) }
  finally { reviewSubmitting.value = false }
}

// 加载订单列表。
const fetchOrders = async () => {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, size: pageSize }
    if (activeStatus.value !== 'all') params.status = Number(activeStatus.value)
    const api = activeRole.value === 'merchant' ? listShopOwnerOrdersApi : activeRole.value === 'rider' ? listRiderOrdersApi : listUserOrdersApi
    const result = await api(params, '')
    orders.value = result.records || []
    total.value = result.total > 0 ? result.total : ((result.records?.length === pageSize) ? currentPage.value * pageSize + 1 : (currentPage.value - 1) * pageSize + (result.records?.length || 0))
  } catch (e) { showErrorMessage(e) }
  finally { loading.value = false }
}

// 格式化时间显示。
const formatTime = (t: string) => {
  if (!t) return ''
  try { const d = new Date(t); return `${d.getMonth() + 1}月${d.getDate()}日 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` }
  catch { return t }
}

const now = ref(Date.now())
const countdownText = computed(() => {
  const m: Record<string, string> = {}
  for (const o of orders.value) {
    if (o.status !== 0 || !o.expireTime) continue
    const left = new Date(o.expireTime).getTime() - now.value
    if (left <= 0) m[o.orderId] = '已过期'
    else {
      const min = Math.floor(left / 60000)
      const sec = Math.floor((left % 60000) / 1000)
      m[o.orderId] = `${min}:${String(sec).padStart(2, '0')}`
    }
  }
  return m
})

let countdownTimer: number | undefined
onMounted(() => {
  fetchOrders()
  countdownTimer = window.setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => { if (countdownTimer) clearInterval(countdownTimer); stopPollPayment() })
</script>

<style scoped>
.order-page {
  min-height: 100%;
  background: #f5f5f5;
  padding-bottom: 18px;
}
.order-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(90deg, #0af, #0085ff);
}
.order-header h2 {
  margin: 0;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.role-section {
  background: #fff;
}
.role-tabs {
  display: flex;
  padding: 0 12px;
}
.role-item {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: .2s;
}
.role-item.active {
  color: #0085ff;
  border-bottom-color: #0085ff;
  font-weight: 600;
}

.status-section {
  background: #fff;
  border-top: 1px solid #f0f0f0;
  padding: 10px 12px;
}

.order-section {
  padding: 12px;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #999;
  gap: 10px;
}

.order-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  outline: none;
}
.order-card :deep(.el-tag) {
  border: none;
}
.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.order-top strong {
  font-size: 16px;
  color: #333;
}
.order-top-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.expire-countdown {
  font-size: 13px;
  color: #ff5339;
  font-weight: 600;
}
.order-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-bottom: 8px;
}
.order-items span {
  font-size: 13px;
  color: #666;
}
.order-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-time {
  font-size: 12px;
  color: #999;
}
.order-amount {
  font-size: 16px;
  color: #ff5339;
}

.order-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
  color: #666;
}
.detail-row strong {
  color: #333;
  text-align: right;
}
.text-ellipsis {
  display: block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detail-divider {
  border-top: 1px dashed #eee;
  margin: 6px 0;
}
.detail-row.total {
  font-size: 15px;
}
.detail-row.total strong {
  color: #ff5339;
  font-weight: 700;
}
.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.detail-contact {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.detail-contact .el-button,
.detail-actions .el-button {
  flex: 1;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.pay-choose {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pay-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: .2s;
}
.pay-option:hover {
  border-color: #0085ff;
  background: #f5f9ff;
}
.pay-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.pay-icon.alipay {
  background: #1677ff;
}
.pay-icon.wallet {
  background: #67c23a;
}
.pay-label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.pay-qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.qr-img {
  width: 200px;
  height: 200px;
}
.qr-tip {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.review-imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.review-img-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
}
.review-upload-img {
  width: 100%;
  height: 100%;
}
.review-img-del {
  position: absolute;
  top: -2px;
  right: -2px;
  color: #f56c6c;
  cursor: pointer;
  font-size: 16px;
  background: #fff;
  border-radius: 50%;
}
.review-upload-btn {
  width: 72px;
  height: 72px;
  border: 1px dashed #ddd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  cursor: pointer;
}
</style>

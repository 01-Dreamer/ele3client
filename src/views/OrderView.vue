<template>
  <div class="order-page">
    <header class="order-header">
      <h2>订单</h2>
    </header>

    <section class="role-section">
      <el-tabs v-model="activeRole" stretch class="role-tabs">
        <el-tab-pane
          v-for="role in roles"
          :key="role.value"
          :label="role.label"
          :name="role.value"
        />
      </el-tabs>
    </section>

    <section class="status-section">
      <el-radio-group v-model="activeStatus" size="large" class="status-group">
        <el-radio-button
          v-for="status in currentStatusOptions"
          :key="status.value"
          :label="status.value"
        >
          {{ status.label }}
        </el-radio-button>
      </el-radio-group>
    </section>

    <section class="order-section">
      <el-empty
        v-if="currentOrders.length === 0"
        description="暂无订单"
        :image-size="90"
      />

      <el-collapse v-else v-model="openedOrders" class="order-list">
        <el-collapse-item
          v-for="order in currentOrders"
          :key="order.id"
          :name="order.id"
        >
          <template #title>
            <div class="order-title">
              <div class="order-title-main">
                <strong>{{ order.title }}</strong>
                <span>{{ order.createdAt }}</span>
              </div>
              <el-tag size="small" :type="order.tagType" effect="plain">
                {{ order.statusText }}
              </el-tag>
            </div>
          </template>

          <div class="order-detail">
            <div class="detail-row">
              <span>订单编号</span>
              <strong>{{ order.orderNo }}</strong>
            </div>
            <div class="detail-row">
              <span>商家</span>
              <strong>{{ order.shopName }}</strong>
            </div>
            <div class="detail-row">
              <span>用户</span>
              <strong>{{ order.customerName }}</strong>
            </div>
            <div class="detail-row">
              <span>骑手</span>
              <strong>{{ order.riderName }}</strong>
            </div>
            <div class="detail-row">
              <span>配送地址</span>
              <strong>{{ order.address }}</strong>
            </div>

            <div class="goods-list">
              <div
                v-for="item in order.items"
                :key="item.name"
                class="goods-row"
              >
                <span>{{ item.name }} x{{ item.count }}</span>
                <strong>&yen;{{ item.price }}</strong>
              </div>
            </div>

            <div class="detail-row total-row">
              <span>合计</span>
              <strong>&yen;{{ order.amount }}</strong>
            </div>

            <p class="remark">备注：{{ order.remark }}</p>
          </div>
        </el-collapse-item>
      </el-collapse>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type RoleKey = 'user' | 'merchant' | 'rider'
type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

interface RoleTab {
  label: string
  value: RoleKey
}

interface StatusOption {
  label: string
  value: string
}

interface OrderGoods {
  name: string
  count: number
  price: number
}

interface OrderItem {
  id: string
  role: RoleKey
  status: string
  statusText: string
  tagType: TagType
  orderNo: string
  title: string
  createdAt: string
  shopName: string
  customerName: string
  riderName: string
  address: string
  amount: number
  remark: string
  items: OrderGoods[]
}

const roles: RoleTab[] = [
  { label: '用户', value: 'user' },
  { label: '商家', value: 'merchant' },
  { label: '骑手', value: 'rider' }
]

const statusOptions: Record<RoleKey, StatusOption[]> = {
  user: [
    { label: '待支付', value: 'pendingPay' },
    { label: '待评价', value: 'pendingReview' },
    { label: '已完成', value: 'completed' }
  ],
  merchant: [
    { label: '待接单', value: 'pendingAccept' },
    { label: '待配送', value: 'pendingDelivery' },
    { label: '已完成', value: 'completed' }
  ],
  rider: [
    { label: '待抢单', value: 'orderHall' },
    { label: '待配送', value: 'pendingDelivery' },
    { label: '已完成', value: 'completed' }
  ]
}

const getDefaultStatus = (role: RoleKey) => statusOptions[role][0]?.value ?? ''

const activeRole = ref<RoleKey>('user')
const activeStatus = ref(getDefaultStatus('user'))
const openedOrders = ref<string[]>([])

const orders = ref<OrderItem[]>([
  {
    id: 'u-1001',
    role: 'user',
    status: 'pendingPay',
    statusText: '待支付',
    tagType: 'warning',
    orderNo: 'ELM202606150001',
    title: '万家饺子（软件园店）',
    createdAt: '今天 12:20',
    shopName: '万家饺子（软件园店）',
    customerName: '张同学',
    riderName: '待分配',
    address: '天府软件园D区 3栋 1206',
    amount: 36,
    remark: '不要香菜，餐具一份',
    items: [
      { name: '猪肉白菜水饺', count: 1, price: 22 },
      { name: '酸梅汤', count: 2, price: 7 }
    ]
  },
  {
    id: 'u-1002',
    role: 'user',
    status: 'pendingReview',
    statusText: '待评价',
    tagType: 'primary',
    orderNo: 'ELM202606140018',
    title: '小明家常菜',
    createdAt: '昨天 18:42',
    shopName: '小明家常菜',
    customerName: '张同学',
    riderName: '骑手小陈',
    address: '天府软件园D区 3栋 1206',
    amount: 48,
    remark: '米饭多一点',
    items: [
      { name: '鱼香肉丝盖饭', count: 1, price: 26 },
      { name: '番茄鸡蛋汤', count: 1, price: 12 },
      { name: '配送费', count: 1, price: 10 }
    ]
  },
  {
    id: 'u-1003',
    role: 'user',
    status: 'completed',
    statusText: '已完成',
    tagType: 'success',
    orderNo: 'ELM202606120026',
    title: '蜜雪冰城',
    createdAt: '6月12日 15:08',
    shopName: '蜜雪冰城',
    customerName: '张同学',
    riderName: '骑手王师傅',
    address: '天府软件园D区 正门',
    amount: 18,
    remark: '少冰，正常糖',
    items: [
      { name: '柠檬水', count: 2, price: 8 },
      { name: '打包费', count: 1, price: 2 }
    ]
  },
  {
    id: 'm-2001',
    role: 'merchant',
    status: 'pendingAccept',
    statusText: '待接单',
    tagType: 'danger',
    orderNo: 'ELM202606150021',
    title: '新订单待确认',
    createdAt: '今天 12:33',
    shopName: '万家饺子（软件园店）',
    customerName: '李女士',
    riderName: '待分配',
    address: '天府软件园A区 1栋',
    amount: 52,
    remark: '尽快送达',
    items: [
      { name: '牛肉蒸饺', count: 2, price: 21 },
      { name: '紫菜蛋花汤', count: 1, price: 10 }
    ]
  },
  {
    id: 'm-2002',
    role: 'merchant',
    status: 'pendingDelivery',
    statusText: '待配送',
    tagType: 'warning',
    orderNo: 'ELM202606150017',
    title: '等待骑手取餐',
    createdAt: '今天 11:55',
    shopName: '万家饺子（软件园店）',
    customerName: '陈先生',
    riderName: '骑手小陈',
    address: '天府软件园B区 5栋',
    amount: 29,
    remark: '打包牢固一点',
    items: [
      { name: '三鲜水饺', count: 1, price: 24 },
      { name: '餐盒费', count: 1, price: 5 }
    ]
  },
  {
    id: 'm-2003',
    role: 'merchant',
    status: 'completed',
    statusText: '已完成',
    tagType: 'success',
    orderNo: 'ELM202606130033',
    title: '订单已完成',
    createdAt: '6月13日 13:16',
    shopName: '万家饺子（软件园店）',
    customerName: '赵同学',
    riderName: '骑手小王',
    address: '天府软件园C区 2栋',
    amount: 41,
    remark: '无',
    items: [
      { name: '猪肉韭菜水饺', count: 1, price: 25 },
      { name: '凉拌黄瓜', count: 1, price: 16 }
    ]
  },
  {
    id: 'r-3001',
    role: 'rider',
    status: 'orderHall',
    statusText: '待抢单',
    tagType: 'primary',
    orderNo: 'ELM202606150035',
    title: '3.2km 配送单',
    createdAt: '刚刚',
    shopName: '小明家常菜',
    customerName: '周女士',
    riderName: '待抢单',
    address: '天府软件园E区 7栋',
    amount: 64,
    remark: '送达前电话联系',
    items: [
      { name: '宫保鸡丁套餐', count: 1, price: 34 },
      { name: '红烧茄子', count: 1, price: 24 },
      { name: '配送费', count: 1, price: 6 }
    ]
  },
  {
    id: 'r-3002',
    role: 'rider',
    status: 'pendingDelivery',
    statusText: '待配送',
    tagType: 'warning',
    orderNo: 'ELM202606150029',
    title: '正在配送中',
    createdAt: '今天 12:05',
    shopName: '万家饺子（软件园店）',
    customerName: '林同学',
    riderName: '骑手小陈',
    address: '天府软件园D区 8栋',
    amount: 33,
    remark: '放前台即可',
    items: [
      { name: '香菇猪肉水饺', count: 1, price: 28 },
      { name: '配送费', count: 1, price: 5 }
    ]
  },
  {
    id: 'r-3003',
    role: 'rider',
    status: 'completed',
    statusText: '已完成',
    tagType: 'success',
    orderNo: 'ELM202606140041',
    title: '配送已完成',
    createdAt: '昨天 19:20',
    shopName: '蜜雪冰城',
    customerName: '王同学',
    riderName: '骑手小陈',
    address: '天府软件园A区 北门',
    amount: 22,
    remark: '无',
    items: [
      { name: '满杯百香果', count: 1, price: 12 },
      { name: '珍珠奶茶', count: 1, price: 10 }
    ]
  }
])

const currentStatusOptions = computed(() => statusOptions[activeRole.value])

const currentOrders = computed(() => {
  return orders.value.filter((order) => {
    return order.role === activeRole.value && order.status === activeStatus.value
  })
})

watch(activeRole, (role) => {
  activeStatus.value = getDefaultStatus(role)
  openedOrders.value = []
})

watch(activeStatus, () => {
  openedOrders.value = []
})
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

.role-section {
  background-color: #ffffff;
}

.role-tabs {
  padding: 0 12px;
}

.role-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.role-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

.role-tabs :deep(.el-tabs__item) {
  height: 48px;
  font-size: 15px;
}

.status-section {
  padding: 12px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
}

.status-group {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.status-group :deep(.el-radio-button__inner) {
  width: 100%;
  border-radius: 0;
}

.status-group :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 6px 0 0 6px;
}

.status-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 6px 6px 0;
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
</style>

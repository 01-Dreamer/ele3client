<template>
  <div class="shop-page">
    <header class="shop-header">
      <h2 v-if="shop">{{ isOwner ? '店铺管理' : '商家信息' }}</h2>
      <h2 v-else>加载中...</h2>
    </header>

    <section v-if="shop" class="shop-hero">
      <!-- 店铺主信息 -->
      <div class="shop-summary">
        <el-image class="shop-cover" :src="shop.avatar" fit="cover" />
        <div class="shop-copy">
          <h1>{{ shop.name }}</h1>
          <p>{{ shop.description }}</p>
        </div>
      </div>

      <div class="shop-meta">
        <div class="meta-item">
          <span>配送费</span>
          <strong>&yen;{{ shop.deliveryFee }}</strong>
        </div>
        <div class="meta-item">
          <span>评分</span>
          <strong>{{ reviewAvg(shop.reviewScore, shop.reviewCount) }}分</strong>
        </div>
        <div class="meta-item">
          <span>营业时间</span>
          <strong>{{ shop.openTime }}-{{ shop.closeTime }}</strong>
        </div>
      </div>

      <!-- 用户操作 -->
      <div v-if="!isOwner" class="shop-actions">
        <el-button type="primary" plain round @click="contactShop">联系商家</el-button>
        <el-button type="primary" round plain @click="toggleSection">
          {{ activeSection === 'menu' ? '查看评价' : '返回菜单' }}
        </el-button>
      </div>

      <!-- 店主操作 -->
      <div v-else class="shop-actions">
        <el-button type="primary" plain round @click="showEditShop = true">编辑店铺</el-button>
        <el-button plain round @click="showAddItem = true">添加商品</el-button>
        <el-button type="primary" round plain @click="toggleSection">
          {{ activeSection === 'menu' ? '查看评价' : '返回菜单' }}
        </el-button>
      </div>
    </section>

    <div v-if="!shop && !loading" class="empty-state">
      <el-empty description="店铺不存在" />
    </div>

    <!-- ========= 评价（通用） ========= -->
    <section v-if="activeSection === 'comments'" class="comment-section">
      <div v-if="reviewLoading" class="loading-state">
        <el-icon class="is-loading" size="20"><Loading /></el-icon>
        <span>评价加载中...</span>
      </div>

      <div v-for="review in reviews" :key="review.reviewId" class="comment-item">
        <el-avatar class="comment-avatar" :size="34" :src="getReviewAvatar(review.userId)" />
        <div class="comment-main">
          <div class="comment-top">
            <strong>{{ review.userId }}</strong>
            <span>{{ formatTime(review.createTime) }}</span>
          </div>
          <el-rate v-model="review.score" disabled size="small" text-color="#ff9900" />
          <p>{{ review.content }}</p>
          <div v-if="review.images && review.images.length" class="review-images">
            <el-image v-for="(img, i) in review.images" :key="i" :src="img" fit="cover" class="review-img" />
          </div>
        </div>
      </div>

      <div v-if="!reviewLoading && reviews.length === 0" class="empty-state">
        <el-empty description="暂无评价" :image-size="60" />
      </div>
    </section>

    <!-- ========= 菜单（用户视角） ========= -->
    <template v-if="activeSection === 'menu' && !isOwner">
      <section class="product-list">
        <div v-if="itemLoading" class="loading-state">
          <el-icon class="is-loading" size="20"><Loading /></el-icon>
          <span>商品加载中...</span>
        </div>

        <div v-for="product in items" :key="product.itemId" class="product-item">
          <el-image class="product-img" :src="product.image" fit="cover" lazy />
          <div class="product-info">
            <h3>{{ product.name }}</h3>
            <p>{{ product.description }}</p>
            <strong>&yen;{{ product.price }}</strong>
          </div>
          <div class="product-actions">
            <el-button v-if="getCartQty(product.itemId) > 0" circle size="small" class="count-btn minus-btn"
              :icon="Minus" @click.stop="decrement(product.itemId)" />
            <span v-if="getCartQty(product.itemId) > 0" class="quantity">{{ getCartQty(product.itemId) }}</span>
            <el-button circle size="small" type="primary" class="count-btn"
              :icon="Plus" @click.stop="increment(product.itemId)" />
          </div>
        </div>
      </section>

      <!-- 购物车 -->
      <footer class="cart-bar">
        <div class="cart-left">
          <el-badge :value="totalCount" :hidden="totalCount === 0" class="cart-badge">
            <div class="cart-icon"><el-icon><ShoppingCart /></el-icon></div>
          </el-badge>
          <div class="cart-price">
            <strong>&yen;{{ totalAmount.toFixed(2) }}</strong>
            <span v-if="shop">另需配送费{{ shop.deliveryFee }}元</span>
          </div>
        </div>
        <el-button class="checkout-btn" type="success" :disabled="totalCount === 0" @click="goCheckout">
          去结算
        </el-button>
      </footer>
    </template>

    <!-- ========= 菜单（店主视角） ========= -->
    <template v-if="activeSection === 'menu' && isOwner">
      <section class="product-list">
        <div v-if="itemLoading" class="loading-state">
          <el-icon class="is-loading" size="20"><Loading /></el-icon>
          <span>商品加载中...</span>
        </div>

        <div v-for="(product, idx) in items" :key="product.itemId" class="product-item product-item-owner">
          <el-image class="product-img" :src="product.image" fit="cover" lazy />
          <div class="product-info">
            <h3>{{ product.name }}</h3>
            <p>{{ product.description }}</p>
            <strong>&yen;{{ product.price }}</strong>
            <span v-if="product.status !== undefined && product.status !== 0" class="item-offline">已下架</span>
          </div>
          <div class="product-actions-owner">
            <el-button circle size="small" :icon="ArrowUp"
              :disabled="idx === 0" @click="swapItems(idx, idx - 1)" />
            <el-button circle size="small" :icon="ArrowDown"
              :disabled="idx === items.length - 1" @click="swapItems(idx, idx + 1)" />
            <el-button type="warning" plain size="small" @click="editItem(product)">编辑</el-button>
            <el-button type="danger" plain size="small" @click="confirmDeleteItem(product)">删除</el-button>
          </div>
        </div>
      </section>
    </template>

    <!-- ====== 弹窗 ====== -->

    <!-- 编辑店铺 -->
    <el-dialog v-model="showEditShop" title="编辑店铺" width="90%">
      <el-form v-if="editShopForm" label-position="top" size="default">
        <el-form-item label="名称">
          <el-input v-model="editShopForm.name" />
        </el-form-item>
        <el-form-item label="头像URL">
          <el-input v-model="editShopForm.avatar" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editShopForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="editShopForm.address" />
        </el-form-item>
        <el-form-item label="配送费">
          <el-input-number v-model="editShopForm.deliveryFee" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="营业开始">
          <el-input v-model="editShopForm.openTime" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="营业结束">
          <el-input v-model="editShopForm.closeTime" placeholder="HH:mm" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditShop = false">取消</el-button>
        <el-button type="primary" :loading="editShopSaving" @click="saveShop">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑商品 -->
    <el-dialog v-model="showItemForm" :title="editingItem ? '编辑商品' : '添加商品'" width="90%">
      <el-form label-position="top" size="default">
        <el-form-item label="名称">
          <el-input v-model="itemForm.name" />
        </el-form-item>
        <el-form-item label="图片URL">
          <el-input v-model="itemForm.image" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="itemForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="itemForm.price" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="editingItem" label="状态">
          <el-radio-group v-model="itemForm.status">
            <el-radio :value="0">正常</el-radio>
            <el-radio :value="1">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showItemForm = false">取消</el-button>
        <el-button type="primary" :loading="itemFormSaving" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>

    <!-- 下单弹窗（用户） -->
    <el-dialog v-if="!isOwner" v-model="orderDialogVisible" title="确认订单" width="90%">
      <el-form v-if="shop" label-position="top" size="default">
        <el-form-item label="收货人"><el-input v-model="orderForm.receiverName" placeholder="姓名" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="orderForm.receiverPhone" placeholder="手机号" /></el-form-item>
        <el-form-item label="收货地址"><el-input v-model="orderForm.receiverAddress" placeholder="详细地址" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="orderForm.remark" placeholder="口味、配送要求等" /></el-form-item>
        <div class="order-summary">
          <div class="order-summary-item" v-for="item in orderItems" :key="item.shopItemId">
            <span>{{ getItemName(item.shopItemId) }} x{{ item.quantity }}</span>
            <strong>&yen;{{ (getItemPrice(item.shopItemId) * item.quantity).toFixed(2) }}</strong>
          </div>
          <div class="order-summary-total">
            <span>合计</span><strong>&yen;{{ totalAmount.toFixed(2) }}</strong>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="orderSubmitting" @click="submitOrder">提交订单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Minus, Plus, ShoppingCart, Loading, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import {
  getShopApi, listShopItemApi, listShopReviewApi,
  modifyShopApi, addShopItemApi, modifyShopItemApi, deleteShopItemApi, swapShopItemsApi,
  type ShopVO, type ShopItemVO, type ShopReviewVO,
} from '@/api/shop'
import { createOrderApi, type OrderCreateItem } from '@/api/order'
import { showErrorMessage } from '@/api/http'

type ShopSection = 'menu' | 'comments'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const shop = ref<ShopVO | null>(null)
const items = ref<ShopItemVO[]>([])
const reviews = ref<ShopReviewVO[]>([])
const loading = ref(false)
const itemLoading = ref(false)
const reviewLoading = ref(false)
const activeSection = ref<ShopSection>('menu')

// 角色
const isOwner = computed(() => route.query.role === 'SHOP_OWNER')

// 购物车
const cart = reactive<Record<string, number>>({})

const reviewAvg = (score: number | string, count: number | string) => {
  const s = Number(score); const c = Number(count)
  if (!c) return 0
  return Math.round((s / c) * 10) / 10
}

// ---- 数据加载 ----
const fetchShop = async (shopId: string) => {
  loading.value = true
  try { shop.value = await getShopApi(shopId) } catch (e) { showErrorMessage(e) }
  finally { loading.value = false }
}
const fetchItems = async (shopId: string) => {
  itemLoading.value = true
  try {
    const list = await listShopItemApi(shopId)
    items.value = list.sort((a, b) => a.sort - b.sort)
  } catch { items.value = [] }
  finally { itemLoading.value = false }
}
const fetchReviews = async (shopId: string) => {
  reviewLoading.value = true
  try { const r = await listShopReviewApi(shopId); reviews.value = r.records || [] } catch { reviews.value = [] }
  finally { reviewLoading.value = false }
}

const init = (id: string) => { fetchShop(id); fetchItems(id); fetchReviews(id) }

watch(() => route.params.id, (n) => { if (typeof n === 'string' && n) init(n) })
onMounted(() => { const id = route.params.id; if (typeof id === 'string' && id) init(id) })

// ---- 用户：购物车 & 下单 ----
const getCartQty = (id: string) => cart[id] || 0
const increment = (id: string) => cart[id] = (cart[id] || 0) + 1
const decrement = (id: string) => { if (cart[id] > 0) cart[id]-- }
const getItemName = (id: string) => items.value.find(i => i.itemId === id)?.name || ''
const getItemPrice = (id: string) => items.value.find(i => i.itemId === id)?.price || 0
const totalCount = computed(() => Object.values(cart).reduce((s, q) => s + q, 0))
const totalAmount = computed(() => Object.entries(cart).reduce((s, [id, q]) => s + getItemPrice(id) * q, 0))
const orderItems = computed<OrderCreateItem[]>(() =>
  Object.entries(cart).filter(([, q]) => q > 0).map(([id, q]) => ({ shopItemId: id, quantity: q }))
)

const orderDialogVisible = ref(false); const orderSubmitting = ref(false)
const orderForm = reactive({ receiverName: '', receiverPhone: '', receiverAddress: '', remark: '' })

const goCheckout = () => {
  if (!userStore.isLoggedIn) { ElMessage.warning('请先登录'); router.push({ path: '/login', query: { redirect: route.fullPath } }); return }
  Object.assign(orderForm, { receiverName: '', receiverPhone: '', receiverAddress: '', remark: '' })
  orderDialogVisible.value = true
}
const submitOrder = async () => {
  if (!shop.value) return
  if (!orderForm.receiverName || !orderForm.receiverPhone || !orderForm.receiverAddress) { ElMessage.warning('请填写收货信息'); return }
  orderSubmitting.value = true
  try {
    await createOrderApi({ shopId: shop.value.shopId, ...orderForm, receiverLongitude: Number(shop.value.longitude), receiverLatitude: Number(shop.value.latitude), remark: orderForm.remark || undefined, items: orderItems.value }, userStore.token)
    ElMessage.success('下单成功'); orderDialogVisible.value = false; Object.keys(cart).forEach(k => delete cart[k]); router.push('/order')
  } catch (e) { showErrorMessage(e) }
  finally { orderSubmitting.value = false }
}

// ---- 店主：编辑店铺 ----
const showEditShop = ref(false)
const editShopForm = ref<{ name: string; avatar: string; description: string; address: string; deliveryFee: number; openTime: string; closeTime: string } | null>(null)
const editShopSaving = ref(false)

watch(showEditShop, (v) => {
  if (v && shop.value) editShopForm.value = { name: shop.value.name, avatar: shop.value.avatar, description: shop.value.description, address: shop.value.address, deliveryFee: Number(shop.value.deliveryFee), openTime: shop.value.openTime, closeTime: shop.value.closeTime }
})
const saveShop = async () => {
  if (!shop.value || !editShopForm.value) return
  editShopSaving.value = true
  try {
    const updated = await modifyShopApi(shop.value.shopId, editShopForm.value, userStore.token)
    shop.value = updated; showEditShop.value = false; ElMessage.success('店铺已更新')
  } catch (e) { showErrorMessage(e) }
  finally { editShopSaving.value = false }
}

// ---- 店主：商品管理 ----
const showItemForm = ref(false); const editingItem = ref<ShopItemVO | null>(null)
const itemForm = reactive({ name: '', image: '', description: '', price: 0, status: 0 })
const itemFormSaving = ref(false)
const showAddItem = ref(false)

watch(showAddItem, (v) => { if (v) { editingItem.value = null; Object.assign(itemForm, { name: '', image: '', description: '', price: 0, status: 0 }); showItemForm.value = true; showAddItem.value = false } })
const editItem = (item: ShopItemVO) => { editingItem.value = item; Object.assign(itemForm, { name: item.name, image: item.image, description: item.description, price: Number(item.price), status: item.status }); showItemForm.value = true }
const saveItem = async () => {
  if (!shop.value) return
  itemFormSaving.value = true
  try {
    if (editingItem.value) {
      const updated = await modifyShopItemApi(editingItem.value.itemId, itemForm, userStore.token)
      const idx = items.value.findIndex(i => i.itemId === updated.itemId); if (idx >= 0) items.value[idx] = updated
    } else {
      const created = await addShopItemApi(shop.value.shopId, { name: itemForm.name, image: itemForm.image, description: itemForm.description, price: itemForm.price }, userStore.token)
      items.value.push(created)
    }
    showItemForm.value = false; ElMessage.success(editingItem.value ? '商品已更新' : '商品已添加')
  } catch (e) { showErrorMessage(e) }
  finally { itemFormSaving.value = false }
}
const confirmDeleteItem = async (item: ShopItemVO) => {
  if (!shop.value) return
  try { await ElMessageBox.confirm(`确定删除「${item.name}」？`, '删除商品', { type: 'warning' }) } catch { return }
  try { await deleteShopItemApi(item.itemId, userStore.token); items.value = items.value.filter(i => i.itemId !== item.itemId); ElMessage.success('已删除') } catch (e) { showErrorMessage(e) }
}

// ---- 店主：商品排序 ----
const swapItems = async (i: number, j: number) => {
  const a = items.value[i]; const b = items.value[j]
  if (!a || !b) return
  try {
    await swapShopItemsApi({ itemIdA: a.itemId, itemIdB: b.itemId })
    // 后端交换 sort 值后重新排序
    items.value.sort((x, y) => x.sort - y.sort)
  } catch (e) {
    showErrorMessage(e)
  }
}

// ---- 通用 ----
const getReviewAvatar = (_: string) => '/default-avatar.svg'
const formatTime = (t: string) => {
  if (!t) return ''
  try { const d = new Date(t); const now = new Date(); const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return `今天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
    if (diff < 172800000) return `昨天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
    return `${d.getMonth() + 1}月${d.getDate()}日` } catch { return t }
}
const contactShop = () => { if (shop.value) router.push({ path: '/chat', query: { nickname: shop.value.name } }) }
const toggleSection = () => { activeSection.value = activeSection.value === 'menu' ? 'comments' : 'menu' }
</script>

<style scoped>
.shop-page { min-height: 100%; padding-bottom: 72px; background-color: #fff; }
.shop-header { height: 52px; display: flex; align-items: center; justify-content: center; background-image: linear-gradient(90deg, #0af, #0085ff); }
.shop-header h2 { margin: 0; color: #fff; font-size: 20px; font-weight: 600; }
.empty-state { padding: 40px; }
.loading-state { display: flex; align-items: center; justify-content: center; padding: 20px; color: #999; gap: 8px; font-size: 14px; }
.shop-hero { padding: 18px 20px 14px; background: #fff; }
.shop-summary { display: flex; align-items: center; gap: 14px; }
.shop-cover { width: 118px; height: 88px; border-radius: 8px; flex-shrink: 0; overflow: hidden; box-shadow: 0 8px 22px rgba(0,0,0,0.12); }
.shop-copy { min-width: 0; flex: 1; text-align: left; }
.shop-copy h1 { margin: 0 0 10px; color: #222; font-size: 18px; font-weight: 700; line-height: 1.25; }
.shop-copy p { margin: 0; color: #777; font-size: 13px; line-height: 1.45; }
.shop-meta { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin: 12px 0 0; padding: 10px; border-radius: 8px; background: #f7faff; }
.meta-item { min-width: 0; display: flex; flex-direction: column; gap: 5px; padding: 0 4px; border-right: 1px solid #e5eef9; }
.meta-item:last-child { border-right: none; }
.meta-item span { color: #888; font-size: 12px; }
.meta-item strong { color: #222; font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shop-actions { margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 10px; }
.shop-actions :deep(.el-button) { margin-left: 0; }

.comment-section { margin: 0 12px 10px; padding: 13px 12px 2px; border-radius: 8px; background: #f8fbff; }
.comment-item { display: flex; gap: 9px; padding: 11px 0; border-top: 1px solid #edf2f7; }
.comment-avatar { flex-shrink: 0; background: #f2f2f2; }
.comment-main { min-width: 0; flex: 1; }
.comment-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.comment-top strong { min-width: 0; color: #333; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.comment-top span { flex-shrink: 0; color: #999; font-size: 12px; }
.comment-main p { margin: 7px 0 0; color: #555; font-size: 13px; line-height: 1.45; }
.review-images { display: flex; gap: 6px; margin-top: 8px; }
.review-img { width: 60px; height: 60px; border-radius: 4px; }

.product-list { padding: 2px 12px 14px; }
.product-item { min-height: 96px; display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f1f1f1; }
.product-item-owner { flex-wrap: wrap; }
.product-img { width: 74px; height: 74px; border-radius: 6px; flex-shrink: 0; overflow: hidden; background: #f5f7fa; }
.product-info { min-width: 0; flex: 1; align-self: stretch; display: flex; flex-direction: column; justify-content: center; }
.product-info h3 { margin: 0; color: #333; font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.product-info p { margin: 7px 0; color: #888; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.product-info strong { color: #ff5339; font-size: 15px; font-weight: 700; }
.item-offline { color: #ccc; font-size: 12px; margin-top: 2px; }
.product-actions { width: 88px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-shrink: 0; }
.product-actions-owner { width: 100%; display: flex; align-items: center; gap: 6px; margin-top: 6px; }
.count-btn { width: 24px; height: 24px; }
.minus-btn { color: #999; border-color: #c8c8c8; }
.quantity { min-width: 14px; color: #333; font-size: 14px; text-align: center; }

.cart-bar { position: fixed; left: 50%; bottom: 55px; width: 100%; max-width: 414px; height: 58px; display: flex; align-items: stretch; transform: translateX(-50%); z-index: 20; box-sizing: border-box; background: #3c3c3c; }
.cart-left { min-width: 0; flex: 1; display: flex; align-items: center; gap: 10px; padding-left: 16px; }
.cart-icon { width: 46px; height: 46px; border-radius: 23px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 25px; background: #1296db; box-shadow: 0 0 0 5px rgba(255,255,255,0.1); }
.cart-badge :deep(.el-badge__content) { top: 5px; right: 8px; border: none; }
.cart-price { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.cart-price strong { color: #fff; font-size: 18px; font-weight: 700; }
.cart-price span { color: #cfcfcf; font-size: 12px; }
.checkout-btn { width: 118px; height: 100%; border: none; border-radius: 0; font-size: 17px; font-weight: 700; }

.order-summary { background: #f8f9fa; border-radius: 8px; padding: 12px; margin-top: 10px; }
.order-summary-item { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #666; }
.order-summary-total { display: flex; justify-content: space-between; padding-top: 10px; margin-top: 6px; border-top: 1px solid #e8e8e8; font-size: 16px; }
.order-summary-total strong { color: #ff5339; }
</style>

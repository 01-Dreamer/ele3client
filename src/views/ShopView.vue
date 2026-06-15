<template>
  <div class="shop-page">
    <header class="shop-header">
      <h2>商家信息</h2>
    </header>

    <section class="shop-hero">
      <div class="shop-summary">
        <el-image
          class="shop-cover"
          :src="shop.cover"
          fit="cover"
        />

        <div class="shop-copy">
          <h1>{{ shop.name }}</h1>
          <p>{{ shop.description }}</p>
        </div>
      </div>

      <div class="shop-meta">
        <div class="meta-item">
          <span>起送</span>
          <strong>&yen;{{ shop.startPrice }}</strong>
        </div>
        <div class="meta-item">
          <span>配送</span>
          <strong>&yen;{{ shop.deliveryFee }}</strong>
        </div>
        <div class="meta-item">
          <span>营业时间</span>
          <strong>{{ shop.businessHours }}</strong>
        </div>
      </div>
      <div class="shop-actions">
        <el-button
          type="primary"
          plain
          round
          @click="contactShop"
        >
          联系商家
        </el-button>
        <el-button
          type="primary"
          round
          plain
          @click="toggleSection"
        >
          {{ activeSection === 'menu' ? '查看评价' : '返回菜单' }}
        </el-button>
      </div>
    </section>

    <section v-if="activeSection === 'comments'" class="comment-section">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="comment-item"
      >
        <el-avatar
          class="comment-avatar"
          :size="34"
          :src="comment.avatarUrl"
        />

        <div class="comment-main">
          <div class="comment-top">
            <strong>{{ comment.nickname }}</strong>
            <span>{{ comment.createdAt }}</span>
          </div>
          <el-rate
            v-model="comment.rating"
            disabled
            size="small"
            text-color="#ff9900"
          />
          <p>{{ comment.content }}</p>

          <div v-if="comment.reply" class="comment-reply">
            <strong>商家回复</strong>
            <span>{{ comment.reply }}</span>
          </div>
        </div>
      </div>
    </section>

    <section v-if="activeSection === 'menu'" class="product-list">
      <div
        v-for="product in products"
        :key="product.id"
        class="product-item"
      >
        <el-image
          class="product-img"
          :src="product.image"
          fit="cover"
          lazy
        />

        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p>{{ product.description }}</p>
          <strong>&yen;{{ product.price }}</strong>
        </div>

        <div class="product-actions">
          <el-button
            v-if="product.quantity > 0"
            circle
            size="small"
            class="count-btn minus-btn"
            :icon="Minus"
            @click.stop="decrement(product)"
          />
          <span v-if="product.quantity > 0" class="quantity">{{ product.quantity }}</span>
          <el-button
            circle
            size="small"
            type="primary"
            class="count-btn"
            :icon="Plus"
            @click.stop="increment(product)"
          />
        </div>
      </div>
    </section>

    <footer v-if="activeSection === 'menu'" class="cart-bar">
      <div class="cart-left">
        <el-badge :value="totalCount" :hidden="totalCount === 0" class="cart-badge">
          <div class="cart-icon">
            <el-icon><ShoppingCart /></el-icon>
          </div>
        </el-badge>
        <div class="cart-price">
          <strong>&yen;{{ totalAmount.toFixed(2) }}</strong>
          <span>另需配送费{{ shop.deliveryFee }}元</span>
        </div>
      </div>

      <el-button
        class="checkout-btn"
        type="success"
        :disabled="totalCount === 0"
      >
        去结算
      </el-button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Minus, Plus, ShoppingCart } from '@element-plus/icons-vue'

interface ShopInfo {
  name: string
  cover: string
  startPrice: number
  deliveryFee: number
  businessHours: string
  description: string
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  image: string
  quantity: number
}

interface CommentItem {
  id: number
  nickname: string
  avatarUrl: string
  createdAt: string
  rating: number
  content: string
  reply: string
}

type ShopSection = 'menu' | 'comments'

const shop: ShopInfo = {
  name: '万家饺子（软件园E18店）',
  cover: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/sj01.png',
  startPrice: 15,
  deliveryFee: 3,
  businessHours: '09:00-22:00',
  description: '手工现包水饺，主打鲜肉和三鲜口味，支持外卖配送。'
}

const router = useRouter()
const activeSection = ref<ShopSection>('menu')

const products = reactive<Product[]>([
  {
    id: 1,
    name: '纯肉鲜肉（水饺）',
    description: '新鲜猪肉，皮薄馅足',
    price: 15,
    image: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/sj01.png',
    quantity: 3
  },
  {
    id: 2,
    name: '玉米鲜肉（水饺）',
    description: '甜玉米搭配鲜肉，清甜不腻',
    price: 16,
    image: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/sj02.png',
    quantity: 2
  },
  {
    id: 3,
    name: '虾仁三鲜（蒸饺）',
    description: '虾仁、鸡蛋、韭菜的经典搭配',
    price: 22,
    image: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/dcfl01.png',
    quantity: 0
  },
  {
    id: 4,
    name: '素三鲜（蒸饺）',
    description: '清爽素馅，适合轻食晚餐',
    price: 15,
    image: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/dcfl07.png',
    quantity: 0
  },
  {
    id: 5,
    name: '番茄鸡蛋汤',
    description: '热乎乎一碗，搭配饺子正好',
    price: 9,
    image: 'https://zxydata.oss-cn-chengdu.aliyuncs.com/ele/dcfl06.png',
    quantity: 0
  }
])

const comments = reactive<CommentItem[]>([
  {
    id: 1,
    nickname: '小张同学',
    avatarUrl: '/default-avatar.svg',
    createdAt: '今天 12:38',
    rating: 5,
    content: '饺子皮薄馅多，送过来还是热的，纯肉鲜肉很好吃。',
    reply: '谢谢喜欢，我们会继续保持出餐速度。'
  },
  {
    id: 2,
    nickname: '爱吃蒸饺',
    avatarUrl: '/default-avatar.svg',
    createdAt: '昨天 18:20',
    rating: 4,
    content: '虾仁三鲜味道不错，配送也挺快，下次想试试玉米鲜肉。',
    reply: '欢迎下次再来，玉米鲜肉也是店里的热门款。'
  },
  {
    id: 3,
    nickname: '软件园打工人',
    avatarUrl: '/default-avatar.svg',
    createdAt: '6月13日',
    rating: 5,
    content: '中午点餐很方便，备注不要香菜也有认真看。',
    reply: ''
  }
])

const totalCount = computed(() => {
  return products.reduce((sum, product) => sum + product.quantity, 0)
})

const totalAmount = computed(() => {
  return products.reduce((sum, product) => {
    return sum + product.price * product.quantity
  }, 0)
})

const increment = (product: Product) => {
  product.quantity += 1
}

const decrement = (product: Product) => {
  if (product.quantity > 0) {
    product.quantity -= 1
  }
}

const contactShop = () => {
  router.push({
    path: '/chat',
    query: {
      nickname: shop.name
    }
  })
}

const toggleSection = () => {
  activeSection.value = activeSection.value === 'menu' ? 'comments' : 'menu'
}
</script>

<style scoped>
.shop-page {
  min-height: 100%;
  padding-bottom: 72px;
  background-color: #ffffff;
}

.shop-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(90deg, #0af, #0085ff);
}

.shop-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
}

.shop-hero {
  padding: 18px 20px 14px;
  background-color: #ffffff;
}

.shop-summary {
  display: flex;
  align-items: center;
  gap: 14px;
}

.shop-cover {
  width: 118px;
  height: 88px;
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
}

.shop-copy {
  min-width: 0;
  flex: 1;
  text-align: left;
}

.shop-copy h1 {
  margin: 0 0 10px;
  color: #222222;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.shop-copy p {
  margin: 0;
  color: #777777;
  font-size: 13px;
  line-height: 1.45;
}

.shop-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 12px 0 0;
  padding: 10px;
  border-radius: 8px;
  background-color: #f7faff;
}

.meta-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 4px;
  border-right: 1px solid #e5eef9;
}

.meta-item:last-child {
  border-right: none;
}

.meta-item span {
  color: #888888;
  font-size: 12px;
  line-height: 1;
}

.meta-item strong {
  color: #222222;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shop-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.shop-actions :deep(.el-button) {
  margin-left: 0;
}

.comment-section {
  margin: 0 12px 10px;
  padding: 13px 12px 2px;
  border-radius: 8px;
  background-color: #f8fbff;
}

.comment-item {
  display: flex;
  gap: 9px;
  padding: 11px 0;
  border-top: 1px solid #edf2f7;
}

.comment-avatar {
  flex-shrink: 0;
  background-color: #f2f2f2;
}

.comment-main {
  min-width: 0;
  flex: 1;
}

.comment-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-top strong {
  min-width: 0;
  color: #333333;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comment-top span {
  flex-shrink: 0;
  color: #999999;
  font-size: 12px;
}

.comment-main p {
  margin: 7px 0 0;
  color: #555555;
  font-size: 13px;
  line-height: 1.45;
}

.comment-reply {
  margin-top: 8px;
  padding: 8px 9px;
  border-radius: 6px;
  background-color: #ffffff;
  color: #666666;
  font-size: 12px;
  line-height: 1.45;
}

.comment-reply strong {
  margin-right: 6px;
  color: #0085ff;
  font-weight: 600;
}

.product-list {
  padding: 2px 12px 14px;
}

.product-item {
  min-height: 96px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f1f1;
}

.product-img {
  width: 74px;
  height: 74px;
  border-radius: 6px;
  flex-shrink: 0;
  overflow: hidden;
  background-color: #f5f7fa;
}

.product-info {
  min-width: 0;
  flex: 1;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.product-info h3 {
  margin: 0;
  color: #333333;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-info p {
  margin: 7px 0;
  color: #888888;
  font-size: 13px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-info strong {
  color: #ff5339;
  font-size: 15px;
  font-weight: 700;
}

.product-actions {
  width: 88px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.count-btn {
  width: 24px;
  height: 24px;
}

.minus-btn {
  color: #999999;
  border-color: #c8c8c8;
}

.quantity {
  min-width: 14px;
  color: #333333;
  font-size: 14px;
  text-align: center;
}

.cart-bar {
  position: fixed;
  left: 50%;
  bottom: 55px;
  width: 100%;
  max-width: 414px;
  height: 58px;
  display: flex;
  align-items: stretch;
  transform: translateX(-50%);
  z-index: 20;
  box-sizing: border-box;
  background-color: #3c3c3c;
}

.cart-left {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 16px;
}

.cart-icon {
  width: 46px;
  height: 46px;
  border-radius: 23px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 25px;
  background-color: #1296db;
  box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.1);
}

.cart-badge :deep(.el-badge__content) {
  top: 5px;
  right: 8px;
  border: none;
}

.cart-price {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cart-price strong {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.cart-price span {
  color: #cfcfcf;
  font-size: 12px;
}

.checkout-btn {
  width: 118px;
  height: 100%;
  border: none;
  border-radius: 0;
  font-size: 17px;
  font-weight: 700;
}
</style>

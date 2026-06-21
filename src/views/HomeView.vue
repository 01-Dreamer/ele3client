<template>
  <div class="home-container">
    <el-affix :offset="0">
      <header class="header">
        <div class="header-content">
          <el-icon class="location-icon" @click="isLoading ? null : getLocation()">
            <Loading v-if="isLoading" class="is-loading" />
            <Location v-else />
          </el-icon>
          <div class="location-text">
            <span class="text-truncate">{{ locationText }}</span>
            <el-icon>
              <CaretBottom />
            </el-icon>
          </div>
        </div>

        <div class="search-box">
          <el-input
            v-model="searchInput"
            class="search-input"
            @keyup.enter="searchKey"
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
            :prefix-icon="Search"
            placeholder="搜索饿了么商家、商品名称"
            clearable
          />

          <transition name="el-fade-in-linear">
            <div class="hot-search-panel" v-if="isSearchFocused && !searchInput">
              <div class="hot-title">热门搜索</div>
              <ul class="hot-list">
                <li v-for="(item, index) in hotSearchs" :key="index" @click="clickHotSearch(item)">
                  <span :class="['rank-num', { 'top-rank': index < 3 }]">{{ index + 1 }}</span>
                  <span class="hot-text">{{ item }}</span>
                  <el-tag v-if="index < 2" size="small" type="danger" effect="plain" round
                    style="margin-left: 5px; transform: scale(0.8);">热</el-tag>
                </li>
              </ul>
            </div>
          </transition>
        </div>
      </header>
    </el-affix>

    <ul class="foodtype">
      <li v-for="(item, index) in foodTypes" :key="index">
        <el-image :src="item.img" fit="cover" loading="lazy" class="foodtype-img" />
        <p>{{ item.name }}</p>
      </li>
    </ul>

    <div class="banner">
      <div class="banner-content">
        <h3>品质套餐</h3>
        <p>搭配齐全吃得好</p>
        <el-link type="warning" :underline="false" class="banner-link">立即抢购 &gt;</el-link>
      </div>
    </div>

    <div class="supermember">
      <div class="left">
        <el-image src="/ele-assets/super_member.png" class="member-img" />
        <h3>超级会员</h3>
        <p>&#8226; 每月享超值权益</p>
      </div>
      <div class="right">
        立即开通 &gt;
      </div>
    </div>

    <div class="recommend">
      <div class="recommend-line"></div>
      <p>推荐商家</p>
      <div class="recommend-line"></div>
    </div>

    <div class="recommendtype">
      <el-dropdown trigger="click" @command="handleSort">
        <span class="el-dropdown-link filter-item">
          综合排序<el-icon class="el-icon--right">
            <CaretBottom />
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="rating">好评优先</el-dropdown-item>
            <el-dropdown-item command="distance">距离最近</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <span class="filter-item" @click="handleSort('distance')">距离最近</span>
      <span class="filter-item" @click="handleSort('sales')">销量最高</span>
      <span class="filter-item" @click="handleSort('filter')">
        筛选<el-icon><Filter /></el-icon>
      </span>
    </div>

    <!-- 加载状态 -->
    <div v-if="shopLoading" class="loading-state">
      <el-icon class="is-loading" size="24"><Loading /></el-icon>
      <span>商家加载中...</span>
    </div>

    <ul v-else class="merchants">
      <li v-for="shop in shops" :key="shop.shopId" @click="clickMerchant(shop.shopId)">
        <el-image :src="shop.avatar" class="merchants-img" fit="cover" lazy />

        <div class="merchants-info">
          <div class="merchants-info-h">
            <h3>{{ shop.name }}</h3>
            <el-icon color="#999">
              <MoreFilled />
            </el-icon>
          </div>

          <div class="merchants-info-star">
            <div class="star-wrapper">
              <el-rate
                v-model="shop.reviewScore"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
                size="small"
              />
              <span class="sales">月售{{ formatSales(shop.salesCount) }}</span>
            </div>
            <el-tag effect="dark" type="primary" size="small" class="delivery-tag">蜂鸟专送</el-tag>
          </div>

          <div class="merchants-info-delivery">
            <span>&#165;{{ shop.deliveryFee }} 配送</span>
            <span>
              {{ shop.distanceText }}
              | {{ shop.durationText }}
            </span>
          </div>

          <div class="merchants-info-explain" v-if="shop.description">
            <el-tag type="info" size="small" effect="plain">{{ shop.description }}</el-tag>
          </div>

          <div class="merchants-info-promotion" v-for="(promo, pIndex) in shop.promotions" :key="pIndex">
            <div class="promo-left">
              <el-tag :color="promo.color" effect="dark" size="small" class="promo-icon">{{ promo.icon }}</el-tag>
              <span class="promo-text">{{ promo.text }}</span>
            </div>
            <div class="promo-right" v-if="pIndex === 0 && shop.promotions.length > 1">
              <span>{{ shop.promotions.length }}个活动</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Loading, Location, CaretBottom, Search, Filter, MoreFilled,
  HomeFilled, Compass, Document, User
} from '@element-plus/icons-vue'
import { listHotSearchApi, searchShopApi, type ShopVO } from '@/api/shop'

const router = useRouter()

// 定位
const isLoading = ref(false)
const locationText = ref('成都市天府软件园')

const getLocation = () => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
    locationText.value = '成都市天府软件园D区'
  }, 1000)
}

// 搜索
const searchInput = ref('')
const isSearchFocused = ref(false)
const hotSearchs = ref<string[]>([])

const handleSearchFocus = () => { isSearchFocused.value = true }
const handleSearchBlur = () => { setTimeout(() => isSearchFocused.value = false, 200) }
const searchKey = () => {
  searchQuery.value = searchInput.value
  fetchShops()
}
const clickHotSearch = (item: string) => {
  searchInput.value = item
  isSearchFocused.value = false
  searchQuery.value = item
  fetchShops()
}

// 分类
const foodTypes = reactive([
  { name: '美食', img: '/ele-assets/dcfl01.png' },
  { name: '早餐', img: '/ele-assets/dcfl02.png' },
  { name: '跑腿代购', img: '/ele-assets/dcfl03.png' },
  { name: '汉堡披萨', img: '/ele-assets/dcfl04.png' },
  { name: '甜品饮品', img: '/ele-assets/dcfl05.png' },
  { name: '速食简餐', img: '/ele-assets/dcfl06.png' },
  { name: '地方小吃', img: '/ele-assets/dcfl07.png' },
  { name: '米粉面馆', img: '/ele-assets/dcfl08.png' },
  { name: '包子粥铺', img: '/ele-assets/dcfl09.png' },
  { name: '炸鸡炸串', img: '/ele-assets/dcfl10.png' },
])

// 排序和筛选
const sortType = ref<string>('distance')
const searchQuery = ref('')

const handleSort = (type: string) => {
  sortType.value = type
  fetchShops()
}

// 商家列表
interface ShopDisplay extends ShopVO {
  distanceText: string
  durationText: string
  promotions: { color: string; icon: string; text: string }[]
}

const shops = ref<ShopDisplay[]>([])
const shopLoading = ref(false)

const formatSales = (count: number) => {
  if (count >= 1000) return `${(count / 1000).toFixed(0)}k`
  return String(count)
}

const buildShopDisplay = (shop: ShopVO): ShopDisplay => {
  // 估算距离和时间（后续可从定位服务获取精确值）
  const dist = 0
  const distText = dist >= 1000 ? `${(dist / 1000).toFixed(1)}km` : `${dist}m`
  const duration = 20 + Math.floor(Math.random() * 20)

  return {
    ...shop,
    distanceText: distText,
    durationText: `${duration}分钟`,
    promotions: shop.description
      ? [{ color: '#f07373', icon: '减', text: shop.description }]
      : [],
  }
}

const fetchShops = async () => {
  shopLoading.value = true
  try {
    const result = await searchShopApi({
      query: searchQuery.value || undefined,
      sort: sortType.value as 'distance' | 'rating' | 'sales',
      size: 20,
    })
    shops.value = (result.records || []).map(buildShopDisplay)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '商家加载失败')
  } finally {
    shopLoading.value = false
  }
}

const fetchHotSearch = async () => {
  try {
    const keywords = await listHotSearchApi()
    if (keywords && keywords.length > 0) {
      hotSearchs.value = keywords
    }
  } catch {
    // 降级使用默认关键词
    hotSearchs.value = ['螺蛳粉', '烧烤', '蜜雪冰城', '汉堡', '麻辣烫', '奶茶']
  }
}

const clickMerchant = (id: string) => {
  router.push(`/shop/${id}`)
}

onMounted(() => {
  fetchHotSearch()
  fetchShops()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding-bottom: 20px;
}

.header {
  background-image: linear-gradient(90deg, #0af, #0085ff);
  padding: 15px 15px 10px;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.location-icon {
  font-size: 20px;
  margin-right: 5px;
  cursor: pointer;
}

.location-text {
  display: flex;
  align-items: center;
  gap: 5px;
  max-width: 60%;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-box {
  position: relative;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  padding: 0 15px;
  border: none;
  box-shadow: none;
}

.hot-search-panel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 15px;
  z-index: 10;
  margin-top: 10px;
  color: #333;
  box-sizing: border-box;
}

.hot-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #666;
}

.hot-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.hot-list li {
  padding: 10px 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.hot-list li:last-child {
  border-bottom: none;
}

.rank-num {
  width: 20px;
  font-weight: bold;
  color: #999;
}

.top-rank {
  color: #ff5339;
}

.hot-text {
  font-size: 14px;
}

.foodtype {
  display: flex;
  flex-wrap: wrap;
  background: white;
  padding: 15px 0 0;
  margin: 0;
  list-style: none;
}

.foodtype li {
  width: 20%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
  font-size: 12px;
  color: #666;
}

.foodtype-img {
  width: 45px;
  height: 45px;
  margin-bottom: 8px;
}

.banner {
  width: 94%;
  margin: 10px auto;
  height: 110px;
  background-image: url("/ele-assets/index_banner.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-color: #f6f6f6;
  border-radius: 8px;
  padding: 15px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 12px;
}

.banner-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.banner-content h3 {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.banner-content p {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #777;
}

.banner-link {
  font-size: 13px;
  font-weight: bold;
  color: #d18a42 !important;
}

.supermember {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 94%;
  margin: 0 auto 10px;
  background-color: #feedc1;
  border-radius: 8px;
  padding: 10px 15px;
  box-sizing: border-box;
}

.supermember .left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-img {
  width: 20px;
  height: 20px;
}

.supermember h3 {
  margin: 0;
  font-size: 14px;
  color: #644f1b;
}

.supermember p {
  margin: 0;
  font-size: 12px;
  color: #644f1b;
}

.supermember .right {
  font-size: 12px;
  color: #644f1b;
}

.recommend {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0 10px;
  gap: 15px;
}

.recommend-line {
  width: 30px;
  height: 1px;
  background-color: #999;
}

.recommend p {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.recommendtype {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  background: white;
  position: sticky;
  top: 50px;
  z-index: 9;
  border-bottom: 1px solid #eee;
}

.filter-item {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
  gap: 10px;
  font-size: 14px;
}

.merchants {
  list-style: none;
  padding: 0;
  margin: 0;
  background: white;
}

.merchants li {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.merchants-img {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  margin-right: 10px;
  flex-shrink: 0;
}

.merchants-info {
  flex: 1;
  min-width: 0;
}

.merchants-info-h {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.merchants-info-h h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
}

.merchants-info-star {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.delivery-tag {
  transform: scale(0.9);
  transform-origin: right center;
}

.merchants-info-delivery {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
  margin-bottom: 8px;
}

.merchants-info-explain {
  margin-bottom: 8px;
}

.merchants-info-promotion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 11px;
}

.promo-left {
  display: flex;
  align-items: center;
  gap: 5px;
}

.promo-icon {
  border: none;
  color: white;
  padding: 0 4px;
  height: 16px;
  line-height: 14px;
}

.promo-text {
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.promo-right {
  display: flex;
  align-items: center;
  color: #999;
}
</style>

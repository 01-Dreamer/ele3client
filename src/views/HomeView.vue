<template>
  <div class="home-container">
    <el-affix :offset="0">
      <header class="header">
        <div class="header-content">
          <el-icon class="location-icon" @click="getLocation">
            <Loading v-if="isLoading" class="is-loading" />
            <Location v-else />
          </el-icon>
          <div class="location-text">
            <el-tooltip :content="locationText" placement="bottom" :show-after="400">
              <span class="text-truncate">{{ locationText }}</span>
            </el-tooltip>
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

          <!-- 热搜面板（搜索框为空） -->
          <transition name="el-fade-in-linear">
            <div class="search-drop-panel" v-if="isSearchFocused && !searchInput">
              <div class="panel-title">热门搜索</div>
              <ul class="panel-list">
                <li v-for="(item, index) in hotSearchs" :key="index" @mousedown.prevent="clickHotSearch(item)">
                  <span :class="['rank-num', { 'top-rank': index < 3 }]">{{ index + 1 }}</span>
                  <span class="hot-text">{{ item }}</span>
                  <el-tag v-if="index < 2" size="small" type="danger" effect="plain" round
                    style="margin-left: 5px; transform: scale(0.8);">热</el-tag>
                </li>
              </ul>
            </div>
          </transition>

          <!-- 搜索建议面板（用户输入时） -->
          <transition name="el-fade-in-linear">
            <div class="search-drop-panel" v-if="isSearchFocused && searchInput">
              <div class="panel-title">搜索建议</div>
              <ul class="panel-list">
                <li v-for="(item, index) in suggestions" :key="index" @mousedown.prevent="clickSuggest(item)">
                  <el-icon><Search /></el-icon>
                  <span class="hot-text">
                    <span class="suggest-highlight">{{ item.slice(0, searchInput.length) }}</span>{{ item.slice(searchInput.length) }}
                  </span>
                </li>
              </ul>
              <div v-if="suggestLoading" class="panel-loading">加载中...</div>
              <div v-else-if="searchInput && !suggestLoading && suggestions.length === 0" class="panel-empty">
                暂无搜索建议
              </div>
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
      <span
        class="sort-item"
        :class="{ active: sortType === 'rating' }"
        @click="handleSort('rating')"
      >综合排序</span>
      <span
        class="sort-item"
        :class="{ active: sortType === 'sales' }"
        @click="handleSort('sales')"
      >销量最高</span>
      <span class="sort-item">距离最近</span>
      <span class="sort-item">
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
                :model-value="reviewAvg(shop.reviewScore, shop.reviewCount)"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
                size="small"
              />
              <span class="sales">销售{{ formatSales(shop.salesCount) }}</span>
            </div>
            <el-tag effect="dark" type="primary" size="small" class="delivery-tag">蜂鸟专送</el-tag>
          </div>

          <div class="merchants-info-delivery">
            <span>&#165;{{ shop.deliveryFee }} 配送</span>
            <span>
              <template v-if="shop.distanceText">{{ shop.distanceText }}</template>
              <template v-if="shop.distanceText && shop.durationText"> | </template>
              <template v-if="shop.durationText">{{ shop.durationText }}</template>
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

      <!-- 触底加载哨兵 -->
      <li ref="sentinelRef" class="sentinel">
        <div v-if="shopLoadingMore" class="loading-more">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载更多...</span>
        </div>
        <div v-else-if="!hasMore && shops.length > 0" class="no-more">— 没有更多了 —</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Loading, Location, CaretBottom, Search, Filter, MoreFilled
} from '@element-plus/icons-vue'
import { showErrorMessage } from '@/api/http'
import { listHotSearchApi, searchShopApi, suggestSearchApi, type ShopVO } from '@/api/shop'
import { useLocationStore } from '@/stores/location'

const router = useRouter()
const locationStore = useLocationStore()

// 定位
const isLoading = computed(() => locationStore.addressRefreshing)
const locationText = computed(() => locationStore.displayAddress || '定位中...')

const getLocation = async () => {
  await locationStore.refreshLocationNow()
}

// 搜索
const searchInput = ref('')
const isSearchFocused = ref(false)
const hotSearchs = ref<string[]>([])
const suggestions = ref<string[]>([])
const suggestLoading = ref(false)
let suggestTimer: number | undefined

const handleSearchFocus = () => { isSearchFocused.value = true }
const handleSearchBlur = () => { setTimeout(() => isSearchFocused.value = false, 200) }
const searchKey = () => {
  searchQuery.value = searchInput.value
  isSearchFocused.value = false
  resetAndFetch()
}
const clickHotSearch = (item: string) => {
  searchInput.value = item
  isSearchFocused.value = false
  searchQuery.value = item
  resetAndFetch()
}
const clickSuggest = (item: string) => {
  searchInput.value = item
  isSearchFocused.value = false
  searchQuery.value = item
  resetAndFetch()
}

// 搜索提示：输入时 300ms 防抖
watch(searchInput, (val) => {
  if (suggestTimer) clearTimeout(suggestTimer)
  if (!val || !val.trim()) {
    suggestions.value = []
    return
  }
  suggestTimer = window.setTimeout(async () => {
    suggestLoading.value = true
    try {
      const result = await suggestSearchApi(val.trim())
      suggestions.value = result || []
    } catch {
      suggestions.value = []
    } finally {
      suggestLoading.value = false
    }
  }, 300)
})

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
const sortType = ref<string>('rating')
const searchQuery = ref('')

const handleSort = (type: string) => {
  sortType.value = type
  resetAndFetch()
}

// 商家列表（游标分页）
const PAGE_SIZE = 5

interface ShopDisplay extends ShopVO {
  distanceText: string
  durationText: string
  promotions: { color: string; icon: string; text: string }[]
}

const shops = ref<ShopDisplay[]>([])
const shopLoading = ref(false)
const shopLoadingMore = ref(false)
const nextCursor = ref<string | undefined>(undefined)
const hasMore = ref(true)
const sentinelRef = ref<HTMLElement | null>(null)
let sentinelObserver: IntersectionObserver | undefined

const reviewAvg = (score: number | string, count: number | string) => {
  const s = Number(score)
  const c = Number(count)
  if (!c) return 0
  return Math.round((s / c) * 10) / 10 // 保留1位小数，不做四舍五入
}

const formatSales = (count: number) => {
  if (count >= 1000) return `${(count / 1000).toFixed(0)}k`
  return String(count)
}

const buildShopDisplay = (shop: ShopVO): ShopDisplay => {
  const dist = haversineDistance(
    locationStore.currentCoordinate?.longitude ?? 0,
    locationStore.currentCoordinate?.latitude ?? 0,
    Number(shop.longitude),
    Number(shop.latitude)
  )
  const distText = dist >= 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`
  const duration = 15 + Math.floor(dist / 500) * 5 + Math.floor(Math.random() * 10)

  return {
    ...shop,
    distanceText: dist > 0 ? distText : '',
    durationText: dist > 0 ? `${duration}分钟` : '',
    promotions: shop.description
      ? [{ color: '#f07373', icon: '减', text: shop.description }]
      : [],
  }
}

/** Haversine 大圆距离（单位：米） */
const haversineDistance = (lng1: number, lat1: number, lng2: number, lat2: number) => {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const fetchShops = async () => {
  shopLoading.value = true
  try {
    const coord = locationStore.currentCoordinate
    const result = await searchShopApi({
      longitude: coord?.longitude,
      latitude: coord?.latitude,
      query: searchQuery.value || undefined,
      sort: sortType.value as 'distance' | 'rating' | 'sales',
      size: PAGE_SIZE,
    })
    shops.value = (result.records || []).map(buildShopDisplay)
    nextCursor.value = result.nextCursor || undefined
    hasMore.value = result.hasMore ?? false
  } catch (error) {
    showErrorMessage(error)
  } finally {
    shopLoading.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value || shopLoadingMore.value || shopLoading.value) return
  shopLoadingMore.value = true
  try {
    const coord = locationStore.currentCoordinate
    const result = await searchShopApi({
      longitude: coord?.longitude,
      latitude: coord?.latitude,
      query: searchQuery.value || undefined,
      sort: sortType.value as 'distance' | 'rating' | 'sales',
      cursor: nextCursor.value,
      size: PAGE_SIZE,
    })
    const newShops = (result.records || []).map(buildShopDisplay)
    shops.value.push(...newShops)
    nextCursor.value = result.nextCursor || undefined
    hasMore.value = result.hasMore ?? false
  } catch (error) {
    showErrorMessage(error)
  } finally {
    shopLoadingMore.value = false
  }
}

const resetAndFetch = () => {
  nextCursor.value = undefined
  hasMore.value = true
  shops.value = []
  fetchShops()
}

const setupSentinel = () => {
  if (!sentinelRef.value) return
  sentinelObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      loadMore()
    }
  }, { rootMargin: '100px' })
  sentinelObserver.observe(sentinelRef.value)
}

const clickMerchant = (id: string) => {
  router.push(`/shop/${id}`)
}

const fetchHotSearch = async () => {
  try {
    const keywords = await listHotSearchApi()
    if (keywords && keywords.length > 0) {
      hotSearchs.value = keywords
    }
  } catch {
    hotSearchs.value = ['螺蛳粉', '烧烤', '蜜雪冰城', '汉堡', '麻辣烫', '奶茶']
  }
}

onMounted(() => {
  fetchHotSearch()
  resetAndFetch()
})

// 哨兵元素挂载后启动监听
watch(sentinelRef, (el) => {
  sentinelObserver?.disconnect()
  if (el) setupSentinel()
})

onUnmounted(() => {
  if (suggestTimer) clearTimeout(suggestTimer)
  sentinelObserver?.disconnect()
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

.search-drop-panel {
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

.panel-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #666;
}

.panel-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.panel-list li {
  padding: 10px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.panel-list li:last-child {
  border-bottom: none;
}

.panel-loading,
.panel-empty {
  font-size: 13px;
  color: #999;
  text-align: center;
  padding: 10px 0 0;
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

.suggest-highlight {
  color: #ff5339;
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

.sort-item {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  user-select: none;
}

.sort-item.active {
  color: #0085ff;
  font-weight: 600;
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

/* 分页哨兵 */
.sentinel {
  display: flex !important;
  justify-content: center;
  padding: 18px 15px !important;
  cursor: default !important;
}

.loading-more {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-size: 13px;
}

.no-more {
  color: #ccc;
  font-size: 13px;
}
</style>

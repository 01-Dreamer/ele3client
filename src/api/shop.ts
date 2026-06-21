import { apiRequest } from './http'

// --- 类型 ---

export interface ShopVO {
  shopId: string
  userId: string
  name: string
  avatar: string
  description: string
  address: string
  longitude: number
  latitude: number
  deliveryFee: number
  openTime: string
  closeTime: string
  reviewScore: number
  reviewCount: number
  salesCount: number
  status: number
  createTime: string
  updateTime: string
}

export interface ShopItemVO {
  itemId: string
  shopId: string
  name: string
  image: string
  description: string
  price: number
  status: number
  sort: number
  createTime: string
  updateTime: string
}

export interface ShopReviewVO {
  reviewId: string
  orderId: string
  shopId: string
  userId: string
  score: number
  content: string
  images: string[]
  createTime: string
}

export interface ShopReviewReplyVO {
  replyId: string
  reviewId: string
  userId: string
  atUserId: string
  content: string
  createTime: string
}

export interface CursorPageVO<T> {
  records: T[]
  nextCursor: string
  hasMore: boolean
}

export interface PageVO<T> {
  items: T[]
  total: number
  page: number
  size: number
}

export interface ShopSearchParams {
  longitude?: number
  latitude?: number
  query?: string
  sort?: 'distance' | 'rating' | 'sales'
  cursor?: string
  size?: number
}

export interface ShopCreateRequest {
  name: string
  avatar: string
  description: string
  address: string
  longitude: number
  latitude: number
  deliveryFee: number
  openTime: string
  closeTime: string
}

export interface ShopUpdateRequest {
  name?: string
  avatar?: string
  description?: string
  address?: string
  longitude?: number
  latitude?: number
  deliveryFee?: number
  openTime?: string
  closeTime?: string
}

export interface ShopItemCreateRequest {
  name: string
  image: string
  description: string
  price: number
}

export interface ShopItemUpdateRequest {
  name?: string
  image?: string
  description?: string
  price?: number
  status?: number
}

export interface ShopReviewReplyRequest {
  reviewId: string
  atUserId: string
  content: string
}

// --- API ---

/** 搜索店铺 */
export const searchShopApi = (params: ShopSearchParams = {}) => {
  const query = new URLSearchParams()
  if (params.longitude !== undefined) query.set('longitude', String(params.longitude))
  if (params.latitude !== undefined) query.set('latitude', String(params.latitude))
  if (params.query) query.set('query', params.query)
  if (params.sort) query.set('sort', params.sort)
  if (params.cursor) query.set('cursor', params.cursor)
  if (params.size) query.set('size', String(params.size))
  const qs = query.toString()
  return apiRequest<CursorPageVO<ShopVO>>(`/api/shop/search-shop${qs ? `?${qs}` : ''}`)
}

/** 获取店铺信息 */
export const getShopApi = (shopId: string) => {
  return apiRequest<ShopVO>(`/api/shop/get-shop/${shopId}`)
}

/** 获取商品列表 */
export const listShopItemApi = (shopId: string) => {
  return apiRequest<ShopItemVO[]>(`/api/shop/list-item/${shopId}`)
}

/** 查询店铺评价 */
export const listShopReviewApi = (shopId: string, cursor?: string, size?: number) => {
  const query = new URLSearchParams()
  if (cursor) query.set('cursor', cursor)
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<CursorPageVO<ShopReviewVO>>(`/api/shop/list-review/${shopId}${qs ? `?${qs}` : ''}`)
}

/** 查询评价回复 */
export const listReviewReplyApi = (reviewId: string, cursor?: string, size?: number) => {
  const query = new URLSearchParams()
  if (cursor) query.set('cursor', cursor)
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<CursorPageVO<ShopReviewReplyVO>>(`/api/shop/list-review-reply/${reviewId}${qs ? `?${qs}` : ''}`)
}

/** 查询热搜关键词 */
export const listHotSearchApi = () => {
  return apiRequest<string[]>('/api/shop/list-hot-search')
}

/** 搜索提示 */
export const suggestSearchApi = (query: string) => {
  return apiRequest<string[]>(`/api/shop/suggest-search?query=${encodeURIComponent(query)}`)
}

/** 获取自己的店铺列表（偏移分页） */
export const listOwnShopsApi = (page: number, size: number) => {
  const query = new URLSearchParams()
  if (page) query.set('page', String(page))
  if (size) query.set('size', String(size))
  const qs = query.toString()
  return apiRequest<PageVO<ShopVO>>(`/api/shop/list-own-shop${qs ? `?${qs}` : ''}`)
}

/** 回复店铺评价 */
export const replyReviewApi = (payload: ShopReviewReplyRequest, token?: string) => {
  return apiRequest<null>('/api/shop/reply-review', {
    method: 'POST',
    body: payload,
    token,
  })
}

/** 创建店铺 */
export const createShopApi = (payload: ShopCreateRequest, token: string) => {
  return apiRequest<ShopVO>('/api/shop/create-shop', {
    method: 'POST',
    body: payload,
    token,
  })
}

/** 修改店铺 */
export const modifyShopApi = (shopId: string, payload: ShopUpdateRequest, token: string) => {
  return apiRequest<ShopVO>(`/api/shop/modify-shop/${shopId}`, {
    method: 'PUT',
    body: payload,
    token,
  })
}

/** 添加商品 */
export const addShopItemApi = (shopId: string, payload: ShopItemCreateRequest, token: string) => {
  return apiRequest<ShopItemVO>(`/api/shop/add-item/${shopId}`, {
    method: 'POST',
    body: payload,
    token,
  })
}

/** 删除商品 */
export const deleteShopItemApi = (itemId: string, token: string) => {
  return apiRequest<null>(`/api/shop/delete-item/${itemId}`, {
    method: 'DELETE',
    token,
  })
}

/** 修改商品 */
export const modifyShopItemApi = (itemId: string, payload: ShopItemUpdateRequest, token: string) => {
  return apiRequest<ShopItemVO>(`/api/shop/modify-item/${itemId}`, {
    method: 'PUT',
    body: payload,
    token,
  })
}

/** 删除店铺 */
export const deleteShopApi = (shopId: string) => {
  return apiRequest<null>(`/api/shop/delete-shop/${shopId}`, {
    method: 'DELETE',
  })
}

/** 调换两个商品顺序 */
export interface ShopItemSwapRequest {
  itemIdA: string
  itemIdB: string
}

export const swapShopItemsApi = (payload: ShopItemSwapRequest) => {
  return apiRequest<null>('/api/shop/swap-items', {
    method: 'PUT',
    body: payload,
  })
}

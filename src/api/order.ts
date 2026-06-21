import { apiRequest } from './http'

// --- 类型 ---

export interface OrderItemVO {
  itemId: string
  name: string
  price: number
  quantity: number
  amount: number
}

export interface OrderVO {
  orderId: string
  userId: string
  shopId: string
  shopOwnerId: string
  riderId: string
  shopName: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverLongitude: number
  receiverLatitude: number
  remark: string
  deliveryFee: number
  amount: number
  status: number
  expireTime: string
  createTime: string
  updateTime: string
  items: OrderItemVO[]
}

export interface PageVO<T> {
  records: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface OrderCreateItem {
  shopItemId: string
  quantity: number
}

export interface OrderCreateRequest {
  shopId: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverLongitude: number
  receiverLatitude: number
  token: string
  remark?: string
  items: OrderCreateItem[]
}

export interface OrderReviewRequest {
  score: number
  content: string
  images?: string[]
}

export interface PaymentCreateVO {
  paymentId: string
  payUrl: string
  expireTime: string
}

// 订单状态: 0待支付,1待接单,2待配送,3待送达,4待评价,5已完成,6已过期,7已取消
export const OrderStatus = {
  PENDING_PAY: 0,
  PENDING_ACCEPT: 1,
  PENDING_DELIVERY: 2,
  PENDING_ARRIVE: 3,
  PENDING_REVIEW: 4,
  COMPLETED: 5,
  EXPIRED: 6,
  CANCELLED: 7,
} as const

export const OrderStatusText: Record<number, string> = {
  0: '待支付',
  1: '待接单',
  2: '待配送',
  3: '待送达',
  4: '待评价',
  5: '已完成',
  6: '已过期',
  7: '已取消',
}

// --- API ---

/** 获取自己作为用户的订单列表 */
export const listUserOrdersApi = (params: { status?: number; page?: number; size?: number }, token: string) => {
  const query = new URLSearchParams()
  if (params.status !== undefined) query.set('status', String(params.status))
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.size !== undefined) query.set('size', String(params.size))
  const qs = query.toString()
  return apiRequest<PageVO<OrderVO>>(`/api/order/list-order-for-user${qs ? `?${qs}` : ''}`, { token })
}

/** 获取自己作为商家的订单列表 */
export const listShopOwnerOrdersApi = (params: { status?: number; page?: number; size?: number }, token: string) => {
  const query = new URLSearchParams()
  if (params.status !== undefined) query.set('status', String(params.status))
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.size !== undefined) query.set('size', String(params.size))
  const qs = query.toString()
  return apiRequest<PageVO<OrderVO>>(`/api/order/list-order-for-shopowner${qs ? `?${qs}` : ''}`, { token })
}

/** 获取骑手订单列表 */
export const listRiderOrdersApi = (params: { status?: number; page?: number; size?: number }, token: string) => {
  const query = new URLSearchParams()
  if (params.status !== undefined) query.set('status', String(params.status))
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.size !== undefined) query.set('size', String(params.size))
  const qs = query.toString()
  return apiRequest<PageVO<OrderVO>>(`/api/order/list-order-for-rider${qs ? `?${qs}` : ''}`, { token })
}

/** 获取下单防重 token */
export const createOrderTokenApi = () => {
  return apiRequest<{ token: string }>('/api/order/create-order-token', { method: 'POST' })
}

/** 创建订单 */
export const createOrderApi = (payload: OrderCreateRequest, token: string) => {
  return apiRequest<OrderVO>('/api/order/create-order', {
    method: 'POST',
    body: payload,
    token,
  })
}

/** 支付宝支付订单 */
export const payOrderAlipayApi = (orderId: string, token: string) => {
  return apiRequest<PaymentCreateVO>(`/api/order/pay-alipay/${orderId}`, {
    method: 'POST',
    token,
  })
}

/** 钱包支付订单 */
export const payOrderWalletApi = (orderId: string, token: string) => {
  return apiRequest<null>(`/api/order/pay-wallet/${orderId}`, {
    method: 'POST',
    token,
  })
}

/** 商家接单 */
export const merchantAcceptApi = (orderId: string, token: string) => {
  return apiRequest<null>(`/api/order/merchant-accept/${orderId}`, {
    method: 'POST',
    token,
  })
}

/** 商家拒单 */
export const merchantRejectApi = (orderId: string, token: string) => {
  return apiRequest<null>(`/api/order/merchant-reject/${orderId}`, {
    method: 'POST',
    token,
  })
}

/** 骑手接单 */
export const riderAcceptApi = (orderId: string, token: string) => {
  return apiRequest<null>(`/api/order/rider-accept/${orderId}`, {
    method: 'POST',
    token,
  })
}

/** 骑手送达 */
export const riderArriveApi = (orderId: string, token: string) => {
  return apiRequest<null>(`/api/order/rider-arrive/${orderId}`, {
    method: 'POST',
    token,
  })
}

/** 用户取消订单（仅待支付状态） */
export const cancelOrderApi = (orderId: string, token: string) => {
  return apiRequest<null>(`/api/order/cancel/${orderId}`, {
    method: 'POST',
    token,
  })
}

/** 用户评价订单 */
export const createOrderReviewApi = (orderId: string, payload: OrderReviewRequest, token: string) => {
  return apiRequest<null>(`/api/order/create-review/${orderId}`, {
    method: 'POST',
    body: payload,
    token,
  })
}

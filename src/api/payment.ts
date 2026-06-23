import { apiRequest } from './http'

// --- 类型 ---

export interface PaymentWalletVO {
  balance: number
}

export interface PaymentCreateVO {
  paymentId: string
  payUrl: string
  expireTime: string
}

export interface PaymentStatusVO {
  paymentId: string
  subject: string
  businessType: string
  businessId: string
  tradeNo: string
  amount: number
  channel: string
  status: number
}

export interface WalletRechargeRequest {
  amount: number
}

export interface WalletWithdrawRequest {
  alipayUserId: string
  amount: number
}

export interface WalletWithdrawVO {
  withdrawId: string
  alipayOrderId: string
  payFundOrderId: string
  amount: number
  status: string
}

// --- API ---

/** 获取钱包余额 */
export const getBalanceApi = (token: string) => {
  return apiRequest<PaymentWalletVO>('/api/payment/balance', { token })
}

/** 创建钱包充值支付宝订单 */
export const alipayRechargeApi = (payload: WalletRechargeRequest, token: string) => {
  return apiRequest<PaymentCreateVO>('/api/payment/alipay-recharge', {
    method: 'POST',
    body: payload,
    token,
  })
}

/** 钱包提现到支付宝 */
export const alipayWithdrawApi = (payload: WalletWithdrawRequest, token: string) => {
  return apiRequest<WalletWithdrawVO>('/api/payment/alipay-withdraw', {
    method: 'POST',
    body: payload,
    token,
  })
}

/** 查询支付订单状态 */
export const getPaymentStatusApi = (paymentId: string, token: string) => {
  return apiRequest<PaymentStatusVO>(`/api/payment/status?paymentId=${paymentId}`, { token })
}

/** 刷新支付宝二维码 */
export const refreshAlipayApi = (paymentId: string, token: string) => {
  return apiRequest<PaymentCreateVO>(`/api/payment/refresh-alipay/${paymentId}`, { method: 'POST', token })
}

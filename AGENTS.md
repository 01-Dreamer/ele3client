# Ele3 前端接口文档

本文档按网关地址整理。默认网关：

```text
http://127.0.0.1:18000
```

统一响应结构：

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1781930000000
}
```

说明：

- 除 `/api/**/public/**` 外，普通用户接口需要登录，前端传 `Authorization: Bearer <token>`，网关会补充 `X-User-Id`。
- 管理员接口路径含 `/admin`，需要管理员角色。
- 所有雪花 ID 在前端都按字符串处理。
- 时间字段通常为后端序列化后的 `LocalDateTime` 或毫秒时间戳，按实际返回为准。

## 1. auth-service

### 公共接口

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 获取 YNU 扫码登录二维码 | GET | `/api/auth/public/ynu-oauth/get-qrcode` | 无 | `Map`，包含 `uuid`、`qr_url` 等远端字段 |
| 轮询 YNU 扫码登录结果 | GET | `/api/auth/public/ynu-oauth/check-qrcode?uuid={uuid}` | query: `uuid` | 登录成功返回登录信息；未绑定会提示前端 |
| 获取注册邮箱验证码 | POST | `/api/auth/public/register/email-captcha` | `EmailCaptchaSendRequest` | `{ "expireSeconds": 300 }` |
| 注册 | POST | `/api/auth/public/register` | `RegisterRequest` | `RegisterVO` |
| 登录 | POST | `/api/auth/public/login` | `LoginRequest` | `LoginVO` |
| 获取忘记密码邮箱验证码 | POST | `/api/auth/public/forgot-password/email-captcha` | `EmailCaptchaSendRequest` | `{ "expireSeconds": 300 }` |
| 忘记密码重置 | PUT | `/api/auth/public/forgot-password` | `ForgotPasswordResetRequest` | `null` |

### 用户接口

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 获取 YNU 账号绑定二维码 | GET | `/api/auth/ynu-oauth/get-qrcode` | 无 | `Map`，包含 `uuid`、`qr_url` 等远端字段 |
| 轮询 YNU 账号绑定结果 | GET | `/api/auth/ynu-oauth/check-qrcode?uuid={uuid}` | query: `uuid` | 绑定结果 |
| 修改密码 | PUT | `/api/auth/change-password` | `ChangePasswordRequest` | `null` |
| 获取修改密码邮箱验证码 | POST | `/api/auth/change-password/email-captcha` | `EmailCaptchaSendRequest` | `{ "expireSeconds": 300 }` |

请求体：

```json
// EmailCaptchaSendRequest
{
  "email": "test@qq.com",
  "captchaId": "slider-id",
  "captchaData": {}
}

// RegisterRequest
{
  "email": "test@qq.com",
  "password": "abc123456",
  "emailCaptcha": "123456"
}

// LoginRequest
{
  "email": "test@qq.com",
  "password": "abc123456",
  "captchaId": "image-id",
  "captchaCode": "A7K9Q2"
}

// ForgotPasswordResetRequest
{
  "email": "test@qq.com",
  "emailCaptcha": "123456",
  "newPassword": "newabc123"
}

// ChangePasswordRequest
{
  "oldPassword": "abc123456",
  "emailCaptcha": "123456",
  "newPassword": "newabc123"
}
```

返回体：

```json
// RegisterVO
{
  "userId": "2066777636767580162",
  "email": "test@qq.com",
  "role": "USER",
  "status": 0
}

// LoginVO
{
  "token": "token",
  "userInfo": {
    "userId": "2066777636767580162",
    "email": "test@qq.com",
    "role": "USER",
    "status": 0
  }
}
```

## 2. user-service

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 获取自己的用户资料 | GET | `/api/user/profile` | 无 | `UserVO` |
| 修改自己的用户资料 | PUT | `/api/user/profile` | `UserUpdateRequest` | `UserVO` |
| 根据用户 ID 获取头像昵称 | GET | `/api/user/brief/{userId}` | path: `userId` | `UserBriefVO` |
| 新增自己的收货地址 | POST | `/api/user/location` | `UserLocationCreateRequest` | `UserLocationVO` |
| 删除自己的收货地址 | DELETE | `/api/user/location/{locationId}` | path: `locationId` | `null` |
| 管理员根据用户 ID 获取资料 | GET | `/api/user/admin/profile?userId={userId}` | query: `userId` | `UserVO` |

请求体：

```json
// UserUpdateRequest，null 或 "" 表示不修改
{
  "nickname": "小饿",
  "avatar": "https://example.com/avatar.png"
}

// UserLocationCreateRequest
{
  "name": "张三",
  "phone": "13800138000",
  "address": "四川省成都市高新区天府大道",
  "longitude": 104.066801,
  "latitude": 30.572269
}
```

返回体：

```json
// UserVO
{
  "userId": "2066777636767580162",
  "nickname": "小饿",
  "avatar": "https://example.com/avatar.png",
  "createTime": "2026-06-21T12:00:00",
  "updateTime": "2026-06-21T12:00:00"
}

// UserBriefVO
{
  "userId": "2066777636767580162",
  "nickname": "小饿",
  "avatar": "https://example.com/avatar.png"
}

// UserLocationVO
{
  "locationId": "2066777636767580162",
  "name": "张三",
  "phone": "13800138000",
  "address": "四川省成都市高新区天府大道",
  "longitude": 104.066801,
  "latitude": 30.572269,
  "createTime": "2026-06-21T12:00:00",
  "updateTime": "2026-06-21T12:00:00"
}
```

## 3. file-service

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 上传图片文件 | POST | `/api/file/upload` | `multipart/form-data`，字段 `file` | `FileUploadVO` |
| 获取 OSS 直传授权 | POST | `/api/file/upload-policy` | `DirectUploadPolicyRequest` | `DirectUploadPolicyVO` |
| 删除自己的文件 | DELETE | `/api/file/delete?objectName={objectName}` | query: `objectName` | `null` |
| 管理员删除任意文件 | DELETE | `/api/file/admin/delete?url={url}` | query: `url` | `null` |

请求体：

```json
// DirectUploadPolicyRequest
{
  "originalFilename": "avatar.png",
  "contentType": "image/png"
}
```

返回体：

```json
// FileUploadVO
{
  "objectName": "ele/user123/uuid.png",
  "url": "https://xxx/ele/user123/uuid.png",
  "originalFilename": "avatar.png",
  "size": 1024,
  "contentType": "image/png"
}

// DirectUploadPolicyVO
{
  "host": "https://bucket.oss-cn-chengdu.aliyuncs.com",
  "objectName": "ele/user123/uuid.png",
  "url": "https://xxx/ele/user123/uuid.png",
  "accessKeyId": "xxx",
  "policy": "base64-policy",
  "signature": "signature",
  "expire": 1781930000,
  "successActionStatus": "200",
  "contentType": "image/png"
}
```

## 4. location-service

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 上传自己的经纬度 | POST | `/api/location/coordinate` | `CoordinateUploadRequest` | `CoordinateVO` |
| 获取指定用户经纬度 | GET | `/api/location/coordinate?userId={userId}` | query: `userId` | `CoordinateVO`；不存在返回 `404` |

请求体：

```json
{
  "longitude": 104.066801,
  "latitude": 30.572269
}
```

返回体：

```json
{
  "longitude": 104.066801,
  "latitude": 30.572269,
  "updateTime": 1781930000000
}
```

## 5. payment-service

### 用户接口

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 获取自己的钱包余额 | GET | `/api/payment/balance` | 无 | `PaymentWalletVO` |
| 创建钱包充值支付宝订单 | POST | `/api/payment/alipay-recharge` | `WalletRechargeRequest` | `PaymentCreateVO` |
| 钱包提现到支付宝账户 | POST | `/api/payment/alipay-withdraw` | `WalletWithdrawRequest` | `WalletWithdrawVO` |
| 查询支付订单状态 | GET | `/api/payment/status?paymentId={paymentId}` | query: `paymentId` | `PaymentStatusVO` |

### 公共回调

| 功能 | 方法 | 网关地址 | 参数 | 返回 |
| --- | --- | --- | --- | --- |
| 支付宝支付回调 | POST | `/api/payment/public/alipay/notify` | 支付宝表单回调参数 | 字符串 `success` 或 `fail` |

请求体：

```json
// WalletRechargeRequest
{
  "amount": 20.00
}

// WalletWithdrawRequest
{
  "alipayUserId": "2088722101573040",
  "amount": 10.00
}
```

返回体：

```json
// PaymentWalletVO
{
  "balance": 100.00
}

// PaymentCreateVO
{
  "paymentId": "2067107601425895425",
  "payUrl": "https://qr.alipay.com/xxx",
  "expireTime": "2026-06-21 13:30:00"
}

// PaymentStatusVO
{
  "paymentId": "2067107601425895425",
  "subject": "订单支付",
  "businessType": "ORDER",
  "businessId": "2066777636767580162",
  "tradeNo": "ALIPAY2026061722001473280508253785",
  "amount": 12.50,
  "channel": "ALIPAY",
  "status": 1
}

// WalletWithdrawVO
{
  "withdrawId": "2068189240281378818",
  "alipayOrderId": "20260620110070000002030004224869",
  "payFundOrderId": "20260620110070001502030004225147",
  "amount": 10.00,
  "status": "SUCCESS"
}
```

支付状态：`0等待支付，1支付成功，2支付过期，3支付取消，4支付退款`。

## 6. shop-service

### 用户接口

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 创建店铺 | POST | `/api/shop/create-shop` | `ShopCreateRequest` | `ShopVO` |
| 修改自己的店铺 | PUT | `/api/shop/modify-shop/{shopId}` | path: `shopId`，body: `ShopUpdateRequest` | `ShopVO` |
| 添加商品 | POST | `/api/shop/add-item/{shopId}` | path: `shopId`，body: `ShopItemCreateRequest` | `ShopItemVO` |
| 删除自己店铺商品 | DELETE | `/api/shop/delete-item/{shopId}/{itemId}` | path: `shopId,itemId` | `null` |
| 修改自己店铺商品 | PUT | `/api/shop/modify-item/{shopId}/{itemId}` | path: `shopId,itemId`，body: `ShopItemUpdateRequest` | `ShopItemVO` |
| 删除自己的店铺 | DELETE | `/api/shop/delete-shop/{shopId}` | path: `shopId` | `null` |
| 获取店铺信息 | GET | `/api/shop/get-shop/{shopId}` | path: `shopId` | `ShopVO` |
| 获取商品列表 | GET | `/api/shop/list-item/{shopId}` | path: `shopId` | `ShopItemVO[]` |
| 搜索店铺 | GET | `/api/shop/search-shop` | query 见下 | `CursorPageVO<ShopVO>` |
| 查询热搜关键词 | GET | `/api/shop/list-hot-search` | 无 | `string[]` |
| 搜索提示 | GET | `/api/shop/suggest-search?query={query}` | query: `query` | `string[]` |
| 查询店铺评价 | GET | `/api/shop/list-review/{shopId}` | path: `shopId`，query: `cursor,size` | `CursorPageVO<ShopReviewVO>` |
| 查询评价回复 | GET | `/api/shop/list-review-reply/{reviewId}` | path: `reviewId`，query: `cursor,size` | `CursorPageVO<ShopReviewReplyVO>` |
| 回复店铺评价 | POST | `/api/shop/reply-review` | `ShopReviewReplyRequest` | `null` |

搜索参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `longitude` | decimal | 否 | 用户经度；不传经纬度则走 MySQL 游标分页 |
| `latitude` | decimal | 否 | 用户纬度 |
| `query` | string | 否 | 搜索关键词，空值不匹配关键词 |
| `sort` | string | 否 | `distance`、`rating`、`sales`，默认 `distance` |
| `cursor` | string | 否 | 游标 |
| `size` | int | 否 | 页大小 |

### 管理员接口

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 封禁或解封店铺 | PUT | `/api/shop/admin/change-status/{shopId}` | `ShopStatusUpdateRequest` | `ShopVO` |
| 管理员获取店铺信息 | GET | `/api/shop/admin/get-shop/{shopId}` | path: `shopId` | `ShopVO` |
| 管理员获取商品列表 | GET | `/api/shop/admin/list-item/{shopId}` | path: `shopId` | `ShopItemVO[]` |
| 删除任意店铺 | DELETE | `/api/shop/admin/delete-shop/{shopId}` | path: `shopId` | `null` |
| 删除任意商品 | DELETE | `/api/shop/admin/delete-item/{itemId}` | path: `itemId` | `null` |
| 删除任意评价 | DELETE | `/api/shop/admin/delete-review/{reviewId}` | path: `reviewId` | `null` |
| 删除任意评价回复 | DELETE | `/api/shop/admin/delete-review-reply/{replyId}` | path: `replyId` | `null` |

请求体：

```json
// ShopCreateRequest
{
  "name": "川味小馆",
  "avatar": "https://example.com/shop.png",
  "description": "家常川菜",
  "address": "四川省成都市高新区天府大道",
  "longitude": 104.066801,
  "latitude": 30.572269,
  "deliveryFee": 3.00,
  "openTime": "09:00",
  "closeTime": "22:00"
}

// ShopUpdateRequest，null 或 "" 表示不修改
{
  "name": "川味小馆",
  "avatar": "https://example.com/shop.png",
  "description": "家常川菜",
  "address": "四川省成都市高新区天府大道",
  "longitude": 104.066801,
  "latitude": 30.572269,
  "deliveryFee": 3.00,
  "openTime": "09:00",
  "closeTime": "22:00"
}

// ShopItemCreateRequest
{
  "name": "招牌牛肉饭",
  "image": "https://example.com/item.png",
  "description": "大份牛肉饭",
  "price": 18.50
}

// ShopItemUpdateRequest，null 或 "" 表示不修改
{
  "name": "招牌牛肉饭",
  "image": "https://example.com/item.png",
  "description": "大份牛肉饭",
  "price": 18.50,
  "status": 0
}

// ShopStatusUpdateRequest
{
  "status": 1
}

// ShopReviewReplyRequest
{
  "reviewId": "2067107601425895425",
  "atUserId": "2066777636767580162",
  "content": "感谢评价"
}
```

返回体：

```json
// ShopVO
{
  "shopId": "2067907527248560130",
  "userId": "2066777636767580162",
  "name": "川味小馆",
  "avatar": "https://example.com/shop.png",
  "description": "家常川菜",
  "address": "四川省成都市高新区天府大道",
  "longitude": 104.066801,
  "latitude": 30.572269,
  "deliveryFee": 3.00,
  "openTime": "09:00",
  "closeTime": "22:00",
  "reviewScore": 4.5,
  "reviewCount": 10,
  "salesCount": 100,
  "status": 0,
  "createTime": "2026-06-21T12:00:00",
  "updateTime": "2026-06-21T12:00:00"
}

// CursorPageVO<T>
{
  "records": [],
  "nextCursor": "cursor",
  "hasMore": true
}

// ShopItemVO
{
  "itemId": "2067907527248560131",
  "shopId": "2067907527248560130",
  "name": "招牌牛肉饭",
  "image": "https://example.com/item.png",
  "description": "大份牛肉饭",
  "price": 18.50,
  "status": 0,
  "createTime": "2026-06-21T12:00:00",
  "updateTime": "2026-06-21T12:00:00"
}

// ShopReviewVO
{
  "reviewId": "2067107601425895425",
  "orderId": "2067107601425895424",
  "shopId": "2067907527248560130",
  "userId": "2066777636767580162",
  "score": 4.5,
  "content": "很好吃",
  "images": ["https://example.com/1.png"],
  "createTime": "2026-06-21T12:00:00"
}

// ShopReviewReplyVO
{
  "replyId": "2067107601425895426",
  "reviewId": "2067107601425895425",
  "userId": "2066777636767580162",
  "atUserId": "2066777636767580163",
  "content": "谢谢",
  "createTime": "2026-06-21T12:00:00"
}
```

店铺状态：`0正常，1封禁`。商品状态：`0正常，1下架`。

## 7. order-service

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 获取自己的订单列表 | GET | `/api/order/list-order?status={status}&page={page}&size={size}` | query: `status` 可选，`page/size` 可选 | `PageVO<OrderVO>` |
| 创建订单 | POST | `/api/order/create-order` | `OrderCreateRequest` | `OrderVO` |
| 支付宝支付订单 | POST | `/api/order/pay-alipay/{orderId}` | path: `orderId` | `PaymentCreateVO` |
| 钱包支付订单 | POST | `/api/order/pay-wallet/{orderId}` | path: `orderId` | `null` |
| 商家接单 | POST | `/api/order/merchant-accept/{orderId}` | path: `orderId` | `null` |
| 商家拒单 | POST | `/api/order/merchant-reject/{orderId}` | path: `orderId` | `null` |
| 骑手接单 | POST | `/api/order/rider-accept/{orderId}` | path: `orderId` | `null` |
| 骑手送达 | POST | `/api/order/rider-arrive/{orderId}` | path: `orderId` | `null` |
| 用户评价订单 | POST | `/api/order/create-review/{orderId}` | path: `orderId`，body: `OrderReviewRequest` | `null` |

请求体：

```json
// OrderCreateRequest
{
  "shopId": "2067907527248560130",
  "receiverName": "张三",
  "receiverPhone": "13800138000",
  "receiverAddress": "四川省成都市高新区天府大道",
  "receiverLongitude": 104.066801,
  "receiverLatitude": 30.572269,
  "remark": "少辣",
  "items": [
    {
      "shopItemId": "2067907527248560131",
      "quantity": 2
    }
  ]
}

// OrderReviewRequest
{
  "score": 4.5,
  "content": "很好吃",
  "images": ["https://example.com/1.png"]
}
```

返回体：

```json
// PageVO<T>
{
  "records": [],
  "total": 100,
  "page": 1,
  "size": 10,
  "pages": 10
}

// OrderVO
{
  "orderId": "2069000000000000001",
  "userId": "2066777636767580162",
  "shopId": "2067907527248560130",
  "shopOwnerId": "2066777636767580163",
  "riderId": "2066777636767580164",
  "shopName": "川味小馆",
  "receiverName": "张三",
  "receiverPhone": "13800138000",
  "receiverAddress": "四川省成都市高新区天府大道",
  "receiverLongitude": 104.066801,
  "receiverLatitude": 30.572269,
  "remark": "少辣",
  "deliveryFee": 3.00,
  "amount": 40.00,
  "status": 0,
  "expireTime": "2026-06-21T12:30:00",
  "createTime": "2026-06-21T12:00:00",
  "updateTime": "2026-06-21T12:00:00",
  "items": [
    {
      "itemId": "2067907527248560131",
      "name": "招牌牛肉饭",
      "price": 18.50,
      "quantity": 2,
      "amount": 37.00
    }
  ]
}
```

订单状态：`0待支付，1待接单，2待配送，3待送达，4待评价，5已完成，6已过期，7已取消`。

## 8. message-service

### HTTP 接口

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 标记通知为已读 | PUT | `/api/message/read-notice/{noticeId}` | path: `noticeId` | `null` |
| 清空会话未读计数 | PUT | `/api/message/clear-unread/{sessionId}` | path: `sessionId` | `null` |
| 隐藏会话 | DELETE | `/api/message/hide-session/{sessionId}` | path: `sessionId` | `null` |
| 获取自己的会话列表 | GET | `/api/message/list-session?cursor={cursor}&size={size}` | query 可选 | `CursorPageVO<MessageSessionVO>` |
| 获取自己的聊天消息 | GET | `/api/message/list-chat?cursor={cursor}&size={size}` | query 可选 | `CursorPageVO<MessageChatVO>` |
| 获取自己的通知列表 | GET | `/api/message/list-notice?cursor={cursor}&size={size}` | query 可选 | `CursorPageVO<MessageNoticeVO>` |
| 管理员查询用户会话 | GET | `/api/message/admin/list-session?userId={userId}&cursor={cursor}&size={size}` | query | `CursorPageVO<MessageSessionVO>` |
| 管理员查询两人聊天记录 | GET | `/api/message/admin/list-chat?userA={userA}&userB={userB}&cursor={cursor}&size={size}` | query | `CursorPageVO<MessageChatVO>` |
| 管理员查询用户通知 | GET | `/api/message/admin/list-notice?userId={userId}&cursor={cursor}&size={size}` | query | `CursorPageVO<MessageNoticeVO>` |
| 管理员删除通知 | DELETE | `/api/message/admin/delete-notice/{noticeId}` | path: `noticeId` | `null` |
| 管理员删除聊天消息 | DELETE | `/api/message/admin/delete-chat/{chatId}` | path: `chatId` | `null` |

返回体：

```json
// CursorPageVO<T>
{
  "items": [],
  "nextCursor": "cursor",
  "hasMore": true
}

// MessageSessionVO
{
  "id": "2069000000000000001",
  "smallerUserId": "123",
  "largerUserId": "456",
  "lastMessageId": "2069000000000000002",
  "lastMessageContent": "你好",
  "lastMessageTime": "2026-06-21T12:00:00",
  "smallerUserUnreadCount": 0,
  "largerUserUnreadCount": 1,
  "smallerUserShow": 1,
  "largerUserShow": 1,
  "createTime": "2026-06-21T12:00:00",
  "updateTime": "2026-06-21T12:00:00"
}

// MessageChatVO
{
  "id": "2069000000000000002",
  "senderId": "123",
  "receiverId": "456",
  "content": "你好",
  "createTime": "2026-06-21T12:00:00"
}

// MessageNoticeVO
{
  "id": "2069000000000000003",
  "userId": "123",
  "title": "订单通知",
  "content": "你的订单已被商家接单",
  "isRead": 0,
  "createTime": "2026-06-21T12:00:00",
  "updateTime": "2026-06-21T12:00:00"
}
```

### WebSocket

连接地址：

```text
ws://127.0.0.1:18000/api/message/ws
```

请求头：

```text
Authorization: Bearer <token>
```

消息格式：

```json
{
  "type": "CHAT",
  "senderId": "2066777636767580162",
  "receiverId": "2066777636767580163",
  "data": "你好",
  "timestamp": 1781930000000
}
```

类型：

- `CHAT`：聊天消息。用户只能发送该类型和 `PING`。
- `NOTICE`：通知消息。通常由后端服务投递。
- `PING`：心跳请求。服务端会向当前连接返回 `PONG`。
- `PONG`：心跳响应。

PING 示例：

```json
{
  "type": "PING",
  "senderId": "",
  "receiverId": "",
  "data": null,
  "timestamp": 1781930000000
}
```

## 9. risk-service

| 功能 | 方法 | 网关地址 | 参数 | 返回 data |
| --- | --- | --- | --- | --- |
| 获取滑块验证码 | POST | `/api/risk/public/captcha/slider` | 无 | 第三方滑块验证码数据 |
| 获取图片验证码 | POST | `/api/risk/public/captcha/image` | 无 | `TextCaptchaVO` |
| 通过滑块验证码清空用户风险分 | POST | `/api/risk/public/captcha/clear-risk-by-slider` | `RiskClearBySliderRequest` | `null` |

请求体：

```json
// RiskClearBySliderRequest
{
  "userId": "2066777636767580162",
  "captchaId": "captcha-id",
  "captchaData": {}
}
```

返回体：

```json
// TextCaptchaVO
{
  "id": "captcha-id",
  "type": "IMAGE",
  "image": "data:image/png;base64,...",
  "width": 120,
  "height": 40
}
```

## 10. 内部接口附录

下面接口是服务间调用接口，前端一般不要调用；如确需调试，也应走内部令牌。

| 服务 | 方法 | 网关地址 | 参数 |
| --- | --- | --- | --- |
| user-service | POST | `/internal/user/create-user` | `UserCreateRequest` |
| payment-service | POST | `/internal/payment/create-wallet` | `PaymentWalletCreateRequest` |
| payment-service | POST | `/internal/payment/deduct-balance` | `PaymentWalletDeductRequest` |
| payment-service | POST | `/internal/payment/add-balance` | `PaymentWalletAddRequest` |
| payment-service | POST | `/internal/payment/create-alipay-order` | `PaymentCreateRequest` |
| payment-service | POST | `/internal/payment/close-alipay-order` | `PaymentCloseRequest` |
| payment-service | POST | `/internal/payment/refund-alipay-order-by-order` | `PaymentOrderRefundRequest` |
| payment-service | POST | `/internal/payment/refund-alipay-order` | `PaymentRefundRequest` |
| shop-service | POST | `/internal/shop/create-review` | `ShopReviewCreateRequest` |
| shop-service | POST | `/internal/shop/increase-sales` | `ShopSalesIncreaseRequest` |
| shop-service | POST | `/internal/shop/create-bill` | `ShopBillCreateRequest` |
| order-service | POST | `/internal/order/mark-paid` | `OrderPaidRequest` |
| risk-service | POST | `/internal/risk/captcha/verify` | `CaptchaVerifyRequest` |

常用内部请求体：

```json
// PaymentWalletDeductRequest / PaymentWalletAddRequest
{
  "userId": "2066777636767580162",
  "amount": 12.50
}

// PaymentCreateRequest
{
  "subject": "订单支付",
  "businessId": "2069000000000000001",
  "amount": 12.50,
  "expireMinutes": 15
}

// ShopBillCreateRequest
{
  "shopId": "2067907527248560130",
  "items": [
    {
      "itemId": "2067907527248560131",
      "quantity": 2
    }
  ]
}

// ShopReviewCreateRequest
{
  "orderId": "2069000000000000001",
  "userId": "2066777636767580162",
  "shopId": "2067907527248560130",
  "score": 4.5,
  "content": "很好吃",
  "images": []
}
```

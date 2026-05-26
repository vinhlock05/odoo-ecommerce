# API Mapping — Headless Fashion Store eCommerce
**Version:** 1.0  
**Date:** 2026-05-26  
**Status:** Draft  
**Kiến trúc:** Headless Odoo v19 — OCA FastAPI + ShopInvader Foundation  
**Nguồn tham chiếu:** BRD v2.0, UC01–UC20, US-001–US-028

---

## Kiến trúc tổng quan

```
Frontend (Next.js)
     │
     │  HTTP/HTTPS  Authorization: Bearer <JWT>
     ▼
┌─────────────────────────────────────────────┐
│           Odoo v19 FastAPI Layer            │
│                                             │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  ShopInvader    │  │  Custom Modules  │  │
│  │  (INHERIT)      │  │  (CUSTOM)        │  │
│  │                 │  │                  │  │
│  │  /api/catalog   │  │  /api/coolcash   │  │
│  │  /api/cart      │  │  /api/coolclub   │  │
│  │  /api/checkout  │  │  /api/referral   │  │
│  │  /api/auth      │  │  /api/payment/vn │  │
│  │  /api/orders    │  │  /api/order/ext  │  │
│  │  /api/wishlist  │  │                  │  │
│  └─────────────────┘  └──────────────────┘  │
│                                             │
│  fastapi_auth_partner_jwt (JWT validation)  │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│           Odoo ORM / Business Logic         │
│  product.template, sale.order, res.partner  │
│  loyalty.program, coolcash.wallet,          │
│  coolclub.tier, referral.code               │
└─────────────────────────────────────────────┘
     │
     ▼
    PostgreSQL 16
```

---

## Quy ước tài liệu

| Nhãn | Ý nghĩa |
|------|---------|
| **[INHERIT]** | Endpoint có sẵn từ ShopInvader / OCA — dùng nguyên hoặc cấu hình nhỏ |
| **[EXTEND]** | Endpoint ShopInvader được mở rộng (inherit class + override method) thêm trường tùy biến |
| **[CUSTOM]** | Endpoint mới hoàn toàn, viết từ OCA `fastapi` + router riêng |
| `🔒 JWT` | Endpoint yêu cầu `Authorization: Bearer <token>` |
| `✅ Public` | Endpoint không cần auth |
| **FF-xx** | Feature Flag kiểm soát tính năng (bật/tắt qua `res.config.settings`) |

---

## Mục lục Endpoint Groups

1. [Authentication — `/api/auth`](#1-authentication)
2. [Catalog — `/api/catalog`](#2-catalog)
3. [Cart — `/api/cart`](#3-cart)
4. [Checkout — `/api/checkout`](#4-checkout)
5. [Payment — `/api/payment`](#5-payment)
6. [Orders — `/api/orders`](#6-orders)
7. [CoolCash — `/api/coolcash`](#7-coolcash)
8. [CoolClub — `/api/coolclub`](#8-coolclub)
9. [Referral — `/api/referral`](#9-referral)
10. [Account — `/api/account`](#10-account)
11. [Wishlist — `/api/wishlist`](#11-wishlist)

---

## 1. Authentication

**OCA Module:** `shopinvader_auth_api_key` + `fastapi_auth_partner_jwt`  
**Base URL:** `/api/auth`

### 1.1 Đăng ký tài khoản
**UC:** UC12 | **US:** US-016

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/auth/register` |
| Auth | `✅ Public` |
| Tag | **[EXTEND]** |

**Request Body:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "phone": "0901234567",
  "gender_title": "anh"
}
```

> **INHERIT:** ShopInvader `POST /auth/register` tạo `res.partner` + issue JWT.  
> **EXTEND:** Thêm trường `gender_title` (FF-20) — ghi vào `res.partner.x_gender_title` (custom field).

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "partner": {
    "id": 42,
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "gender_title": "anh"
  }
}
```

**Odoo Logic:** Tạo `res.partner` (customer=True), hash password, generate JWT via `fastapi_auth_partner_jwt`.

---

### 1.2 Đăng nhập Email/Password
**UC:** UC12 | **US:** US-016

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/auth/login` |
| Auth | `✅ Public` |
| Tag | **[INHERIT]** |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Giống 1.1 (access_token + partner info).

**Odoo Logic:** `res.users` authenticate → `fastapi_auth_partner_jwt` phát JWT gắn `partner_id`.

---

### 1.3 Làm mới Token
| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/auth/refresh` |
| Auth | `🔒 JWT` |
| Tag | **[INHERIT]** |

**Request Body:**
```json
{ "refresh_token": "eyJhbGciOiJIUzI1NiIs..." }
```

**Response:** `{ "access_token": "..." }`

---

### 1.4 Đăng nhập Social — Google / Facebook
**UC:** UC13 | **US:** US-017

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/auth/social/{provider}` |
| Auth | `✅ Public` |
| Tag | **[INHERIT]** — OCA `auth_oauth` + `shopinvader_auth_api_key` |

**Request Body:**
```json
{ "access_token": "<google-or-facebook-oauth-token>" }
```

**Odoo Logic:** Xác thực token với provider → tìm/tạo `res.partner` → issue JWT.

---

### 1.5 Đăng nhập Zalo QR
**UC:** UC13 | **US:** US-017 | **FF-17**

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/auth/zalo` |
| Auth | `✅ Public` |
| Tag | **[CUSTOM]** |

**Request Body:**
```json
{ "zalo_code": "<authorization_code_from_zalo_oa>" }
```

> **CUSTOM:** Zalo không thuộc OCA `auth_oauth` mặc định. Viết custom FastAPI router gọi Zalo OA API (`https://oauth.zaloapp.com/v4/access_token`), lấy Zalo user profile, tìm/tạo `res.partner` có `x_zalo_id`, phát JWT.

**Response:** Giống 1.1.

---

### 1.6 Đăng xuất
| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/auth/logout` |
| Auth | `🔒 JWT` |
| Tag | **[INHERIT]** |

**Odoo Logic:** Invalidate JWT (blacklist token ID trong Redis hoặc Odoo cache).

---

## 2. Catalog

**OCA Module:** `shopinvader_product` + `shopinvader_category`  
**Base URL:** `/api/catalog`

### 2.1 Lấy danh sách Collection (Categories)
**UC:** UC01 | **US:** US-001

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/catalog/categories` |
| Auth | `✅ Public` |
| Tag | **[INHERIT]** |

**Query Params:** `?parent_id=<id>&website_published=true`

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Áo thun nam",
      "slug": "ao-thun-nam",
      "image_url": "...",
      "parent_id": null,
      "children": [...]
    }
  ]
}
```

**Odoo Logic:** Query `product.category` (website_published=True) qua ShopInvader service layer.

---

### 2.2 Lấy danh sách sản phẩm theo Collection
**UC:** UC01 | **US:** US-001, US-003

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/catalog/products` |
| Auth | `✅ Public` |
| Tag | **[EXTEND]** |

**Query Params:**
```
?category_slug=ao-thun-nam
&size=M,L          (filter by attribute Kích thước)
&color=xanh-navy   (filter by attribute Loại)
&gender=male       (filter by x_gender_type)
&sort=best_seller  (best_seller | price_asc | price_desc | newest)
&page=1
&limit=24
```

**Response:**
```json
{
  "total": 156,
  "page": 1,
  "limit": 24,
  "items": [
    {
      "id": 101,
      "name": "Áo thun Coolmate Basic",
      "slug": "ao-thun-coolmate-basic",
      "price": 199000,
      "original_price": 249000,
      "thumbnail_url": "...",
      "is_on_sale": true,
      "variants_available": true
    }
  ]
}
```

> **INHERIT:** ShopInvader `/products` với filter theo `product.attribute`.  
> **EXTEND:** Thêm filter `gender` (custom field `x_gender_type` trên `product.template`), thêm sort `best_seller` (query theo `sale_order_line.product_id` aggregate).

**Odoo Logic:** ORM search `product.template` + domain filter + pagination.

---

### 2.3 Chi tiết sản phẩm
**UC:** UC02 | **US:** US-002, US-004

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/catalog/products/{slug}` |
| Auth | `✅ Public` |
| Tag | **[EXTEND]** |

**Response:**
```json
{
  "id": 101,
  "name": "Áo thun Coolmate Basic",
  "slug": "ao-thun-coolmate-basic",
  "description_html": "...",
  "price": 199000,
  "attributes": {
    "Loại": [
      { "value": "Xanh Navy", "slug": "xanh-navy", "swatch_image_url": "...", "in_stock": true }
    ],
    "Kích thước": [
      { "value": "S", "in_stock": true },
      { "value": "M", "in_stock": true },
      { "value": "L", "in_stock": false }
    ]
  },
  "variants": [
    {
      "id": 201,
      "combination": { "Loại": "Xanh Navy", "Kích thước": "M" },
      "sku": "ATCB-NAVY-M",
      "price": 199000,
      "stock_qty": 15,
      "in_stock": true
    }
  ],
  "coolcash_estimate": 14000,
  "images": [...],
  "specs": { "material": "100% Cotton", "technology": "...", "care": "..." }
}
```

> **INHERIT:** ShopInvader `/products/{slug}` với variants, attributes.  
> **EXTEND:**  
> - `coolcash_estimate` — tính từ `price * coolcash_earn_rate` (FF-06)  
> - `in_stock: false` cho từng variant (greyed-out OOS, US-004)  
> - `specs` — custom fields `x_material`, `x_technology`, `x_care_instruction` trên `product.template`

**Odoo Logic:** `product.template.search([('website_slug','=',slug)])` → build response với `product.product` variants và `stock.quant` qty.

---

### 2.4 Lấy danh sách Attributes (dùng cho filter UI)
| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/catalog/attributes` |
| Auth | `✅ Public` |
| Tag | **[INHERIT]** |

**Query Params:** `?category_slug=ao-thun-nam`

**Response:**
```json
{
  "size": ["XS","S","M","L","XL","2XL","3XL"],
  "color": ["Trắng","Đen","Xanh Navy",...],
  "gender": ["male","female","unisex"]
}
```

---

## 3. Cart

**OCA Module:** `shopinvader_cart`  
**Base URL:** `/api/cart`

### 3.1 Lấy giỏ hàng hiện tại
**UC:** UC03, UC04 | **US:** US-005, US-006

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/cart` |
| Auth | `🔒 JWT` (Member) hoặc `✅ Public` (Guest dùng `cart_uuid` trong cookie) |
| Tag | **[EXTEND]** |

**Headers:** `X-Cart-UUID: <uuid>` (Guest) hoặc `Authorization: Bearer <token>` (Member)

**Response:**
```json
{
  "cart_id": "550e8400-e29b-41d4-a716-446655440000",
  "lines": [
    {
      "line_id": 1,
      "product_id": 201,
      "product_name": "Áo thun Coolmate Basic - Xanh Navy / M",
      "sku": "ATCB-NAVY-M",
      "qty": 2,
      "unit_price": 199000,
      "subtotal": 398000,
      "thumbnail_url": "..."
    }
  ],
  "subtotal": 398000,
  "discount": 0,
  "free_gifts": [],
  "total": 398000,
  "coolcash_earnable": 28000,
  "free_shipping_threshold": 350000,
  "is_free_shipping_eligible": true
}
```

> **EXTEND:** Thêm `coolcash_earnable` (FF-06), `free_shipping_threshold`, `free_gifts` (FF-02).

---

### 3.2 Thêm sản phẩm vào giỏ
**UC:** UC03 | **US:** US-005

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/cart/items` |
| Auth | `✅ Public` (Guest) / `🔒 JWT` (Member) |
| Tag | **[INHERIT]** |

**Request Body:**
```json
{
  "product_id": 201,
  "qty": 1
}
```

**Odoo Logic:** Tạo/cập nhật `sale.order` (state=draft) + `sale.order.line`. Áp dụng promotion tự động nếu đủ điều kiện (UC05).

---

### 3.3 Cập nhật số lượng
**UC:** UC04 | **US:** US-006

| Trường | Giá trị |
|--------|---------|
| Method | `PATCH` |
| Path | `/api/cart/items/{line_id}` |
| Auth | `✅ Public` / `🔒 JWT` |
| Tag | **[INHERIT]** |

**Request Body:**
```json
{ "qty": 3 }
```

---

### 3.4 Xóa item khỏi giỏ
**UC:** UC04 | **US:** US-006

| Trường | Giá trị |
|--------|---------|
| Method | `DELETE` |
| Path | `/api/cart/items/{line_id}` |
| Auth | `✅ Public` / `🔒 JWT` |
| Tag | **[INHERIT]** |

---

### 3.5 Áp dụng mã giảm giá (Coupon)
**UC:** UC06 | **US:** US-007

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/cart/coupon` |
| Auth | `✅ Public` / `🔒 JWT` |
| Tag | **[INHERIT]** |

**Request Body:**
```json
{ "coupon_code": "SUMMER20" }
```

**Response:**
```json
{
  "applied": true,
  "discount_amount": 79600,
  "message": "Giảm 20% — tiết kiệm 79.600đ"
}
```

**Odoo Logic:** `sale.coupon.apply_coupon(order, coupon_code)` — Odoo built-in promotion engine.

---

### 3.6 Xóa mã giảm giá
| Trường | Giá trị |
|--------|---------|
| Method | `DELETE` |
| Path | `/api/cart/coupon/{code}` |
| Auth | `✅ Public` / `🔒 JWT` |
| Tag | **[INHERIT]** |

---

### 3.7 Merge giỏ hàng Guest → Member
**UC:** UC08

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/cart/merge` |
| Auth | `🔒 JWT` |
| Tag | **[INHERIT]** |

**Request Body:**
```json
{ "guest_cart_uuid": "550e8400-e29b-41d4-a716-446655440000" }
```

**Odoo Logic:** ShopInvader cart merge service — chuyển các `sale.order.line` của guest cart vào partner cart.

---

## 4. Checkout

**OCA Module:** `shopinvader_sale`  
**Base URL:** `/api/checkout`

> **Lưu ý kiến trúc:** Single-page Checkout là UI layer (Frontend). Backend chỉ cần các endpoint nhận shipping info, địa chỉ, và confirm order. Không cần multi-step wizard của Odoo native.

### 4.1 Lấy thông tin Checkout (prefill)
**UC:** UC07, UC08 | **US:** US-009, US-010

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/checkout` |
| Auth | `✅ Public` (Guest) / `🔒 JWT` (Member) |
| Tag | **[EXTEND]** |

**Response:**
```json
{
  "cart_summary": { ... },
  "saved_addresses": [...],
  "shipping_methods": [
    { "id": 1, "name": "Giao hàng tiêu chuẩn (GHN)", "price": 30000, "eta": "2-3 ngày" },
    { "id": 2, "name": "Giao hàng nhanh (GHTK)", "price": 50000, "eta": "1 ngày" }
  ],
  "available_payment_methods": ["cod", "vnpay", "momo", "zalopay", "coolcash"],
  "coolcash_balance": 56000,
  "referral_discount_pending": 50000
}
```

> **EXTEND:** `coolcash_balance` (FF-06), `referral_discount_pending` (FF-08), shipping methods từ GHN/GHTK integration.

---

### 4.2 Cập nhật địa chỉ giao hàng
**UC:** UC07, UC08 | **US:** US-009, US-010

| Trường | Giá trị |
|--------|---------|
| Method | `PUT` |
| Path | `/api/checkout/shipping-address` |
| Auth | `✅ Public` / `🔒 JWT` |
| Tag | **[EXTEND]** |

**Request Body:**
```json
{
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "email": "user@example.com",
  "street": "123 Nguyễn Huệ",
  "ward": "Bến Nghé",
  "district": "Quận 1",
  "city": "TP. Hồ Chí Minh",
  "gender_title": "anh",
  "alternate_receiver": {
    "name": "Trần Thị B",
    "phone": "0912345678"
  }
}
```

> **EXTEND:** Thêm `gender_title` (FF-20) và `alternate_receiver` (FF-19) — lưu vào `sale.order.x_gender_title` và `sale.order.x_alternate_receiver_*` (custom fields).

**Odoo Logic:** Cập nhật `sale.order.partner_shipping_id` (tìm hoặc tạo `res.partner`).

---

### 4.3 Chọn phương thức vận chuyển
**UC:** UC07, UC08

| Trường | Giá trị |
|--------|---------|
| Method | `PUT` |
| Path | `/api/checkout/shipping-method` |
| Auth | `✅ Public` / `🔒 JWT` |
| Tag | **[INHERIT]** |

**Request Body:**
```json
{ "carrier_id": 1 }
```

**Odoo Logic:** `sale.order.carrier_id = delivery.carrier` → tính phí ship.

---

### 4.4 Xác nhận đặt hàng (Place Order)
**UC:** UC07, UC08 | **US:** US-009, US-010

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/checkout/confirm` |
| Auth | `✅ Public` / `🔒 JWT` |
| Tag | **[EXTEND]** |

**Request Body:**
```json
{
  "payment_method": "vnpay",
  "coolcash_amount": 0,
  "referral_code": "REF-XYZ123",
  "note": "Giao giờ hành chính"
}
```

**Response:**
```json
{
  "order_id": "SO00123",
  "order_uuid": "abc-123",
  "status": "confirmed",
  "payment_redirect_url": "https://sandbox.vnpayment.vn/paymentv2/...",
  "total_paid": 398000
}
```

> **EXTEND:**  
> - `coolcash_amount` — trừ CoolCash từ `partner.x_coolcash_balance` (UC11, FF-06)  
> - `referral_code` — validate và áp dụng referral discount (UC17, FF-08)  
> - `payment_redirect_url` — từ VNPay/MoMo/ZaloPay custom payment provider

**Odoo Logic:**  
1. `sale.order.action_confirm()` → state = sale  
2. Gọi payment provider API (nếu online payment)  
3. Nếu `coolcash_amount > 0`: gọi `coolcash.wallet.debit(partner, amount, order_ref)` — atomic  
4. Nếu `referral_code`: gọi `referral.code.apply(code, order)` — áp discount

---

## 5. Payment

**OCA Module:** `payment_vnpay` / `payment_momo` / `payment_zalopay` (App Store hoặc Custom)  
**Base URL:** `/api/payment`

### 5.1 Tạo link thanh toán VNPay
**UC:** UC10 | **US:** US-011

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/payment/vnpay/create` |
| Auth | `✅ Public` (order_uuid) |
| Tag | **[CUSTOM]** |

**Request Body:**
```json
{
  "order_uuid": "abc-123",
  "return_url": "https://store.example.com/order/success",
  "cancel_url": "https://store.example.com/order/cancel"
}
```

**Response:**
```json
{
  "payment_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=398000&...",
  "transaction_ref": "VNP20260526123456"
}
```

**Odoo Logic:** Tạo `payment.transaction` (state=draft) → gọi VNPay API để lấy redirect URL → trả URL cho Frontend.

---

### 5.2 Webhook VNPay callback
**UC:** UC10 | **US:** US-011

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/payment/vnpay/webhook` |
| Auth | `✅ Public` (HMAC signature verify) |
| Tag | **[CUSTOM]** |

**Request Body:** IPN từ VNPay (query params + HMAC-SHA512 signature)

**Odoo Logic:**  
1. Verify HMAC signature (idempotency: check `payment.transaction` by `vnp_TxnRef`)  
2. Nếu `vnp_ResponseCode == "00"`: `payment.transaction.action_done()` → confirm `sale.order`  
3. Trigger `sale.order.action_create_invoice()` (tự động)  
4. Trigger CoolCash earn automation (UC14)

---

### 5.3 Tạo link thanh toán MoMo
**UC:** UC10 | **US:** US-011 | **FF-13**

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/payment/momo/create` |
| Auth | `✅ Public` |
| Tag | **[CUSTOM]** |

> Tương tự VNPay, gọi MoMo API (`https://payment.momo.vn/v2/gateway/api/create`), HMAC-SHA256 signature.

---

### 5.4 Webhook MoMo / ZaloPay
**UC:** UC10

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/payment/momo/webhook` |
| Auth | `✅ Public` (signature verify) |
| Tag | **[CUSTOM]** |

---

### 5.5 Thanh toán COD
**UC:** UC09 | **US:** US-011

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/payment/cod/confirm` |
| Auth | `✅ Public` |
| Tag | **[INHERIT]** |

**Request Body:**
```json
{ "order_uuid": "abc-123" }
```

**Odoo Logic:** Set `payment.transaction` state = pending_cod, confirm `sale.order`. CoolCash earn chỉ trigger sau khi đơn được giao (delivery confirmed).

---

## 6. Orders

**OCA Module:** `shopinvader_sale`  
**Base URL:** `/api/orders`

### 6.1 Lấy danh sách đơn hàng
**UC:** UC18 | **US:** US-014

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/orders` |
| Auth | `🔒 JWT` |
| Tag | **[INHERIT]** |

**Query Params:** `?page=1&limit=10&status=delivered`

**Response:**
```json
{
  "total": 23,
  "items": [
    {
      "id": "SO00123",
      "date": "2026-05-26",
      "status": "delivered",
      "total": 398000,
      "items_count": 2
    }
  ]
}
```

---

### 6.2 Chi tiết đơn hàng
**UC:** UC18 | **US:** US-014

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/orders/{order_id}` |
| Auth | `🔒 JWT` |
| Tag | **[EXTEND]** |

**Response:**
```json
{
  "id": "SO00123",
  "status": "delivered",
  "tracking_number": "GHN123456789",
  "shipping_carrier": "GHN",
  "tracking_url": "https://tracking.ghn.dev/?order_code=GHN123456789",
  "lines": [...],
  "subtotal": 398000,
  "discount": 0,
  "coolcash_used": 0,
  "coolcash_earned": 28000,
  "total": 398000,
  "payment_method": "vnpay",
  "shipping_address": {...}
}
```

> **EXTEND:** `coolcash_used`, `coolcash_earned`, `tracking_url` (từ GHN/GHTK webhook).

---

### 6.3 Yêu cầu đổi/trả hàng
**UC:** UC19 | **US:** US-015

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/orders/{order_id}/return` |
| Auth | `🔒 JWT` |
| Tag | **[CUSTOM]** |

**Request Body:**
```json
{
  "reason": "Sai size",
  "items": [
    { "line_id": 1, "qty": 1 }
  ],
  "preferred_resolution": "exchange",
  "photos": ["base64_img_1"]
}
```

**Response:**
```json
{
  "return_id": "RET00045",
  "status": "pending_approval",
  "message": "Yêu cầu đã gửi. Chúng tôi xử lý trong 24 giờ."
}
```

**Odoo Logic:**  
1. Tạo `stock.return.picking` từ delivery picking  
2. CoolCash recovery: nếu đơn gốc đã dùng CoolCash → hoàn lại `coolcash.wallet.credit(partner, amount, "return")` (UC19)  
3. CoolCash earned: nếu đã tích lũy từ đơn này → trừ lại khi return

---

## 7. CoolCash

**OCA Module:** Custom — `coolcash` module (extends `loyalty.program`)  
**Base URL:** `/api/coolcash`

### 7.1 Xem số dư CoolCash
**UC:** UC11, UC14 | **US:** US-012, US-013 | **FF-06**

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/coolcash/balance` |
| Auth | `🔒 JWT` |
| Tag | **[CUSTOM]** |

**Response:**
```json
{
  "balance": 56000,
  "pending": 14000,
  "currency": "CoolCash",
  "exchange_rate": "1 CoolCash = 1 VNĐ",
  "history": [
    {
      "id": 1,
      "date": "2026-05-20",
      "type": "earn",
      "amount": 28000,
      "description": "Mua hàng SO00120",
      "order_id": "SO00120"
    }
  ]
}
```

**Odoo Logic:** Read `coolcash.wallet` record của `res.partner` (custom model). `pending` = CoolCash từ COD/đang giao.

---

### 7.2 Lịch sử CoolCash
| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/coolcash/history` |
| Auth | `🔒 JWT` |
| Tag | **[CUSTOM]** |

**Query Params:** `?page=1&limit=20&type=earn` (earn | spend | expire | refund)

---

### 7.3 Tích lũy CoolCash (Internal — triggered by system)
**UC:** UC14 | **FF-06** | **FF-07**

> **Note:** Không expose endpoint này trực tiếp cho Frontend. Được trigger nội bộ bởi Odoo automation rule sau khi đơn giao thành công.

**Odoo Logic:**  
1. `sale.order` state → `done` (delivery confirmed)  
2. Automation Rule: `coolcash.wallet.credit(partner, order.amount_total * earn_rate)`  
3. `earn_rate` lấy từ `res.config.settings.x_coolcash_earn_rate`  
4. Nếu FF-07 (Expiry) bật: set `expiry_date = today + 365 days`

---

### 7.4 Validate số CoolCash muốn dùng
**UC:** UC11 | **US:** US-012

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/coolcash/validate-spend` |
| Auth | `🔒 JWT` |
| Tag | **[CUSTOM]** |

**Request Body:**
```json
{
  "order_uuid": "abc-123",
  "coolcash_amount": 50000
}
```

**Response:**
```json
{
  "valid": true,
  "max_applicable": 50000,
  "remaining_to_pay": 348000,
  "warning": null
}
```

**Odoo Logic:** Check `partner.coolcash_balance >= coolcash_amount`, check max % order total từ config (FF-06).

---

## 8. CoolClub

**OCA Module:** Custom — `coolclub` module (extends `loyalty.card`)  
**Base URL:** `/api/coolclub`

### 8.1 Lấy thông tin hạng thành viên
**UC:** UC15 | **US:** US-018, US-019 | **FF-09**

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/coolclub/membership` |
| Auth | `🔒 JWT` |
| Tag | **[CUSTOM]** |

**Response:**
```json
{
  "current_tier": "Silver",
  "cumulative_spend": 2850000,
  "next_tier": "Gold",
  "spend_to_next_tier": 150000,
  "tier_benefits": [
    "Hoàn 7% CoolCash cho mọi đơn hàng",
    "Miễn phí vận chuyển đơn từ 200.000đ",
    "Ưu tiên customer support"
  ],
  "tier_expiry_date": "2027-12-31",
  "tier_history": [...]
}
```

**Tier thresholds** (từ `res.config.settings`):
- Bronze: 0 – 999.999đ
- Silver: 1.000.000 – 2.999.999đ  
- Gold: 3.000.000 – 9.999.999đ
- Diamond: ≥ 10.000.000đ

**Odoo Logic:** Read `coolclub.membership` record linked to `res.partner`.

---

### 8.2 Nâng hạng CoolClub (Internal — triggered by system)
**UC:** UC15 | **FF-09**

> **Note:** Automation rule, không expose cho Frontend. Odoo cron + ir.automation.rule trigger khi `cumulative_spend` vượt threshold.

**Odoo Logic:**
1. Scheduled action (daily): quét `res.partner` có `coolclub.membership.cumulative_spend` thay đổi  
2. So sánh với tier thresholds (từ config)  
3. Nếu đủ điều kiện nâng hạng → update `coolclub.membership.tier_id`  
4. Gửi notification email/push (via `mail.template` + `firebase_push`)  
5. Nếu FF-10 (tier downgrade): cron hàng năm kiểm tra spending 12 tháng → downgrade nếu không duy trì

---

### 8.3 Lấy danh sách ưu đãi theo tier
| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/coolclub/benefits` |
| Auth | `🔒 JWT` |
| Tag | **[CUSTOM]** |

**Response:**
```json
{
  "tier": "Silver",
  "benefits": {
    "coolcash_earn_rate": 0.07,
    "free_shipping_threshold": 200000,
    "birthday_bonus": 50000,
    "early_access": true
  }
}
```

---

## 9. Referral

**OCA Module:** Custom — `referral` module  
**Base URL:** `/api/referral`

### 9.1 Lấy Referral Code của Member
**UC:** UC16 | **US:** US-020 | **FF-08**

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/referral/my-code` |
| Auth | `🔒 JWT` |
| Tag | **[CUSTOM]** |

**Response:**
```json
{
  "code": "REF-AB12CD",
  "share_url": "https://store.example.com/?ref=REF-AB12CD",
  "stats": {
    "total_referred": 5,
    "total_earned_coolcash": 250000
  }
}
```

**Odoo Logic:** Lấy/tạo `referral.code` record của partner. Code format: `REF-` + 6 ký tự uppercase alphanumeric.

---

### 9.2 Validate Referral Code (khi nhập ở Checkout)
**UC:** UC17 | **US:** US-021

| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/referral/validate` |
| Auth | `✅ Public` |
| Tag | **[CUSTOM]** |

**Request Body:**
```json
{ "code": "REF-AB12CD" }
```

**Response:**
```json
{
  "valid": true,
  "discount_amount": 50000,
  "discount_type": "fixed",
  "message": "Bạn được giảm 50.000đ cho đơn hàng đầu tiên!"
}
```

**Odoo Logic:**  
1. Check `referral.code` tồn tại và active  
2. Check referrer ≠ current customer (prevent self-referral)  
3. Check customer chưa từng mua (first-order only, FF-08)

---

### 9.3 Áp dụng Referral Reward (Internal — triggered after order confirmation)
**UC:** UC16, UC17 | **FF-08**

> **Note:** Trigger nội bộ sau khi đơn hàng đầu tiên của người được giới thiệu được confirm.

**Odoo Logic:**
1. `sale.order.action_confirm()` → check `sale.order.x_referral_code`  
2. Tạo `referral.reward.log` record  
3. Credit CoolCash cho referrer: `coolcash.wallet.credit(referrer_partner, reward_amount)`  
4. Apply discount cho new customer order (nếu chưa apply)

---

## 10. Account

**OCA Module:** `shopinvader_partner`  
**Base URL:** `/api/account`

### 10.1 Lấy thông tin profile
**UC:** UC12 | **US:** US-016

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/account/profile` |
| Auth | `🔒 JWT` |
| Tag | **[EXTEND]** |

**Response:**
```json
{
  "id": 42,
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0901234567",
  "gender_title": "anh",
  "birth_date": "1990-01-15",
  "coolcash_balance": 56000,
  "coolclub_tier": "Silver"
}
```

> **EXTEND:** `gender_title` (FF-20), `coolcash_balance`, `coolclub_tier`.

---

### 10.2 Cập nhật profile
| Trường | Giá trị |
|--------|---------|
| Method | `PUT` |
| Path | `/api/account/profile` |
| Auth | `🔒 JWT` |
| Tag | **[EXTEND]** |

**Request Body:**
```json
{
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "gender_title": "anh",
  "birth_date": "1990-01-15"
}
```

---

### 10.3 Quản lý địa chỉ
| Trường | Giá trị |
|--------|---------|
| Method | `GET` | `POST` | `PUT` | `DELETE` |
| Path | `/api/account/addresses` |
| Auth | `🔒 JWT` |
| Tag | **[INHERIT]** |

**Odoo Logic:** CRUD `res.partner` (type=delivery) linked to customer partner.

---

## 11. Wishlist

**OCA Module:** `shopinvader_wishlist`  
**Base URL:** `/api/wishlist`

### 11.1 Lấy Wishlist
**UC:** UC20 | **US:** US-028

| Trường | Giá trị |
|--------|---------|
| Method | `GET` |
| Path | `/api/wishlist` |
| Auth | `🔒 JWT` |
| Tag | **[INHERIT]** |

---

### 11.2 Thêm vào Wishlist
| Trường | Giá trị |
|--------|---------|
| Method | `POST` |
| Path | `/api/wishlist/items` |
| Auth | `🔒 JWT` |
| Tag | **[INHERIT]** |

**Request Body:**
```json
{ "product_id": 201 }
```

---

### 11.3 Xóa khỏi Wishlist
| Trường | Giá trị |
|--------|---------|
| Method | `DELETE` |
| Path | `/api/wishlist/items/{product_id}` |
| Auth | `🔒 JWT` |
| Tag | **[INHERIT]** |

---

## Tổng hợp: INHERIT vs CUSTOM vs EXTEND

### [INHERIT] — Dùng nguyên từ ShopInvader/OCA (cài module, config nhỏ)

| Endpoint | Module OCA |
|----------|-----------|
| `POST /api/auth/login` | `shopinvader_auth_api_key` + `fastapi_auth_partner_jwt` |
| `POST /api/auth/register` (base) | `shopinvader_auth_api_key` |
| `POST /api/auth/social/{provider}` | `auth_oauth` |
| `POST /api/auth/refresh` | `fastapi_auth_partner_jwt` |
| `POST /api/auth/logout` | `fastapi_auth_partner_jwt` |
| `GET /api/catalog/categories` | `shopinvader_category` |
| `POST /api/cart/items` | `shopinvader_cart` |
| `PATCH /api/cart/items/{id}` | `shopinvader_cart` |
| `DELETE /api/cart/items/{id}` | `shopinvader_cart` |
| `POST /api/cart/coupon` | `shopinvader_sale` + `sale.coupon` |
| `DELETE /api/cart/coupon/{code}` | `shopinvader_sale` |
| `POST /api/cart/merge` | `shopinvader_cart` |
| `PUT /api/checkout/shipping-method` | `shopinvader_delivery` |
| `POST /api/payment/cod/confirm` | `shopinvader_sale` |
| `GET /api/orders` | `shopinvader_sale` |
| `GET /api/account/addresses` | `shopinvader_partner` |
| `GET /api/wishlist` | `shopinvader_wishlist` |
| `POST /api/wishlist/items` | `shopinvader_wishlist` |
| `DELETE /api/wishlist/items/{id}` | `shopinvader_wishlist` |

**Tổng INHERIT: ~19 endpoints (~38%)**

---

### [EXTEND] — Kế thừa ShopInvader, override/extend thêm trường tùy biến

| Endpoint | Trường CUSTOM thêm vào |
|----------|------------------------|
| `POST /api/auth/register` | `gender_title` (FF-20) |
| `GET /api/catalog/products` | filter `gender`, sort `best_seller` |
| `GET /api/catalog/products/{slug}` | `coolcash_estimate`, `in_stock` per variant, `specs` |
| `GET /api/cart` | `coolcash_earnable`, `free_gifts`, `free_shipping_threshold` |
| `GET /api/checkout` | `coolcash_balance`, `referral_discount_pending`, shipping methods |
| `PUT /api/checkout/shipping-address` | `gender_title` (FF-20), `alternate_receiver` (FF-19) |
| `POST /api/checkout/confirm` | `coolcash_amount`, `referral_code` |
| `GET /api/orders/{id}` | `coolcash_used`, `coolcash_earned`, `tracking_url` |
| `GET /api/account/profile` | `gender_title`, `coolcash_balance`, `coolclub_tier` |
| `PUT /api/account/profile` | `gender_title`, `birth_date` |

**Tổng EXTEND: ~10 endpoints (~20%)**

---

### [CUSTOM] — Viết mới hoàn toàn trên OCA `fastapi`

| Endpoint | Custom Module |
|----------|--------------|
| `POST /api/auth/zalo` | `fastapi_auth_zalo` |
| `POST /api/payment/vnpay/create` | `payment_vnpay` |
| `POST /api/payment/vnpay/webhook` | `payment_vnpay` |
| `POST /api/payment/momo/create` | `payment_momo` |
| `POST /api/payment/momo/webhook` | `payment_momo` |
| `POST /api/payment/zalopay/create` | `payment_zalopay` |
| `POST /api/payment/zalopay/webhook` | `payment_zalopay` |
| `POST /api/orders/{id}/return` | `sale_return_api` |
| `GET /api/coolcash/balance` | `coolcash` |
| `GET /api/coolcash/history` | `coolcash` |
| `POST /api/coolcash/validate-spend` | `coolcash` |
| `GET /api/coolclub/membership` | `coolclub` |
| `GET /api/coolclub/benefits` | `coolclub` |
| `GET /api/referral/my-code` | `referral` |
| `POST /api/referral/validate` | `referral` |

**Tổng CUSTOM: ~15 endpoints (~30%)**

---

### Internal Triggers (không expose API — Odoo Automation / Cron)

| Trigger | Logic | Module |
|---------|-------|--------|
| Order delivered → CoolCash earn | `coolcash.wallet.credit()` | `coolcash` |
| CoolClub tier upgrade check | Daily cron, threshold compare | `coolclub` |
| CoolClub tier downgrade check | Annual cron, 12-month spend | `coolclub` |
| Referral reward after first order | `sale.order` confirm hook | `referral` |
| CoolCash expiry (FF-07) | Daily cron, expiry_date check | `coolcash` |
| GHN/GHTK tracking webhook | Update `stock.picking.tracking_number` | `delivery_ghn` / `delivery_ghtk` |

---

## Danh sách Custom Odoo Modules cần phát triển

| Module | Mô tả | Priority |
|--------|-------|---------|
| `coolcash` | Wallet model, earn/spend/refund logic, API endpoints | **Must Have** |
| `coolclub` | Tier model, threshold config, automation rules, API | **Must Have** |
| `referral` | Code generation, validation, reward trigger, API | **Should Have** |
| `payment_vnpay` | VNPay payment provider + webhook handler | **Must Have** |
| `payment_momo` | MoMo payment provider + webhook handler | **Should Have** |
| `payment_zalopay` | ZaloPay payment provider + webhook handler | **Should Have** |
| `fastapi_auth_zalo` | Zalo OAuth2 login via OA API | **Nice to Have** |
| `delivery_ghn` | GHN shipping carrier + tracking webhook | **Should Have** |
| `delivery_ghtk` | GHTK shipping carrier + tracking webhook | **Should Have** |
| `sale_return_api` | Return/Refund API endpoint + stock return flow | **Should Have** |
| `fashion_store_config` | Feature flags (FF-01 đến FF-20) trong `res.config.settings` | **Must Have** |
| `fashion_store_product` | Custom fields: `x_gender_type`, `x_material`, `x_technology`, `x_care_instruction` trên `product.template` | **Must Have** |
| `fashion_store_sale` | Custom fields: `x_gender_title`, `x_alternate_receiver_*` trên `sale.order` | **Must Have** |

---

## OCA Modules cần cài đặt

| Module | Repository | Mô tả |
|--------|-----------|-------|
| `fastapi` | OCA/rest-framework | FastAPI framework cho Odoo |
| `fastapi_auth_jwt` | OCA/rest-framework | JWT encoding/decoding |
| `fastapi_auth_partner_jwt` | OCA/rest-framework | Map JWT → `res.partner` |
| `shopinvader` | shopinvader/shopinvader | Headless eCommerce base |
| `shopinvader_product` | shopinvader/shopinvader | Product catalog API |
| `shopinvader_cart` | shopinvader/shopinvader | Cart management API |
| `shopinvader_sale` | shopinvader/shopinvader | Order / Checkout API |
| `shopinvader_partner` | shopinvader/shopinvader | Account management API |
| `shopinvader_wishlist` | shopinvader/shopinvader | Wishlist API |
| `shopinvader_delivery` | shopinvader/shopinvader | Shipping method selection |
| `auth_oauth` | OCA/server-auth | OAuth2 Social Login |

---

## Traceability Matrix

| UC | US | API Endpoint(s) | Tag |
|----|----|-----------------|-----|
| UC01 | US-001, US-003 | `GET /api/catalog/categories`, `GET /api/catalog/products` | INHERIT, EXTEND |
| UC02 | US-002, US-004 | `GET /api/catalog/products/{slug}` | EXTEND |
| UC03 | US-005 | `POST /api/cart/items` | INHERIT |
| UC04 | US-006 | `PATCH/DELETE /api/cart/items/{id}` | INHERIT |
| UC05 | US-007 | Auto-applied on `POST /api/cart/items` | INHERIT |
| UC06 | US-007 | `POST/DELETE /api/cart/coupon` | INHERIT |
| UC07 | US-009 | `GET /api/checkout`, `PUT /api/checkout/shipping-address`, `POST /api/checkout/confirm` | EXTEND |
| UC08 | US-010 | Same as UC07 + `POST /api/cart/merge` | EXTEND, INHERIT |
| UC09 | US-011 | `POST /api/payment/cod/confirm` | INHERIT |
| UC10 | US-011 | `POST /api/payment/vnpay/create`, `POST /api/payment/vnpay/webhook` | CUSTOM |
| UC11 | US-012 | `POST /api/coolcash/validate-spend`, `POST /api/checkout/confirm` (coolcash_amount) | CUSTOM, EXTEND |
| UC12 | US-016 | `POST /api/auth/register`, `GET/PUT /api/account/profile` | EXTEND |
| UC13 | US-017 | `POST /api/auth/social/{provider}`, `POST /api/auth/zalo` | INHERIT, CUSTOM |
| UC14 | US-013 | Internal automation (no direct API) | CUSTOM (automation) |
| UC15 | US-018, US-019 | `GET /api/coolclub/membership`, Internal cron | CUSTOM |
| UC16 | US-020 | `GET /api/referral/my-code` | CUSTOM |
| UC17 | US-021 | `POST /api/referral/validate`, `POST /api/checkout/confirm` (referral_code) | CUSTOM, EXTEND |
| UC18 | US-014 | `GET /api/orders`, `GET /api/orders/{id}` | INHERIT, EXTEND |
| UC19 | US-015 | `POST /api/orders/{id}/return` | CUSTOM |
| UC20 | US-028 | `GET/POST/DELETE /api/wishlist` | INHERIT |

---

*API Mapping v1.0 — Fashion Store eCommerce Headless Platform*  
*Odoo v19 + OCA fastapi + ShopInvader + Custom Modules*

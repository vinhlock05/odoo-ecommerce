/**
 * FashionOS API client.
 *
 * Server-side functions (SSR / RSC): use ODOO_INTERNAL_URL when available so
 * requests stay on the Docker network.
 *
 * Client-side functions (browser): always use NEXT_PUBLIC_ODOO_URL so requests
 * go to the public-facing Odoo instance.
 */

// Server-side base (can be Docker-internal URL)
const ODOO_SERVER_URL =
  process.env.ODOO_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_ODOO_URL ??
  'http://localhost:8069'

const API_SERVER = `${ODOO_SERVER_URL}/fashionos/api/v1`
// Browser requests go to /api/odoo/* (proxied by Next.js rewrite)
const API_CLIENT =
  typeof window !== 'undefined'
    ? '/api/odoo'
    : `${ODOO_SERVER_URL}/fashionos/api/v1`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AttributeValue {
  id: number
  name: string
  html_color: string | null
}

export interface Attribute {
  id: number
  name: string
  display_type: string
  values: AttributeValue[]
}

export interface Variant {
  id: number
  name: string
  default_code: string
  price: number
  attributes: { attribute: string; value: string; html_color?: string | null }[]
  active?: boolean
}

export interface Product {
  id: number
  name: string
  slug: string
  price: number
  compare_price?: number   // original price when on sale
  currency: string
  category: string | null
  description: string
  variant_count: number
  variants: Variant[]
  image_url: string
  is_new?: boolean         // recently published (backend flag)
}

export interface ProductDetail extends Product {
  description_full: string
  attributes: Attribute[]
  images: string[]
}

export interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ProductsResponse {
  success: boolean
  data: Product[]
  meta: Pagination
}

export interface ProductDetailResponse {
  success: boolean
  data: ProductDetail
}

// Auth

export interface LoginResponse {
  success: boolean
  data: {
    token: string
    partner_id: number
    name: string
    email: string
  }
}

export interface UserProfile {
  id: number
  name: string
  email: string
  phone: string
  gender_title: string
  phone_verified: boolean
  zalo_id: string
}

export interface MeResponse {
  success: boolean
  data: UserProfile
}

// Cart

export interface CartItem {
  id: number
  product_id: number
  product_name: string
  variant_name: string
  default_code: string
  quantity: number
  price_unit: number
  price_subtotal: number
  image_url: string
}

export interface FreeShippingProgress {
  threshold: number
  subtotal: number
  remaining: number
  unlocked: boolean
}

export interface CoolCashApplied {
  amount: number
  is_applied: boolean
}

export interface Cart {
  id: number
  partner_id: number
  currency: string
  items: CartItem[]
  item_count: number
  subtotal: number
  subtotal_after_coolcash: number
  coolcash_applied: CoolCashApplied
  free_shipping_progress: FreeShippingProgress
}

export interface CartResponse {
  success: boolean
  data: Cart
  error?: { code: string; message: string }
}

// Account / Addresses

export interface Address {
  id: number
  type: string
  name: string
  street: string
  street2: string
  city: string
  zip: string
  country_code: string
  country_name: string
  phone: string
}

export interface AddressesResponse {
  success: boolean
  data: Address[]
  error?: { code: string; message: string }
}

export interface AddressResponse {
  success: boolean
  data: Address
  error?: { code: string; message: string }
}

// Checkout

export interface CheckoutOrder {
  order_id: number
  order_name: string
  amount_total: number
  amount_untaxed: number
  amount_tax: number
  state: string
  partner_shipping_id: number
  coolcash_earned: number
  coolcash_redeemed: number
  new_coolcash_balance: number
  loyalty_tier: string
}

export interface CheckoutResponse {
  success: boolean
  data: CheckoutOrder
  error?: { code: string; message: string }
}

// ---------------------------------------------------------------------------
// Server-side fetch (Next.js ISR)
// ---------------------------------------------------------------------------

async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_SERVER}${path}`
  const res = await fetch(url, {
    next: { revalidate: 60 },
    ...options,
  })

  if (!res.ok) {
    throw new Error(`FashionOS API ${res.status}: ${url}`)
  }

  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Client-side fetch (browser, with optional JWT)
// ---------------------------------------------------------------------------

async function clientFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const url = `${API_CLIENT}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })
  const json = (await res.json()) as T

  // Token expired or invalid — clear auth and redirect to login
  if (res.status === 401 && token) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fashionos_token')
      localStorage.removeItem('fashionos_user')
      window.location.href = `/login?session=expired`
    }
  }

  return json
}

// ---------------------------------------------------------------------------
// Server-side API (RSC / getServerSideProps)
// ---------------------------------------------------------------------------

export type SortBy = 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'

export async function getProducts(params?: {
  limit?: number
  page?: number
  category_id?: number
  search?: string
  sort_by?: SortBy
  min_price?: number
  max_price?: number
}): Promise<ProductsResponse> {
  const qs = new URLSearchParams()
  if (params?.limit)       qs.set('limit', String(params.limit))
  if (params?.page)        qs.set('page', String(params.page))
  if (params?.category_id) qs.set('category_id', String(params.category_id))
  if (params?.search)      qs.set('search', params.search)
  if (params?.sort_by)     qs.set('sort_by', params.sort_by)
  if (params?.min_price != null) qs.set('min_price', String(params.min_price))
  if (params?.max_price != null) qs.set('max_price', String(params.max_price))

  const query = qs.toString() ? `?${qs}` : ''
  const res = await serverFetch<any>(`/catalog/products${query}`)
  if (res && res.success && Array.isArray(res.data)) {
    res.data = res.data.map((p: any) => ({
      ...p,
      price: p.price ?? p.list_price ?? 0,
      compare_price: p.compare_price ?? p.compare_at_price ?? undefined,
      currency: p.currency_id ?? 'VND',
      category: p.category ?? p.categ_name ?? null,
      is_new: p.is_new ?? undefined,
      variants: (p.variants ?? []).map((v: any) => ({
        id: v.id,
        name: v.name ?? '',
        default_code: v.default_code ?? '',
        price: v.price ?? v.lst_price ?? 0,
        attributes: v.attributes ?? v.attribute_values ?? [],
      })),
    }))
  }
  return res as ProductsResponse
}

export async function getProduct(id: number): Promise<ProductDetailResponse> {
  const res = await serverFetch<any>(`/catalog/products/${id}`)
  if (res && res.success && res.data) {
    const p = res.data
    res.data = {
      ...p,
      price: p.price ?? p.list_price ?? 0,
      compare_price: p.compare_price ?? p.compare_at_price ?? undefined,
      currency: p.currency_id ?? 'VND',
      category: p.category ?? p.categ_name ?? null,
      is_new: p.is_new ?? undefined,
      variants: (p.variants ?? []).map((v: any) => ({
        id: v.id,
        name: v.name ?? '',
        default_code: v.default_code ?? '',
        price: v.price ?? v.lst_price ?? 0,
        attributes: v.attributes ?? v.attribute_values ?? [],
      })),
    }
  }
  return res as ProductDetailResponse
}

export async function healthCheck(): Promise<{ status: string }> {
  return serverFetch<{ status: string }>('/health')
}

// ---------------------------------------------------------------------------
// Client-side Auth API
// ---------------------------------------------------------------------------

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  return clientFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function registerUser(data: {
  name: string
  email: string
  password: string
  phone?: string
  gender_title?: string
}): Promise<LoginResponse> {
  return clientFetch<LoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getMe(token: string): Promise<MeResponse> {
  return clientFetch<MeResponse>('/auth/me', { method: 'GET' }, token)
}

export async function logoutUser(token?: string): Promise<void> {
  await clientFetch('/auth/logout', { method: 'POST' }, token)
}

// ---------------------------------------------------------------------------
// Client-side Cart API
// ---------------------------------------------------------------------------

export async function fetchCart(token: string): Promise<CartResponse> {
  return clientFetch<CartResponse>('/cart', { method: 'GET' }, token)
}

export async function addToCart(
  token: string,
  productId: number,
  quantity = 1,
): Promise<CartResponse> {
  return clientFetch<CartResponse>(
    '/cart/items',
    { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) },
    token,
  )
}

export async function updateCartItem(
  token: string,
  lineId: number,
  quantity: number,
): Promise<CartResponse> {
  return clientFetch<CartResponse>(
    `/cart/items/${lineId}`,
    { method: 'PUT', body: JSON.stringify({ quantity }) },
    token,
  )
}

export async function removeCartItem(
  token: string,
  lineId: number,
): Promise<CartResponse> {
  return clientFetch<CartResponse>(
    `/cart/items/${lineId}`,
    { method: 'DELETE' },
    token,
  )
}

export async function clearCart(token: string): Promise<CartResponse> {
  return clientFetch<CartResponse>('/cart', { method: 'DELETE' }, token)
}

// ---------------------------------------------------------------------------
// Client-side Account / Address API
// ---------------------------------------------------------------------------

export async function getAddresses(token: string): Promise<AddressesResponse> {
  return clientFetch<AddressesResponse>('/account/addresses', { method: 'GET' }, token)
}

export async function createAddress(
  token: string,
  data: {
    name: string
    phone: string
    street: string
    city: string
    type?: string
    street2?: string
    zip?: string
    country_code?: string
  },
): Promise<AddressResponse> {
  return clientFetch<AddressResponse>(
    '/account/addresses',
    { method: 'POST', body: JSON.stringify({ type: 'delivery', ...data }) },
    token,
  )
}

export async function updateAddress(
  token: string,
  addrId: number,
  data: {
    name?: string
    phone?: string
    street?: string
    city?: string
    street2?: string
    zip?: string
  },
): Promise<AddressResponse> {
  return clientFetch<AddressResponse>(
    `/account/addresses/${addrId}`,
    { method: 'PUT', body: JSON.stringify(data) },
    token,
  )
}

export async function deleteAddress(
  token: string,
  addrId: number,
): Promise<{ success: boolean; error?: { code: string; message: string } }> {
  return clientFetch(
    `/account/addresses/${addrId}`,
    { method: 'DELETE' },
    token,
  )
}

export async function updateProfile(
  token: string,
  data: {
    name?: string
    phone?: string
    gender_title?: 'anh' | 'chi' | ''
  },
): Promise<MeResponse> {
  return clientFetch<MeResponse>(
    '/account/profile',
    { method: 'PUT', body: JSON.stringify(data) },
    token,
  )
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface OrderLine {
  id: number
  product_id: number
  product_name: string
  variant_name: string
  default_code: string
  quantity: number
  price_unit: number
  price_subtotal: number
  image_url: string
}

export interface OrderSummary {
  id: number
  name: string
  date_order: string
  state: string
  state_label: string
  amount_total: number
  item_count: number
  coolcash_redeemed: number
  coolcash_earned: number
}

export interface Order extends OrderSummary {
  amount_untaxed: number
  amount_tax: number
  note: string
  gender_title: string
  alt_receiver_name: string
  alt_receiver_phone: string
  referral_code: string
  shipping_address: {
    id: number
    name: string
    street: string
    street2: string
    city: string
    zip: string
    phone: string
  }
  lines: OrderLine[]
}

export interface OrdersResponse {
  success: boolean
  data: OrderSummary[]
  meta?: Pagination
  error?: { code: string; message: string }
}

export interface OrderResponse {
  success: boolean
  data: Order
  error?: { code: string; message: string }
}

// ---------------------------------------------------------------------------
// Loyalty
// ---------------------------------------------------------------------------

export interface NextTier {
  tier: string
  threshold: number
  progress_pct: number
  spend_remaining: number
}

export interface LoyaltyStatus {
  coolcash_balance: number
  tier: string
  tier_label: string
  lifetime_spend: number
  next_tier: NextTier | null
}

export interface LoyaltyTransaction {
  id: number
  type: 'earn' | 'redeem' | 'expire' | 'adjustment'
  amount: number
  balance_after: number
  description: string
  date: string
  order_id: number | null
  order_name: string | null
}

export interface LoyaltyStatusResponse {
  success: boolean
  data: LoyaltyStatus
  error?: { code: string; message: string }
}

export interface LoyaltyHistoryResponse {
  success: boolean
  data: LoyaltyTransaction[]
  meta?: Pagination
  error?: { code: string; message: string }
}

// ---------------------------------------------------------------------------
// Client-side Checkout API
// ---------------------------------------------------------------------------

export async function checkoutCart(
  token: string,
  data: {
    delivery_address_id: number
    note?: string
    gender_title?: 'anh' | 'chi'
    alt_receiver_name?: string
    alt_receiver_phone?: string
    referral_code?: string
  },
): Promise<CheckoutResponse> {
  return clientFetch<CheckoutResponse>(
    '/cart/checkout',
    { method: 'POST', body: JSON.stringify(data) },
    token,
  )
}

// ---------------------------------------------------------------------------
// Client-side Orders API
// ---------------------------------------------------------------------------

export async function getOrders(
  token: string,
  params?: { page?: number; limit?: number },
): Promise<OrdersResponse> {
  const qs = new URLSearchParams()
  if (params?.page)  qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString() ? `?${qs}` : ''
  return clientFetch<OrdersResponse>(`/account/orders${query}`, { method: 'GET' }, token)
}

export async function getOrder(token: string, orderId: number): Promise<OrderResponse> {
  return clientFetch<OrderResponse>(`/account/orders/${orderId}`, { method: 'GET' }, token)
}

// ---------------------------------------------------------------------------
// Client-side Loyalty API
// ---------------------------------------------------------------------------

export async function getLoyalty(token: string): Promise<LoyaltyStatusResponse> {
  return clientFetch<LoyaltyStatusResponse>('/account/loyalty', { method: 'GET' }, token)
}

export async function getLoyaltyHistory(
  token: string,
  params?: { page?: number; limit?: number },
): Promise<LoyaltyHistoryResponse> {
  const qs = new URLSearchParams()
  if (params?.page)  qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString() ? `?${qs}` : ''
  return clientFetch<LoyaltyHistoryResponse>(`/account/loyalty/history${query}`, { method: 'GET' }, token)
}

// ---------------------------------------------------------------------------
// Client-side Payment API
// ---------------------------------------------------------------------------

export interface VnpayCreateResponse {
  success: boolean
  data?: {
    payment_url: string
    transaction_id: number
    txn_ref: string
    order_id: number
    order_name: string
    amount: number
  }
  error?: { code: string; message: string }
}

export interface VnpayReturnResponse {
  success: boolean
  data: {
    success: boolean
    txn_ref: string
    order_id: number | null
    order_name?: string
    amount?: number
    message: string
  }
  error?: { code: string; message: string }
}

export async function createVnpayPayment(
  token: string,
  orderId: number,
): Promise<VnpayCreateResponse> {
  return clientFetch<VnpayCreateResponse>(
    '/payment/vnpay/create',
    { method: 'POST', body: JSON.stringify({ order_id: orderId }) },
    token,
  )
}

export async function verifyVnpayReturn(
  params: Record<string, string>,
): Promise<VnpayReturnResponse> {
  const qs = new URLSearchParams(params).toString()
  return clientFetch<VnpayReturnResponse>(`/payment/vnpay/return?${qs}`, { method: 'GET' })
}

// ---------------------------------------------------------------------------
// Client-side Returns API
// ---------------------------------------------------------------------------

export interface ReturnLine {
  id: number
  product_name: string
  return_qty: number
  price_unit: number
  subtotal: number
}

export interface ReturnSummary {
  id: number
  name: string
  order_id: number
  order_name: string
  state: string
  reason: string
  note: string
  refund_amount: number
  refund_method: string
  create_date: string
  lines: ReturnLine[]
}

export interface ReturnsResponse {
  success: boolean
  data: ReturnSummary[]
  meta?: Pagination
  error?: { code: string; message: string }
}

export interface ReturnResponse {
  success: boolean
  data: ReturnSummary
  error?: { code: string; message: string }
}

export async function getReturns(
  token: string,
  params?: { page?: number; limit?: number },
): Promise<ReturnsResponse> {
  const qs = new URLSearchParams()
  if (params?.page)  qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString() ? `?${qs}` : ''
  return clientFetch<ReturnsResponse>(`/account/returns${query}`, { method: 'GET' }, token)
}

export async function getReturn(token: string, returnId: number): Promise<ReturnResponse> {
  return clientFetch<ReturnResponse>(`/account/returns/${returnId}`, { method: 'GET' }, token)
}

export async function createReturn(
  token: string,
  data: {
    order_id: number
    reason: string
    note?: string
    refund_method?: 'coolcash' | 'bank'
    lines: { order_line_id: number; return_qty: number }[]
  },
): Promise<ReturnResponse> {
  return clientFetch<ReturnResponse>(
    '/account/returns',
    { method: 'POST', body: JSON.stringify(data) },
    token,
  )
}

// ---------------------------------------------------------------------------
// Client-side Referral API
// ---------------------------------------------------------------------------

export interface ReferralStatus {
  code: string
  is_active: boolean
  total_referred: number
  total_earned_coolcash: number
}

export interface ReferralStatusResponse {
  success: boolean
  data: ReferralStatus
  error?: { code: string; message: string }
}

export async function getReferral(token: string): Promise<ReferralStatusResponse> {
  return clientFetch<ReferralStatusResponse>('/account/referral', { method: 'GET' }, token)
}

export async function applyCoolCash(
  token: string,
  amount: number,
): Promise<CartResponse> {
  return clientFetch<CartResponse>(
    '/cart/apply-coolcash',
    { method: 'POST', body: JSON.stringify({ amount }) },
    token,
  )
}

export async function removeCoolCash(token: string): Promise<{ success: boolean }> {
  return clientFetch<{ success: boolean }>(
    '/cart/apply-coolcash',
    { method: 'DELETE' },
    token,
  )
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

export function formatPrice(price: number, currency = 'VND'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)
}

export function imageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_ODOO_URL ?? 'http://localhost:8069'}${path}`
}

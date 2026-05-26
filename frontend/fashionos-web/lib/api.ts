const ODOO_URL = process.env.ODOO_INTERNAL_URL
  ?? process.env.NEXT_PUBLIC_ODOO_URL
  ?? 'http://localhost:8069'

const API_BASE = `${ODOO_URL}/fashionos/api/v1`

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

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
  attributes: { attribute: string; value: string }[]
  active?: boolean
}

export interface Product {
  id: number
  name: string
  slug: string
  price: number
  currency: string
  category: string | null
  description: string
  variant_count: number
  variants: Variant[]
  image_url: string
}

export interface ProductDetail extends Product {
  description_full: string
  attributes: Attribute[]
  images: string[]
}

export interface Pagination {
  total: number
  limit: number
  offset: number
  has_next: boolean
}

export interface ProductsResponse {
  success: boolean
  data: Product[]
  pagination: Pagination
}

export interface ProductDetailResponse {
  success: boolean
  data: ProductDetail
}

// -----------------------------------------------------------------------
// API Client
// -----------------------------------------------------------------------

async function apiFetch<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    next: { revalidate: 60 }, // ISR — revalidate every 60s
  })

  if (!res.ok) {
    throw new Error(`FashionOS API error ${res.status}: ${url}`)
  }

  return res.json() as Promise<T>
}

export async function getProducts(params?: {
  limit?: number
  offset?: number
  category_id?: number
}): Promise<ProductsResponse> {
  const qs = new URLSearchParams()
  if (params?.limit)       qs.set('limit', String(params.limit))
  if (params?.offset)      qs.set('offset', String(params.offset))
  if (params?.category_id) qs.set('category_id', String(params.category_id))

  const query = qs.toString() ? `?${qs}` : ''
  return apiFetch<ProductsResponse>(`/products${query}`)
}

export async function getProduct(id: number): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/products/${id}`)
}

export async function healthCheck(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/health')
}

// -----------------------------------------------------------------------
// Formatters
// -----------------------------------------------------------------------

export function formatPrice(price: number, currency = 'VND'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

export function imageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_ODOO_URL ?? 'http://localhost:8069'}${path}`
}

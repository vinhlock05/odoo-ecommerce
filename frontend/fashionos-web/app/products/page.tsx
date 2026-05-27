import type { Metadata } from 'next'
import Link from 'next/link'
import { getProducts, type SortBy } from '@/lib/api'
import type { Product } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { Suspense } from 'react'
import ProductFilters from './ProductFilters'

export const metadata: Metadata = {
  title: 'Sản phẩm — FashionOS',
  description: 'Khám phá bộ sưu tập thời trang thể thao từ FashionOS',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    sort_by?: string
    min_price?: string
    max_price?: string
    category_id?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const search = sp.search ?? ''
  const sortBy = (sp.sort_by ?? '') as SortBy | ''
  const minPrice = sp.min_price ? Number(sp.min_price) : undefined
  const maxPrice = sp.max_price ? Number(sp.max_price) : undefined
  const categoryId = sp.category_id ? Number(sp.category_id) : undefined

  let products: Product[] = []
  let total = 0
  let totalPages = 1
  let fetchError: string | null = null

  try {
    const res = await getProducts({
      limit: 20,
      page,
      search: search || undefined,
      sort_by: sortBy || undefined,
      min_price: minPrice,
      max_price: maxPrice,
      category_id: categoryId,
    })
    products = res.data
    total = res.meta.total
    totalPages = res.meta.total_pages ?? Math.ceil(total / 20)
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Không thể kết nối tới Odoo API'
  }

  return (
    <div className="section-wrap py-10">

      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-fashionos-border">
        <p className="eyebrow mb-2">FashionOS</p>
        <div className="flex items-end justify-between gap-4">
          <h1
            className="text-display font-bold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Bộ sưu tập
          </h1>
          {!fetchError && (
            <p className="text-sm text-fashionos-muted pb-1">{total} sản phẩm</p>
          )}
        </div>
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="border border-fashionos-danger/30 bg-fashionos-danger/5 p-6 mb-8">
          <p className="text-sm font-semibold text-fashionos-danger mb-1">
            Không thể kết nối Odoo API
          </p>
          <p className="text-xs text-fashionos-muted font-mono">{fetchError}</p>
          <div className="mt-4 text-xs text-fashionos-muted space-y-1">
            <p>→ Chạy: <code className="bg-fashionos-surface px-1 py-0.5">docker compose up</code></p>
            <p>→ Kiểm tra: <code className="bg-fashionos-surface px-1 py-0.5">http://localhost:8069/fashionos/api/v1/health</code></p>
          </div>
        </div>
      )}

      {/* Main layout: filters + grid */}
      <div className="flex gap-10">

        {/* Filter sidebar (desktop) + mobile trigger */}
        <Suspense fallback={null}>
          <ProductFilters
            total={total}
            initialSearch={search}
            initialSort={sortBy}
            initialMinPrice={sp.min_price ?? ''}
            initialMaxPrice={sp.max_price ?? ''}
          />
        </Suspense>

        {/* Products area */}
        <div className="flex-1 min-w-0">

          {/* Result count — desktop only (mobile shows in filter bar) */}
          {!fetchError && (
            <div className="hidden lg:flex items-center justify-between mb-5">
              <p className="text-sm text-fashionos-muted">
                {search ? `Kết quả cho "${search}" — ` : ''}{total} sản phẩm
              </p>
            </div>
          )}

          {/* Empty state */}
          {!fetchError && products.length === 0 && (
            <div className="text-center py-24 text-fashionos-muted">
              <div className="text-5xl mb-5 opacity-30">🏷️</div>
              <p className="text-sm tracking-widest uppercase mb-2">Không tìm thấy sản phẩm</p>
              <p className="text-xs mb-6">Thử điều chỉnh bộ lọc hoặc từ khoá tìm kiếm</p>
              <Link href="/products" className="btn-outline">
                Xóa bộ lọc
              </Link>
            </div>
          )}

          {/* Grid */}
          {products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <PaginationLink
                  href={buildHref(sp, page - 1)}
                  label="← Trước"
                />
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <PaginationLink
                    key={p}
                    href={buildHref(sp, p)}
                    label={String(p)}
                    active={p === page}
                  />
                ))}
              {page < totalPages && (
                <PaginationLink
                  href={buildHref(sp, page + 1)}
                  label="Tiếp →"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildHref(
  sp: Record<string, string | undefined>,
  targetPage: number,
): string {
  const params = new URLSearchParams()
  if (sp.search) params.set('search', sp.search)
  if (sp.sort_by) params.set('sort_by', sp.sort_by)
  if (sp.min_price) params.set('min_price', sp.min_price)
  if (sp.max_price) params.set('max_price', sp.max_price)
  if (sp.category_id) params.set('category_id', sp.category_id)
  if (targetPage > 1) params.set('page', String(targetPage))
  const qs = params.toString()
  return `/products${qs ? `?${qs}` : ''}`
}

function PaginationLink({
  href,
  label,
  active = false,
}: {
  href: string
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={[
        'px-3 py-1.5 text-sm border transition-colors',
        active
          ? 'bg-fashionos-black text-fashionos-white border-fashionos-black'
          : 'border-fashionos-border hover:bg-fashionos-black hover:text-fashionos-white hover:border-fashionos-black',
      ].join(' ')}
    >
      {label}
    </Link>
  )
}

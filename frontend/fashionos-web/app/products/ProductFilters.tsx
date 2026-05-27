'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { SortBy } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FilterState {
  search: string
  sort_by: SortBy | ''
  min_price: string
  max_price: string
}

// ─── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortBy | ''; label: string }[] = [
  { value: '', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
  { value: 'name_asc', label: 'Tên A → Z' },
  { value: 'name_desc', label: 'Tên Z → A' },
]

// ─── Component ───────────────────────────────────────────────────────────────

interface ProductFiltersProps {
  total: number
  initialSearch?: string
  initialSort?: string
  initialMinPrice?: string
  initialMaxPrice?: string
}

export default function ProductFilters({
  total,
  initialSearch = '',
  initialSort = '',
  initialMinPrice = '',
  initialMaxPrice = '',
}: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    search: initialSearch,
    sort_by: initialSort as SortBy | '',
    min_price: initialMinPrice,
    max_price: initialMaxPrice,
  })

  function applyFilters(next: Partial<FilterState>) {
    const merged = { ...filters, ...next }
    setFilters(merged)

    const params = new URLSearchParams(searchParams.toString())

    if (merged.search) { params.set('search', merged.search) } else { params.delete('search') }
    if (merged.sort_by) { params.set('sort_by', merged.sort_by) } else { params.delete('sort_by') }
    if (merged.min_price) { params.set('min_price', merged.min_price) } else { params.delete('min_price') }
    if (merged.max_price) { params.set('max_price', merged.max_price) } else { params.delete('max_price') }
    params.delete('page') // reset to page 1 on filter change

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function clearAll() {
    setFilters({ search: '', sort_by: '', min_price: '', max_price: '' })
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasActiveFilters =
    filters.search || filters.sort_by || filters.min_price || filters.max_price

  const filterContent = (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <p className="text-[10px] tracking-widest uppercase font-semibold mb-3">Tìm kiếm</p>
        <div className="relative">
          <input
            type="search"
            value={filters.search}
            onChange={(e) => applyFilters({ search: e.target.value })}
            placeholder="Tên sản phẩm..."
            className="input-base pr-8 text-sm"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => applyFilters({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fashionos-muted hover:text-fashionos-black"
              aria-label="Xóa tìm kiếm"
            >
              <SmallCloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-[10px] tracking-widest uppercase font-semibold mb-3">Sắp xếp</p>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => applyFilters({ sort_by: opt.value })}
              className={[
                'w-full text-left px-3 py-2 text-sm transition-colors',
                filters.sort_by === opt.value
                  ? 'bg-fashionos-black text-fashionos-white'
                  : 'hover:bg-fashionos-surface text-fashionos-black',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-[10px] tracking-widest uppercase font-semibold mb-3">Khoảng giá (₫)</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={filters.min_price}
            onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value }))}
            onBlur={() => applyFilters({})}
            placeholder="Từ"
            className="input-base text-sm w-full"
            min={0}
          />
          <span className="text-fashionos-muted text-sm flex-shrink-0">—</span>
          <input
            type="number"
            value={filters.max_price}
            onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value }))}
            onBlur={() => applyFilters({})}
            placeholder="Đến"
            className="input-base text-sm w-full"
            min={0}
          />
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="w-full border border-fashionos-border py-2.5 text-[11px] tracking-widest uppercase hover:bg-fashionos-black hover:text-fashionos-white hover:border-fashionos-black transition-colors"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* ─── Mobile filter bar ─── */}
      <div className="lg:hidden flex items-center justify-between mb-5 pb-4 border-b border-fashionos-border">
        <p className="text-sm text-fashionos-muted">
          {isPending ? 'Đang lọc…' : `${total} sản phẩm`}
        </p>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 border border-fashionos-border px-3 py-2 text-[11px] tracking-widest uppercase hover:bg-fashionos-black hover:text-fashionos-white hover:border-fashionos-black transition-colors"
        >
          <FilterIcon />
          Lọc {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-fashionos-accent" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-fashionos-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-fashionos-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-fashionos-border">
              <p className="text-[11px] tracking-widest uppercase font-semibold">Bộ lọc</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 hover:text-fashionos-accent"
              >
                <SmallCloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {filterContent}
            </div>
          </div>
        </div>
      )}

      {/* ─── Desktop sidebar ─── */}
      <aside className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-20">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[10px] tracking-widest uppercase font-semibold">Bộ lọc</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[10px] text-fashionos-muted hover:text-fashionos-accent tracking-wider underline"
              >
                Xóa tất cả
              </button>
            )}
          </div>
          {filterContent}
          {isPending && (
            <p className="mt-4 text-[10px] text-fashionos-muted tracking-widest uppercase animate-pulse">
              Đang tải…
            </p>
          )}
        </div>
      </aside>
    </>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function SmallCloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}

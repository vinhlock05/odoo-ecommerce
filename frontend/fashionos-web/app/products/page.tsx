import type { Metadata } from 'next'
import { getProducts } from '@/lib/api'
import type { Product } from '@/lib/api'
import ProductCard from '@/components/ProductCard'

export const metadata: Metadata = {
  title: 'Sản phẩm',
  description: 'Khám phá bộ sưu tập thời trang từ FashionOS',
}

export default async function ProductsPage() {
  let products: Product[] = []
  let total = 0
  let error: string | null = null

  try {
    const res = await getProducts({ limit: 20 })
    products = res.data
    total = res.pagination.total
  } catch (err) {
    error = err instanceof Error ? err.message : 'Không thể kết nối tới Odoo API'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Page header */}
      <div className="mb-10 border-b border-fashionos-border pb-6">
        <p className="text-xs tracking-widest uppercase text-fashionos-muted mb-2">
          FashionOS — Headless Odoo v19
        </p>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Bộ sưu tập
        </h1>
        {!error && (
          <p className="text-sm text-fashionos-muted mt-2">{total} sản phẩm</p>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-6 mb-8">
          <p className="text-sm font-medium text-red-800 mb-1">Không thể kết nối Odoo API</p>
          <p className="text-xs text-red-600 font-mono">{error}</p>
          <div className="mt-4 text-xs text-red-700 space-y-1">
            <p>→ Chạy: <code className="bg-red-100 px-1">docker compose up</code></p>
            <p>→ Cài module: <code className="bg-red-100 px-1">fashionos_base</code></p>
            <p>→ Kiểm tra: <code className="bg-red-100 px-1">http://localhost:8069/fashionos/api/v1/health</code></p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!error && products.length === 0 && (
        <div className="text-center py-24 text-fashionos-muted">
          <p className="text-4xl mb-4">🏷️</p>
          <p className="text-sm tracking-widest uppercase">Chưa có sản phẩm nào</p>
          <p className="text-xs mt-2">Thêm sản phẩm trong Odoo backend → Products</p>
        </div>
      )}

      {/* Product grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* API info bar — helpful during dev */}
      <div className="mt-16 rounded bg-fashionos-surface border border-fashionos-border p-4 text-xs text-fashionos-muted font-mono">
        <p className="font-semibold text-fashionos-black mb-2">API Source</p>
        <p>GET {process.env.NEXT_PUBLIC_ODOO_URL}/fashionos/api/v1/products</p>
        <p className="mt-1">
          Status: {error
            ? <span className="text-red-500">⚠ Offline</span>
            : <span className="text-green-600">✓ {total} products fetched</span>
          }
        </p>
      </div>
    </div>
  )
}

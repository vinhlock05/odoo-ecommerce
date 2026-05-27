import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getProduct, imageUrl } from '@/lib/api'
import ProductImageGallery from './ProductImageGallery'
import ProductVariantSelector from './ProductVariantSelector'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const res = await getProduct(Number(id))
    if (!res.success) return {}
    const p = res.data
    const ogImage = p.images?.length
      ? imageUrl(p.images[0])
      : p.image_url
      ? imageUrl(p.image_url)
      : undefined
    return {
      title: `${p.name} — FashionOS`,
      description: p.description || p.name,
      openGraph: {
        title: p.name,
        description: p.description || p.name,
        images: ogImage ? [{ url: ogImage }] : [],
      },
    }
  } catch {
    return {}
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params

  let res
  try {
    res = await getProduct(Number(id))
  } catch {
    notFound()
  }

  if (!res.success) notFound()
  const product = res.data

  // Merge image_url + images[], de-duplicate
  const allImages = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images ?? []).filter((img) => img !== product.image_url),
  ]

  return (
    <main className="section-wrap py-8 md:py-14">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-[11px] tracking-widest uppercase text-fashionos-muted mb-8 flex-wrap"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-fashionos-black transition-colors">
          Trang chủ
        </Link>
        <span aria-hidden>·</span>
        <Link href="/products" className="hover:text-fashionos-black transition-colors">
          Sản phẩm
        </Link>
        {product.category && (
          <>
            <span aria-hidden>·</span>
            <span>{product.category}</span>
          </>
        )}
        <span aria-hidden>·</span>
        <span className="text-fashionos-black line-clamp-1 max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main grid */}
      <div className="grid lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] gap-8 xl:gap-16">
        {/* Left — image gallery */}
        <ProductImageGallery images={allImages} productName={product.name} />

        {/* Right — product info + actions */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* Category eyebrow */}
          {product.category && (
            <p className="eyebrow mb-3">{product.category}</p>
          )}

          {/* Product name — Playfair Display */}
          <h1
            className="text-[28px] md:text-[32px] xl:text-[36px] leading-tight font-semibold mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {product.name}
          </h1>

          {/* Short description */}
          {product.description && (
            <p className="text-sm text-fashionos-muted leading-relaxed mb-6">
              {product.description}
            </p>
          )}

          <div className="rule mb-6" />

          {/* Variant selector — handles price, swatches, qty, add-to-cart (client component) */}
          <ProductVariantSelector product={product} />

          {/* Full description accordion */}
          {product.description_full && (
            <details className="mt-8 group border-t border-fashionos-border">
              <summary className="flex items-center justify-between py-4 cursor-pointer list-none text-[11px] tracking-widest uppercase font-medium select-none">
                Mô tả chi tiết
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="transition-transform duration-200 group-open:rotate-180 shrink-0"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div
                className="pb-6 text-sm text-fashionos-muted leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description_full }}
              />
            </details>
          )}

          {/* Attribute list accordion */}
          {product.attributes && product.attributes.length > 0 && (
            <details className="group border-t border-fashionos-border">
              <summary className="flex items-center justify-between py-4 cursor-pointer list-none text-[11px] tracking-widest uppercase font-medium select-none">
                Thông tin thêm
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="transition-transform duration-200 group-open:rotate-180 shrink-0"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="pb-6 flex flex-col gap-2">
                {product.attributes.map((attr) => (
                  <div key={attr.id} className="flex gap-3 text-sm">
                    <span className="text-fashionos-muted w-28 shrink-0">{attr.name}</span>
                    <span className="text-fashionos-black">
                      {attr.values.map((v) => v.name).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Shipping & returns note */}
          <div className="mt-6 border border-fashionos-border/60 p-4 bg-fashionos-surface/50">
            <p className="text-[11px] tracking-widest uppercase font-medium mb-2 text-fashionos-muted">
              Giao hàng &amp; đổi trả
            </p>
            <ul className="text-[12px] text-fashionos-muted space-y-1 leading-relaxed">
              <li>✓ Miễn phí vận chuyển cho đơn từ 500.000₫</li>
              <li>✓ Đổi trả trong 30 ngày</li>
              <li>✓ Giao nhanh 2–3 ngày làm việc</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}

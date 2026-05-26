'use client'

import type { Product } from '@/lib/api'
import { formatPrice, imageUrl } from '@/lib/api'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasVariants = product.variant_count > 1
  const sizes = product.variants
    .flatMap(v => v.attributes)
    .filter(a => a.attribute.toLowerCase().includes('size'))
    .map(a => a.value)
  const uniqueSizes = [...new Set(sizes)].slice(0, 4)

  return (
    <article className="product-card group">
      {/* Image area */}
      <a href={`/products/${product.id}`} className="block relative overflow-hidden aspect-[3/4] bg-fashionos-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(product.image_url)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            // Fallback to placeholder if Odoo image fails
            const target = e.target as HTMLImageElement
            target.src = `https://placehold.co/400x533/F4F4F4/6B7280?text=${encodeURIComponent(product.name.slice(0, 12))}`
          }}
        />

        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            className="w-full bg-fashionos-black text-fashionos-white py-3 text-xs tracking-widest uppercase"
            onClick={(e) => {
              e.preventDefault()
              alert(`Thêm "${product.name}" vào giỏ — coming in Sprint 2`)
            }}
          >
            Thêm vào giỏ
          </button>
        </div>

        {/* Variant badge */}
        {hasVariants && (
          <span className="absolute top-3 left-3 bg-fashionos-white/90 text-fashionos-black text-[10px] px-2 py-1 tracking-wider uppercase">
            {product.variant_count} màu / size
          </span>
        )}
      </a>

      {/* Info */}
      <div className="p-4">
        {product.category && (
          <p className="text-[10px] text-fashionos-muted tracking-widest uppercase mb-1">
            {product.category}
          </p>
        )}

        <a href={`/products/${product.id}`} className="block">
          <h3 className="text-sm font-medium leading-snug mb-2 line-clamp-2 hover:text-fashionos-accent transition-colors">
            {product.name}
          </h3>
        </a>

        {/* Size pills */}
        {uniqueSizes.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {uniqueSizes.map(s => (
              <span key={s} className="text-[10px] border border-fashionos-border px-1.5 py-0.5">
                {s}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm font-semibold">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </article>
  )
}

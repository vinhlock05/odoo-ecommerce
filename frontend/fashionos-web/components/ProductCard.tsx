'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/api'
import { formatPrice, imageUrl, addToCart } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { showToast } from '@/components/Toast'

interface ProductCardProps {
  product: Product
}

function isColorAttr(name: string) {
  const l = name.toLowerCase()
  return l.includes('màu') || l.includes('color') || l.includes('colour')
}

function isSizeAttr(name: string) {
  const l = name.toLowerCase()
  return l.includes('size') || l.includes('cỡ') || l.includes('kích')
}

export default function ProductCard({ product }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  // Derived badge flags
  const isSale =
    product.compare_price != null && product.compare_price > product.price
  const discountPct = isSale
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0
  const isNew = product.is_new === true

  const allAttrs = product.variants.flatMap((v) => v.attributes)

  // Unique colors, keyed by value, preserving html_color
  const colorMap = new Map<string, { value: string; html_color: string | null }>()
  for (const a of allAttrs) {
    if (isColorAttr(a.attribute) && !colorMap.has(a.value)) {
      colorMap.set(a.value, { value: a.value, html_color: a.html_color ?? null })
    }
  }
  const colors = [...colorMap.values()]

  const allSizes = [
    ...new Set(allAttrs.filter((a) => isSizeAttr(a.attribute)).map((a) => a.value)),
  ]

  // When a color is selected, only show sizes that variant actually has
  const availableSizes = selectedColor
    ? [
      ...new Set(
        product.variants
          .filter((v) =>
            v.attributes.some((a) => isColorAttr(a.attribute) && a.value === selectedColor),
          )
          .flatMap((v) => v.attributes.filter((a) => isSizeAttr(a.attribute)))
          .map((a) => a.value),
      ),
    ]
    : allSizes

  const hasColors = colors.length > 0
  const hasSizes = allSizes.length > 0

  // Colors+sizes: show confirm button; sizes-only: click = add; colors-only or none: button always shown
  const showConfirmButton = !hasSizes || hasColors
  const canAdd =
    (!hasColors || selectedColor !== null) && (!hasSizes || selectedSize !== null)

  function findVariantId(color: string | null, size: string | null): number {
    const match = product.variants.find((v) => {
      const okColor = !color || v.attributes.some((a) => isColorAttr(a.attribute) && a.value === color)
      const okSize = !size || v.attributes.some((a) => isSizeAttr(a.attribute) && a.value === size)
      return okColor && okSize
    })
    return match?.id ?? product.variants[0]?.id ?? product.id
  }

  async function quickAdd(e: React.MouseEvent, color: string | null, size: string | null) {
    e.preventDefault()
    const token = getToken()
    if (!token) {
      window.location.href = `/login?next=/products/${product.id}`
      return
    }
    const variantId = findVariantId(color, size)
    setAdding(true)
    try {
      const res = await addToCart(token, variantId, 1)
      if (res.success) {
        showToast('success', 'Đã thêm vào giỏ hàng')
        window.dispatchEvent(
          new CustomEvent('fashionos:cart', { detail: { count: res.data.item_count } }),
        )
        setSelectedColor(null)
        setSelectedSize(null)
      } else {
        showToast('error', res.error?.message ?? 'Không thể thêm vào giỏ')
      }
    } catch {
      showToast('error', 'Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setAdding(false)
    }
  }

  function addButtonLabel() {
    if (adding) return 'Đang thêm…'
    if (canAdd) return 'Thêm vào giỏ'
    if (hasColors && !selectedColor) return hasSizes ? 'Chọn màu & size' : 'Chọn màu'
    return 'Chọn size'
  }

  return (
    <article className="product-card group relative">
      {/* Image area — overflow clip stays here, NOT on the Link */}
      <div className="relative overflow-hidden aspect-[3/4] bg-fashionos-surface">
        <Link href={`/products/${product.id}`} className="absolute inset-0 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            onError={(e) => {
              const t = e.target as HTMLImageElement
              t.src = `https://placehold.co/400x533/F4F4F4/9CA3AF?text=${encodeURIComponent(
                product.name.slice(0, 14),
              )}`
            }}
          />
        </Link>

        {/* Hover panel — sibling to Link so buttons are valid HTML */}
        <div
          className="
            absolute inset-x-0 bottom-0 z-10
            translate-y-full group-hover:translate-y-0
            transition-transform duration-300 ease-out
          "
        >
          <div className="bg-white/[0.97] backdrop-blur-md px-3 pt-2.5 pb-3 border-t border-fashionos-border/40">
            <p className="text-[9px] tracking-widest uppercase font-medium text-fashionos-muted mb-2">
              Thêm nhanh
            </p>

            {/* Color swatches */}
            {hasColors && (
              <div className="flex gap-1.5 flex-wrap mb-2">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.value}
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedColor(selectedColor === c.value ? null : c.value)
                      setSelectedSize(null)
                    }}
                    className={`
                      w-5 h-5 rounded-full border-2 transition-all duration-150 flex items-center justify-center overflow-hidden
                      ${selectedColor === c.value
                        ? 'border-fashionos-black scale-110 shadow-sm'
                        : 'border-fashionos-border/60 hover:border-fashionos-black'}
                    `}
                    style={c.html_color ? { backgroundColor: c.html_color } : undefined}
                  >
                    {!c.html_color && (
                      <span className="text-[7px] leading-none font-medium text-fashionos-muted">
                        {c.value.slice(0, 2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Size buttons */}
            {hasSizes && (
              <div className="flex gap-1 flex-wrap mb-2">
                {(selectedColor ? availableSizes : allSizes).map((size) => (
                  <button
                    key={size}
                    type="button"
                    disabled={adding}
                    onClick={(e) => {
                      e.preventDefault()
                      if (hasColors) {
                        setSelectedSize(selectedSize === size ? null : size)
                      } else {
                        quickAdd(e, null, size)
                      }
                    }}
                    className={`
                      min-w-[34px] h-7 px-2 border text-[10px] font-medium tracking-wide
                      transition-all duration-150 active:scale-95
                      disabled:opacity-50 disabled:cursor-wait
                      ${selectedSize === size
                        ? 'bg-fashionos-black text-fashionos-white border-fashionos-black'
                        : 'border-fashionos-border bg-white text-fashionos-black hover:bg-fashionos-black hover:text-fashionos-white hover:border-fashionos-black'}
                    `}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}

            {/* Confirm button — sizes-only mode skips this (click-to-add) */}
            {showConfirmButton && (
              <button
                type="button"
                disabled={adding || !canAdd}
                onClick={(e) => quickAdd(e, selectedColor, hasSizes ? selectedSize : null)}
                className="
                  w-full h-8 text-[10px] tracking-widest uppercase font-medium
                  bg-fashionos-black text-fashionos-white
                  hover:bg-fashionos-accent
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                {addButtonLabel()}
              </button>
            )}
          </div>
        </div>

        {/* Top-left badges: NEW / SALE */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {isNew && (
            <span className="bg-fashionos-accent text-fashionos-white text-[9px] px-2 py-1 tracking-widest uppercase font-semibold">
              Mới
            </span>
          )}
          {isSale && (
            <span className="bg-fashionos-danger text-fashionos-white text-[9px] px-2 py-1 tracking-widest uppercase font-semibold">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Top-right badge: variant count */}
        {product.variant_count > 1 && (
          <span className="absolute top-3 right-3 z-10 bg-fashionos-white/90 text-fashionos-black text-[9px] px-2 py-1 tracking-wider uppercase font-medium">
            {product.variant_count} loại
          </span>
        )}
      </div>

      {/* Product info */}
      <div className="pt-3 pb-4 px-4">
        {product.category && (
          <p className="text-[9px] text-fashionos-muted tracking-widest uppercase mb-1">
            {product.category}
          </p>
        )}

        <Link href={`/products/${product.id}`}>
          <h3 className="text-[13px] font-medium leading-snug mb-2 line-clamp-2 hover:text-fashionos-accent transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Color dot strip */}
        {hasColors && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {colors.slice(0, 7).map((c) => (
              <span
                key={c.value}
                title={c.value}
                className="w-3 h-3 rounded-full border border-fashionos-border/50"
                style={{ backgroundColor: c.html_color ?? '#D1D5DB' }}
              />
            ))}
            {colors.length > 7 && (
              <span className="text-[9px] text-fashionos-muted leading-3">+{colors.length - 7}</span>
            )}
          </div>
        )}

        {/* Size strip — only when no colors */}
        {!hasColors && hasSizes && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {allSizes.slice(0, 5).map((s) => (
              <span
                key={s}
                className="text-[9px] border border-fashionos-border px-1.5 py-0.5 text-fashionos-muted"
              >
                {s}
              </span>
            ))}
            {allSizes.length > 5 && (
              <span className="text-[9px] text-fashionos-muted px-0.5">+{allSizes.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-2 flex-wrap">
          <p className={`text-sm font-semibold tracking-tight ${isSale ? 'text-fashionos-danger' : ''}`}>
            {formatPrice(product.price)}
          </p>
          {isSale && (
            <p className="text-[11px] text-fashionos-muted line-through">
              {formatPrice(product.compare_price!)}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProductDetail } from '@/lib/api'
import { addToCart, formatPrice } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { showToast } from '@/components/Toast'

interface ProductVariantSelectorProps {
  product: ProductDetail
}

function isColorAttr(name: string) {
  const l = name.toLowerCase()
  return l.includes('màu') || l.includes('color') || l.includes('colour')
}

function isSizeAttr(name: string) {
  const l = name.toLowerCase()
  return l.includes('size') || l.includes('cỡ') || l.includes('kích')
}

export default function ProductVariantSelector({ product }: ProductVariantSelectorProps) {
  const router = useRouter()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  const allAttrs = product.variants.flatMap((v) => v.attributes)

  // Unique colors preserving html_color
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

  // When color is selected, only show sizes that variant actually has
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

  const canAdd =
    (!hasColors || selectedColor !== null) && (!hasSizes || selectedSize !== null)

  function findVariantId(color: string | null, size: string | null): number {
    const match = product.variants.find((v) => {
      const okColor =
        !color || v.attributes.some((a) => isColorAttr(a.attribute) && a.value === color)
      const okSize =
        !size || v.attributes.some((a) => isSizeAttr(a.attribute) && a.value === size)
      return okColor && okSize
    })
    return match?.id ?? product.variants[0]?.id ?? product.id
  }

  // Resolve price for selected variant
  const selectedVariant =
    selectedColor || selectedSize
      ? product.variants.find((v) => {
          const okColor =
            !selectedColor ||
            v.attributes.some((a) => isColorAttr(a.attribute) && a.value === selectedColor)
          const okSize =
            !selectedSize ||
            v.attributes.some((a) => isSizeAttr(a.attribute) && a.value === selectedSize)
          return okColor && okSize
        })
      : null

  const displayPrice = selectedVariant?.price ?? product.price

  async function handleAddToCart() {
    const token = getToken()
    if (!token) {
      router.push(`/login?next=/products/${product.id}`)
      return
    }
    const variantId = findVariantId(selectedColor, selectedSize)
    setAdding(true)
    try {
      const res = await addToCart(token, variantId, qty)
      if (res.success) {
        showToast('success', `Đã thêm ${qty} sản phẩm vào giỏ hàng`)
        window.dispatchEvent(
          new CustomEvent('fashionos:cart', { detail: { count: res.data.item_count } }),
        )
      } else {
        showToast('error', res.error?.message ?? 'Không thể thêm vào giỏ')
      }
    } catch {
      showToast('error', 'Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setAdding(false)
    }
  }

  function addLabel() {
    if (adding) return 'Đang thêm…'
    if (!canAdd) {
      if (hasColors && !selectedColor) return hasSizes ? 'Chọn màu & size' : 'Chọn màu trước'
      return 'Chọn size trước'
    }
    return 'Thêm vào giỏ hàng'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold tracking-tight">
          {formatPrice(displayPrice)}
        </span>
        {selectedVariant && selectedVariant.price !== product.price && (
          <span className="text-sm text-fashionos-muted line-through">
            {formatPrice(product.price)}
          </span>
        )}
      </div>

      {/* Color selection */}
      {hasColors && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] tracking-widest uppercase font-medium text-fashionos-muted">
              Màu sắc
            </p>
            {selectedColor && (
              <span className="text-[11px] text-fashionos-black font-medium">{selectedColor}</span>
            )}
          </div>
          <div className="flex gap-2.5 flex-wrap">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.value}
                onClick={() => {
                  setSelectedColor(selectedColor === c.value ? null : c.value)
                  setSelectedSize(null)
                }}
                className={[
                  'w-8 h-8 rounded-full border-2 transition-all duration-150 flex items-center justify-center overflow-hidden',
                  selectedColor === c.value
                    ? 'ring-1 ring-fashionos-black ring-offset-2 scale-110 border-fashionos-black'
                    : 'border-fashionos-border hover:border-fashionos-black',
                ].join(' ')}
                style={c.html_color ? { backgroundColor: c.html_color } : undefined}
              >
                {!c.html_color && (
                  <span className="text-[8px] leading-none font-semibold text-fashionos-muted">
                    {c.value.slice(0, 2)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size selection */}
      {hasSizes && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] tracking-widest uppercase font-medium text-fashionos-muted">
              Size
            </p>
            <button
              type="button"
              className="text-[11px] text-fashionos-muted underline hover:text-fashionos-black transition-colors"
            >
              Hướng dẫn chọn size
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(selectedColor ? availableSizes : allSizes).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                className={[
                  'min-w-[48px] h-10 px-3 border text-sm font-medium tracking-wide transition-all duration-150',
                  selectedSize === size
                    ? 'bg-fashionos-black text-fashionos-white border-fashionos-black'
                    : 'border-fashionos-border bg-fashionos-white text-fashionos-black hover:border-fashionos-black hover:bg-fashionos-black hover:text-fashionos-white',
                ].join(' ')}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + Add to cart */}
      <div className="flex gap-3 items-stretch">
        {/* Qty control */}
        <div className="flex border border-fashionos-border">
          <button
            type="button"
            aria-label="Giảm số lượng"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-12 flex items-center justify-center hover:bg-fashionos-surface transition-colors text-lg select-none"
          >
            −
          </button>
          <span className="w-10 h-12 flex items-center justify-center text-sm font-medium border-x border-fashionos-border">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Tăng số lượng"
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            className="w-10 h-12 flex items-center justify-center hover:bg-fashionos-surface transition-colors text-lg select-none"
          >
            +
          </button>
        </div>

        {/* Add to cart */}
        <button
          type="button"
          disabled={adding}
          onClick={handleAddToCart}
          className={[
            'flex-1 h-12 text-[11px] tracking-widest uppercase font-semibold transition-colors',
            canAdd && !adding
              ? 'bg-fashionos-black text-fashionos-white hover:bg-fashionos-accent'
              : adding
              ? 'bg-fashionos-black text-fashionos-white opacity-70 cursor-wait'
              : 'bg-fashionos-surface text-fashionos-muted cursor-not-allowed',
          ].join(' ')}
        >
          {addLabel()}
        </button>
      </div>

      {/* Secondary actions */}
      <div className="flex gap-5 text-[11px] text-fashionos-muted tracking-wider">
        <button
          type="button"
          className="flex items-center gap-1.5 hover:text-fashionos-black transition-colors"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Yêu thích
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 hover:text-fashionos-black transition-colors"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Chia sẻ
        </button>
      </div>
    </div>
  )
}

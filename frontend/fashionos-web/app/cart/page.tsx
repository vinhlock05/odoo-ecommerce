'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  formatPrice,
  imageUrl,
  type Cart,
} from '@/lib/api'
import { getToken, isLoggedIn } from '@/lib/auth'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingLine, setUpdatingLine] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
      return
    }
    loadCart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCart() {
    setLoading(true)
    setErrorMsg('')
    try {
      const token = getToken()!
      const res = await fetchCart(token)
      if (res.success) {
        setCart(res.data)
      } else {
        setErrorMsg('Không thể tải giỏ hàng. Vui lòng thử lại.')
      }
    } catch {
      setErrorMsg('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateQty(lineId: number, newQty: number) {
    const token = getToken()!
    setUpdatingLine(lineId)
    try {
      const res = newQty <= 0
        ? await removeCartItem(token, lineId)
        : await updateCartItem(token, lineId, newQty)
      if (res.success) {
        setCart(res.data)
        window.dispatchEvent(
          new CustomEvent('fashionos:cart', { detail: { count: res.data.item_count } }),
        )
      }
    } catch {
      setErrorMsg('Không thể cập nhật. Vui lòng thử lại.')
    } finally {
      setUpdatingLine(null)
    }
  }

  async function handleRemove(lineId: number) {
    const token = getToken()!
    setUpdatingLine(lineId)
    try {
      const res = await removeCartItem(token, lineId)
      if (res.success) {
        setCart(res.data)
        window.dispatchEvent(
          new CustomEvent('fashionos:cart', { detail: { count: res.data.item_count } }),
        )
      }
    } catch {
      setErrorMsg('Không thể xóa. Vui lòng thử lại.')
    } finally {
      setUpdatingLine(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-fashionos-muted text-sm animate-pulse">Đang tải giỏ hàng…</p>
      </div>
    )
  }

  if (errorMsg && !cart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 text-sm">{errorMsg}</p>
        <button onClick={loadCart} className="text-sm underline">Thử lại</button>
      </div>
    )
  }

  const isEmpty = !cart || cart.items.length === 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1
        className="text-2xl md:text-3xl font-semibold mb-8"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Giỏ hàng {cart && cart.item_count > 0 && (
          <span className="text-fashionos-muted text-lg font-normal">({cart.item_count})</span>
        )}
      </h1>

      {errorMsg && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {isEmpty ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart!.items.map((item) => (
              <div
                key={item.id}
                className={`flex gap-4 p-4 border border-fashionos-border bg-white transition-opacity ${updatingLine === item.id ? 'opacity-50' : ''
                  }`}
              >
                {/* Image */}
                <div className="w-20 h-24 bg-fashionos-surface flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(item.image_url)}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://placehold.co/80x96/F4F4F4/9E9E9E?text=${encodeURIComponent(item.product_name.charAt(0))}`
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product_name}</p>
                  {item.default_code && (
                    <p className="text-xs text-fashionos-muted mt-0.5">SKU: {item.default_code}</p>
                  )}
                  {item.variant_name && item.variant_name !== item.product_name && (
                    <p className="text-[10px] text-fashionos-muted mt-0.5 line-clamp-1">
                      {item.variant_name}
                    </p>
                  )}
                  <p className="text-sm text-fashionos-black mt-1">
                    {formatPrice(item.price_unit)}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    {/* Qty */}
                    <div className="flex items-center border border-fashionos-border">
                      <button
                        disabled={updatingLine === item.id || item.quantity <= 1}
                        onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-sm hover:bg-fashionos-surface transition-colors disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        disabled={updatingLine === item.id}
                        onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-sm hover:bg-fashionos-surface transition-colors disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-medium">{formatPrice(item.price_subtotal)}</p>
                      <button
                        disabled={updatingLine === item.id}
                        onClick={() => handleRemove(item.id)}
                        aria-label="Xóa sản phẩm"
                        className="text-fashionos-muted hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-fashionos-border p-6 sticky top-24">
              <h2 className="text-sm font-medium tracking-widest uppercase mb-5">Tổng đơn hàng</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-fashionos-muted">Tạm tính</span>
                  <span>{formatPrice(cart!.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fashionos-muted">Phí vận chuyển</span>
                  <span className="text-green-600">
                    {cart!.free_shipping_progress.unlocked ? 'Miễn phí' : 'Tính khi thanh toán'}
                  </span>
                </div>
              </div>

              {/* Free shipping progress */}
              {!cart!.free_shipping_progress.unlocked && (
                <div className="mt-4 pt-4 border-t border-fashionos-border">
                  <p className="text-xs text-fashionos-muted mb-2">
                    Mua thêm{' '}
                    <span className="text-fashionos-black font-medium">
                      {formatPrice(cart!.free_shipping_progress.remaining)}
                    </span>{' '}
                    để được miễn phí ship
                  </p>
                  <div className="h-1.5 bg-fashionos-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-fashionos-accent rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (cart!.free_shipping_progress.subtotal / cart!.free_shipping_progress.threshold) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between font-medium text-sm pt-4 mt-4 border-t border-fashionos-border">
                <span>Tổng cộng</span>
                <span className="text-fashionos-black">{formatPrice(cart!.subtotal)}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-5 w-full block text-center bg-fashionos-black text-fashionos-white py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-fashionos-accent transition-colors"
              >
                Tiến hành thanh toán
              </Link>

              <Link
                href="/products"
                className="mt-3 w-full block text-center text-xs text-fashionos-muted hover:text-fashionos-black transition-colors py-2"
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-fashionos-muted">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      <p className="text-fashionos-muted">Giỏ hàng của bạn đang trống</p>
      <Link
        href="/products"
        className="bg-fashionos-black text-fashionos-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-fashionos-accent transition-colors"
      >
        Khám phá sản phẩm
      </Link>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

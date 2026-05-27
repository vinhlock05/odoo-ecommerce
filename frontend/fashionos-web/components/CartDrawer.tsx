'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  imageUrl,
  formatPrice,
  type Cart,
} from '@/lib/api'
import { getToken } from '@/lib/auth'

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) { setCart(null); return }
    setLoading(true)
    try {
      const res = await fetchCart(token)
      if (res.success) setCart(res.data)
    } catch { /* non-critical */ }
    finally { setLoading(false) }
  }, [])

  // Open on custom event
  useEffect(() => {
    function onOpen() {
      setIsOpen(true)
      refresh()
    }
    window.addEventListener('fashionos:cart-drawer', onOpen)
    return () => window.removeEventListener('fashionos:cart-drawer', onOpen)
  }, [refresh])

  // Refresh items when cart is updated — only register listener while drawer is open
  useEffect(() => {
    if (!isOpen) return
    function onCartUpdate() { refresh() }
    window.addEventListener('fashionos:cart', onCartUpdate)
    return () => window.removeEventListener('fashionos:cart', onCartUpdate)
  }, [isOpen, refresh])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  async function handleQtyChange(lineId: number, newQty: number) {
    const token = getToken()
    if (!token) return
    setUpdatingId(lineId)
    try {
      const res = newQty === 0
        ? await removeCartItem(token, lineId)
        : await updateCartItem(token, lineId, newQty)
      if (res.success) {
        setCart(res.data)
        window.dispatchEvent(
          new CustomEvent('fashionos:cart', { detail: { count: res.data.item_count } }),
        )
      }
    } catch { /* silent */ }
    finally { setUpdatingId(null) }
  }

  const freeShip = cart?.free_shipping_progress
  const progress = freeShip
    ? Math.min(100, Math.round((freeShip.subtotal / freeShip.threshold) * 100))
    : 0

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
        className={[
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]',
          'transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng"
        className={[
          'fixed top-0 right-0 z-50 h-full w-full max-w-[400px]',
          'bg-fashionos-white flex flex-col shadow-2xl',
          'transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-fashionos-border shrink-0">
          <h2 className="text-[11px] tracking-widest uppercase font-semibold">
            Giỏ hàng
            {cart && cart.item_count > 0 && (
              <span className="ml-1.5 text-fashionos-muted font-normal">
                ({cart.item_count})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng"
            className="p-1.5 -mr-1 hover:text-fashionos-accent transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Free-shipping progress ──────────────────── */}
        {freeShip && (
          <div className="px-6 py-3 bg-fashionos-surface border-b border-fashionos-border shrink-0">
            {freeShip.unlocked ? (
              <p className="text-[11px] font-medium text-fashionos-accent tracking-wide">
                ✓ Bạn được miễn phí vận chuyển!
              </p>
            ) : (
              <p className="text-[11px] text-fashionos-muted">
                Mua thêm{' '}
                <span className="font-semibold text-fashionos-black">
                  {formatPrice(freeShip.remaining)}
                </span>{' '}
                để được miễn phí ship
              </p>
            )}
            <div className="mt-2 h-[3px] bg-fashionos-border rounded-full overflow-hidden">
              <div
                className="h-full bg-fashionos-accent transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Item list ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading skeleton */}
          {loading && !cart && (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-fashionos-muted animate-pulse">Đang tải…</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && (!cart || cart.items.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-8 py-16">
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-fashionos-border"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <div>
                <p className="text-sm font-medium mb-1">Giỏ hàng trống</p>
                <p className="text-[12px] text-fashionos-muted">Thêm sản phẩm để bắt đầu mua sắm</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[11px] tracking-widest uppercase font-medium underline underline-offset-4 hover:text-fashionos-accent transition-colors"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          )}

          {/* Cart items */}
          {cart && cart.items.length > 0 && (
            <ul className="divide-y divide-fashionos-border/50">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-4">
                  {/* Thumbnail */}
                  <div className="w-[60px] h-[76px] flex-shrink-0 bg-fashionos-surface overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl(item.image_url)}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://placehold.co/60x76/F4F4F4/9CA3AF?text=...`
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] font-medium leading-snug line-clamp-2 flex-1">
                          {item.product_name}
                        </p>
                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => handleQtyChange(item.id, 0)}
                          aria-label="Xóa"
                          className="shrink-0 p-0.5 text-fashionos-muted hover:text-fashionos-danger disabled:opacity-40 transition-colors"
                        >
                          <svg
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      {item.variant_name && item.variant_name !== item.product_name && (
                        <p className="text-[10px] text-fashionos-muted mt-0.5 line-clamp-1">
                          {item.variant_name}
                        </p>
                      )}
                    </div>

                    {/* Qty stepper + subtotal */}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-fashionos-border">
                        <button
                          type="button"
                          disabled={updatingId === item.id || item.quantity <= 1}
                          onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                          aria-label="Giảm"
                          className="w-7 h-7 flex items-center justify-center text-base hover:bg-fashionos-surface transition-colors disabled:opacity-30 select-none"
                        >
                          −
                        </button>
                        <span className="w-8 h-7 flex items-center justify-center text-[12px] font-medium border-x border-fashionos-border tabular-nums">
                          {updatingId === item.id ? '…' : item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={updatingId === item.id || item.quantity >= 10}
                          onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                          aria-label="Tăng"
                          className="w-7 h-7 flex items-center justify-center text-base hover:bg-fashionos-surface transition-colors disabled:opacity-30 select-none"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[12px] font-semibold tracking-tight tabular-nums">
                        {formatPrice(item.price_subtotal)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-fashionos-border px-6 pt-4 pb-6 shrink-0 bg-fashionos-white">
            {/* Subtotal */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] tracking-widest uppercase text-fashionos-muted">
                Tạm tính
              </span>
              <span className="text-xl font-semibold tracking-tight tabular-nums">
                {formatPrice(cart.subtotal)}
              </span>
            </div>
            {/* Checkout CTA */}
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-full h-12 bg-fashionos-black text-fashionos-white text-[11px] tracking-widest uppercase font-semibold hover:bg-fashionos-accent transition-colors"
            >
              Thanh toán
            </Link>
            {/* View full cart */}
            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="mt-3 flex items-center justify-center w-full h-9 border border-fashionos-border text-[11px] tracking-widest uppercase font-medium hover:bg-fashionos-surface transition-colors"
            >
              Xem giỏ hàng
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}

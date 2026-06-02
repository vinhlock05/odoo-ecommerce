'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  fetchCart,
  getAddresses,
  createAddress,
  checkoutCart,
  formatPrice,
  type Cart,
  type Address,
  type CheckoutOrder,
} from '@/lib/api'
import { getToken, isLoggedIn } from '@/lib/auth'

type PageStep = 'checkout' | 'success'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [step, setStep] = useState<PageStep>('checkout')
  const [confirmedOrder, setConfirmedOrder] = useState<CheckoutOrder | null>(null)

  // Order note
  const [note, setNote] = useState('')

  // New address form state
  const [showNewAddrForm, setShowNewAddrForm] = useState(false)
  const [newAddr, setNewAddr] = useState({ name: '', phone: '', street: '', city: '' })
  const [addingAddr, setAddingAddr] = useState(false)
  const [addrError, setAddrError] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
      return
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    setLoading(true)
    const token = getToken()!
    try {
      const [cartRes, addrRes] = await Promise.all([
        fetchCart(token),
        getAddresses(token),
      ])
      if (cartRes.success) {
        setCart(cartRes.data)
      } else {
        setErrorMsg(cartRes.error?.message ?? 'Không thể tải giỏ hàng. Vui lòng thử lại.')
      }
      if (addrRes.success && addrRes.data.length > 0) {
        setAddresses(addrRes.data)
        setSelectedAddressId(addrRes.data[0].id)
      } else {
        // No saved addresses — show the new-address form immediately
        setShowNewAddrForm(true)
      }
    } catch {
      setErrorMsg('Không thể tải thông tin. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  function updateNewAddr(field: keyof typeof newAddr, value: string) {
    setNewAddr((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSaveAddress() {
    const { name, phone, street, city } = newAddr
    if (!name.trim() || !phone.trim() || !street.trim() || !city.trim()) {
      setAddrError('Vui lòng điền đầy đủ thông tin địa chỉ.')
      return
    }
    // Validate Vietnamese phone: 10–11 digits starting with 0
    if (!/^0\d{9,10}$/.test(phone.replace(/\s/g, ''))) {
      setAddrError('Số điện thoại không hợp lệ (VD: 0912 345 678).')
      return
    }
    const token = getToken()!
    setAddingAddr(true)
    setAddrError('')
    try {
      const res = await createAddress(token, {
        name: name.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        country_code: 'VN',
      })
      if (res.success) {
        setAddresses((prev) => [...prev, res.data])
        setSelectedAddressId(res.data.id)
        setShowNewAddrForm(false)
        setNewAddr({ name: '', phone: '', street: '', city: '' })
      } else {
        setAddrError(res.error?.message ?? 'Không thể lưu địa chỉ. Vui lòng thử lại.')
      }
    } catch {
      setAddrError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setAddingAddr(false)
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setErrorMsg('Vui lòng chọn hoặc thêm địa chỉ giao hàng.')
      return
    }
    const token = getToken()!
    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await checkoutCart(token, {
        delivery_address_id: selectedAddressId,
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      if (res.success) {
        setConfirmedOrder(res.data)
        setStep('success')
        window.dispatchEvent(new CustomEvent('fashionos:cart', { detail: { count: 0 } }))
      } else {
        setErrorMsg(res.error?.message ?? 'Không thể đặt hàng. Vui lòng thử lại.')
      }
    } catch {
      setErrorMsg('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-fashionos-muted text-sm animate-pulse">Đang tải thanh toán…</p>
      </div>
    )
  }

  // ── Success screen ───────────────────────────────────────────────────────

  if (step === 'success' && confirmedOrder) {
    return <SuccessScreen order={confirmedOrder} />
  }

  // ── Empty / missing cart guard ───────────────────────────────────────────

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 text-center px-4">
        <p className="text-fashionos-muted">Giỏ hàng của bạn đang trống.</p>
        <Link
          href="/products"
          className="bg-fashionos-black text-fashionos-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-fashionos-accent transition-colors"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    )
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)

  // ── Checkout form ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1
        className="text-2xl md:text-3xl font-semibold mb-8"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Thanh toán
      </h1>

      {errorMsg && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Delivery address ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-sm font-medium tracking-widest uppercase mb-4">
              Địa chỉ giao hàng
            </h2>

            {/* Saved addresses */}
            {addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-4 p-4 border cursor-pointer transition-colors ${
                      selectedAddressId === addr.id
                        ? 'border-fashionos-black bg-white'
                        : 'border-fashionos-border hover:border-fashionos-black'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-fashionos-black"
                    />
                    <div className="text-sm leading-relaxed">
                      <p className="font-medium">{addr.name}</p>
                      {addr.phone && (
                        <p className="text-fashionos-muted">{addr.phone}</p>
                      )}
                      <p className="text-fashionos-muted">
                        {[addr.street, addr.city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Add new address toggle */}
            {!showNewAddrForm ? (
              <button
                onClick={() => setShowNewAddrForm(true)}
                className="mt-4 text-sm text-fashionos-muted hover:text-fashionos-black transition-colors underline underline-offset-2"
              >
                + Thêm địa chỉ mới
              </button>
            ) : (
              <div className="mt-4 border border-fashionos-border p-5 space-y-4">
                <p className="text-xs tracking-widest uppercase font-medium">
                  Địa chỉ mới
                </p>

                {addrError && (
                  <p className="text-red-600 text-xs">{addrError}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                      Họ & tên *
                    </label>
                    <input
                      type="text"
                      value={newAddr.name}
                      onChange={(e) => updateNewAddr('name', e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full border border-fashionos-border px-3 py-2.5 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      value={newAddr.phone}
                      onChange={(e) => updateNewAddr('phone', e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full border border-fashionos-border px-3 py-2.5 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                      Địa chỉ *
                    </label>
                    <input
                      type="text"
                      value={newAddr.street}
                      onChange={(e) => updateNewAddr('street', e.target.value)}
                      placeholder="Số nhà, tên đường, phường/xã"
                      className="w-full border border-fashionos-border px-3 py-2.5 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                      Quận / Tỉnh, Thành phố *
                    </label>
                    <input
                      type="text"
                      value={newAddr.city}
                      onChange={(e) => updateNewAddr('city', e.target.value)}
                      placeholder="Quận 1, TP. Hồ Chí Minh"
                      className="w-full border border-fashionos-border px-3 py-2.5 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSaveAddress}
                    disabled={addingAddr}
                    className="px-5 py-2.5 bg-fashionos-black text-fashionos-white text-xs tracking-widest uppercase hover:bg-fashionos-accent transition-colors disabled:opacity-60"
                  >
                    {addingAddr ? 'Đang lưu…' : 'Lưu địa chỉ'}
                  </button>
                  {addresses.length > 0 && (
                    <button
                      onClick={() => {
                        setShowNewAddrForm(false)
                        setAddrError('')
                      }}
                      className="px-5 py-2.5 border border-fashionos-border text-xs tracking-widest uppercase hover:border-fashionos-black transition-colors"
                    >
                      Huỷ
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ── Delivery note ──────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-medium tracking-widest uppercase mb-3">
              Ghi chú đơn hàng
            </h2>
            <textarea
              id="order-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Giao giờ hành chính, gọi trước khi giao…"
              className="w-full border border-fashionos-border px-4 py-3 text-sm focus:outline-none focus:border-fashionos-black transition-colors resize-none"
            />
          </section>
        </div>

        {/* ── Right: Order summary ───────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-fashionos-border p-6 sticky top-24">
            <h2 className="text-sm font-medium tracking-widest uppercase mb-5">
              Tóm tắt đơn hàng
            </h2>

            {/* Items */}
            <div className="space-y-3 mb-5">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="truncate">{item.product_name}</p>
                    <p className="text-fashionos-muted text-xs">× {item.quantity}</p>
                  </div>
                  <p className="flex-shrink-0 font-medium">
                    {formatPrice(item.price_subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-fashionos-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-fashionos-muted">Tạm tính</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fashionos-muted">Phí vận chuyển</span>
                <span className="text-green-600">
                  {cart.free_shipping_progress.unlocked ? 'Miễn phí' : 'Tính sau'}
                </span>
              </div>
            </div>

            <div className="flex justify-between font-medium text-sm pt-4 mt-4 border-t border-fashionos-border">
              <span>Tổng cộng</span>
              <span className="text-fashionos-black">{formatPrice(cart.subtotal)}</span>
            </div>

            {/* Delivery address summary */}
            {selectedAddress && (
              <div className="mt-4 pt-4 border-t border-fashionos-border text-xs text-fashionos-muted space-y-0.5">
                <p className="text-fashionos-black font-medium text-sm mb-1">Giao đến</p>
                <p>{selectedAddress.name}</p>
                {selectedAddress.phone && <p>{selectedAddress.phone}</p>}
                <p>
                  {[selectedAddress.street, selectedAddress.city]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={submitting || !selectedAddressId}
              className="mt-6 w-full bg-fashionos-black text-fashionos-white py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-fashionos-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang xử lý…' : 'Xác nhận đặt hàng'}
            </button>

            <Link
              href="/cart"
              className="mt-3 w-full block text-center text-xs text-fashionos-muted hover:text-fashionos-black transition-colors py-2"
            >
              ← Quay lại giỏ hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------

function SuccessScreen({ order }: { order: CheckoutOrder }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Check icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-green-600"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div>
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Đặt hàng thành công!
          </h1>
          <p className="text-fashionos-muted text-sm">
            Cảm ơn bạn đã mua sắm tại FashionOS.
          </p>
        </div>

        {/* Order details */}
        <div className="bg-fashionos-surface border border-fashionos-border p-5 text-left space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-fashionos-muted">Mã đơn hàng</span>
            <span className="font-medium font-mono">{order.order_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fashionos-muted">Tổng thanh toán</span>
            <span className="font-semibold text-fashionos-black">
              {formatPrice(order.amount_total)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-fashionos-muted">Trạng thái</span>
            <span className="text-green-700 font-medium">Đã xác nhận</span>
          </div>
        </div>

        <p className="text-xs text-fashionos-muted">
          Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ liên hệ khi giao hàng.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/products"
            className="w-full block text-center bg-fashionos-black text-fashionos-white py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-fashionos-accent transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
          <Link
            href="/"
            className="w-full block text-center text-xs text-fashionos-muted hover:text-fashionos-black transition-colors py-2"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}

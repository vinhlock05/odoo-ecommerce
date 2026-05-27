'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMe,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getOrders,
  getOrder,
  getLoyalty,
  getLoyaltyHistory,
  formatPrice,
  type UserProfile,
  type Address,
  type OrderSummary,
  type Order,
  type LoyaltyStatus,
  type LoyaltyTransaction,
} from '@/lib/api'
import { getToken, isLoggedIn, logout } from '@/lib/auth'

type Tab = 'profile' | 'addresses' | 'orders' | 'loyalty'

// ---------------------------------------------------------------------------
// Root page
// ---------------------------------------------------------------------------

export default function AccountPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
      return
    }
    loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfile() {
    const token = getToken()!
    try {
      const res = await getMe(token)
      if (res.success) setProfile(res.data)
    } catch {
      // silently fail — tabs will show empty states
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
    router.replace('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-fashionos-muted text-sm animate-pulse">Đang tải…</p>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Thông tin' },
    { id: 'addresses', label: 'Địa chỉ' },
    { id: 'orders', label: 'Đơn hàng' },
    { id: 'loyalty', label: 'CoolCash' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-fashionos-black text-fashionos-white flex items-center justify-center text-xl font-medium flex-shrink-0">
            {profile?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {profile?.name ?? 'Khách hàng'}
            </h1>
            <p className="text-fashionos-muted text-sm mt-0.5">{profile?.email ?? ''}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-fashionos-muted hover:text-fashionos-black transition-colors border border-fashionos-border px-4 py-2 hover:border-fashionos-black"
        >
          Đăng xuất
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-fashionos-border mb-8">
        <div className="flex gap-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-xs tracking-widest uppercase font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-fashionos-black text-fashionos-black'
                  : 'border-transparent text-fashionos-muted hover:text-fashionos-black'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <ProfileTab
          profile={profile}
          onSaved={(updated) => setProfile(updated)}
        />
      )}
      {activeTab === 'addresses' && <AddressesTab />}
      {activeTab === 'orders' && <OrdersTab />}
      {activeTab === 'loyalty' && <LoyaltyTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profile tab
// ---------------------------------------------------------------------------

function ProfileTab({
  profile,
  onSaved,
}: {
  profile: UserProfile | null
  onSaved: (p: UserProfile) => void
}) {
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    gender_title: (profile?.gender_title ?? '') as 'anh' | 'chi' | '',
  })
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSuccessMsg('')
    setErrorMsg('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrorMsg('Họ và tên không được để trống.')
      return
    }
    if (form.phone && !/^0\d{9,10}$/.test(form.phone.replace(/\s/g, ''))) {
      setErrorMsg('Số điện thoại không hợp lệ.')
      return
    }
    const token = getToken()!
    setSaving(true)
    setErrorMsg('')
    try {
      const res = await updateProfile(token, {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        gender_title: form.gender_title || '',
      })
      if (res.success) {
        onSaved(res.data)
        setSuccessMsg('Đã lưu thông tin.')
      } else {
        setErrorMsg('Không thể lưu. Vui lòng thử lại.')
      }
    } catch {
      setErrorMsg('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-sm font-medium tracking-widest uppercase mb-6">
        Thông tin cá nhân
      </h2>

      {successMsg && (
        <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Gender salutation */}
        <div>
          <label className="block text-xs tracking-widest uppercase font-medium mb-2">
            Xưng hô
          </label>
          <div className="flex gap-3">
            {(['anh', 'chi'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => update('gender_title', form.gender_title === g ? '' : g)}
                className={`flex-1 py-2.5 border text-xs tracking-widest uppercase font-medium transition-colors ${
                  form.gender_title === g
                    ? 'bg-fashionos-black text-fashionos-white border-fashionos-black'
                    : 'border-fashionos-border text-fashionos-muted hover:border-fashionos-black hover:text-fashionos-black'
                }`}
              >
                {g === 'anh' ? 'Anh' : 'Chị'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="p-name" className="block text-xs tracking-widest uppercase font-medium mb-1.5">
            Họ và tên *
          </label>
          <input
            id="p-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full border border-fashionos-border px-4 py-3 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
          />
        </div>

        <div>
          <label htmlFor="p-email" className="block text-xs tracking-widest uppercase font-medium mb-1.5">
            Email
          </label>
          <input
            id="p-email"
            type="email"
            disabled
            value={profile?.email ?? ''}
            className="w-full border border-fashionos-border px-4 py-3 text-sm bg-fashionos-surface text-fashionos-muted cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-fashionos-muted">Email không thể thay đổi.</p>
        </div>

        <div>
          <label htmlFor="p-phone" className="block text-xs tracking-widest uppercase font-medium mb-1.5">
            Số điện thoại
          </label>
          <div className="relative">
            <input
              id="p-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="0912 345 678"
              className="w-full border border-fashionos-border px-4 py-3 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
            />
            {profile?.phone_verified && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xs font-medium flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Đã xác minh
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-fashionos-black text-fashionos-white py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-fashionos-accent transition-colors disabled:opacity-60"
        >
          {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Addresses tab
// ---------------------------------------------------------------------------

type AddrFormMode = 'new' | 'edit'

interface AddrFormState {
  mode: AddrFormMode
  editId?: number
  name: string
  phone: string
  street: string
  city: string
}

function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddrs, setLoadingAddrs] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const emptyForm: AddrFormState = {
    mode: 'new',
    name: '',
    phone: '',
    street: '',
    city: '',
  }
  const [form, setForm] = useState<AddrFormState | null>(null)

  const loadAddresses = useCallback(async () => {
    const token = getToken()!
    setLoadingAddrs(true)
    try {
      const res = await getAddresses(token)
      if (res.success) setAddresses(res.data)
    } catch {
      setErrorMsg('Không thể tải địa chỉ.')
    } finally {
      setLoadingAddrs(false)
    }
  }, [])

  useEffect(() => {
    loadAddresses()
  }, [loadAddresses])

  function updateForm(field: keyof Omit<AddrFormState, 'mode' | 'editId'>, value: string) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev)
    setFormError('')
  }

  function openNewForm() {
    setForm({ ...emptyForm, mode: 'new' })
    setFormError('')
  }

  function openEditForm(addr: Address) {
    setForm({
      mode: 'edit',
      editId: addr.id,
      name: addr.name,
      phone: addr.phone ?? '',
      street: addr.street ?? '',
      city: addr.city ?? '',
    })
    setFormError('')
  }

  function closeForm() {
    setForm(null)
    setFormError('')
  }

  async function handleDelete(addrId: number) {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return
    const token = getToken()!
    setDeletingId(addrId)
    try {
      const res = await deleteAddress(token, addrId)
      if (res.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== addrId))
      } else {
        setErrorMsg(res.error?.message ?? 'Không thể xóa địa chỉ.')
      }
    } catch {
      setErrorMsg('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSave() {
    if (!form) return
    const { name, phone, street, city, mode, editId } = form

    if (!name.trim() || !phone.trim() || !street.trim() || !city.trim()) {
      setFormError('Vui lòng điền đầy đủ thông tin địa chỉ.')
      return
    }
    if (!/^0\d{9,10}$/.test(phone.replace(/\s/g, ''))) {
      setFormError('Số điện thoại không hợp lệ (VD: 0912 345 678).')
      return
    }

    const token = getToken()!
    setSaving(true)
    setFormError('')
    try {
      if (mode === 'new') {
        const res = await createAddress(token, {
          name: name.trim(),
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim(),
          country_code: 'VN',
        })
        if (res.success) {
          setAddresses((prev) => [...prev, res.data])
          closeForm()
        } else {
          setFormError(res.error?.message ?? 'Không thể lưu địa chỉ.')
        }
      } else if (mode === 'edit' && editId) {
        const res = await updateAddress(token, editId, {
          name: name.trim(),
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim(),
        })
        if (res.success) {
          setAddresses((prev) => prev.map((a) => (a.id === editId ? res.data : a)))
          closeForm()
        } else {
          setFormError(res.error?.message ?? 'Không thể cập nhật địa chỉ.')
        }
      }
    } catch {
      setFormError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-medium tracking-widest uppercase">Sổ địa chỉ</h2>
        {!form && (
          <button
            onClick={openNewForm}
            className="text-xs tracking-widest uppercase font-medium border border-fashionos-border px-4 py-2 hover:border-fashionos-black hover:bg-fashionos-black hover:text-fashionos-white transition-colors"
          >
            + Thêm địa chỉ
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {loadingAddrs ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-fashionos-surface animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {addresses.length === 0 && !form && (
            <div className="text-center py-16 border border-dashed border-fashionos-border">
              <p className="text-fashionos-muted text-sm mb-4">Bạn chưa có địa chỉ nào.</p>
              <button
                onClick={openNewForm}
                className="text-xs tracking-widest uppercase font-medium border border-fashionos-border px-5 py-2.5 hover:border-fashionos-black hover:bg-fashionos-black hover:text-fashionos-white transition-colors"
              >
                Thêm địa chỉ đầu tiên
              </button>
            </div>
          )}

          {/* Address cards */}
          {addresses.length > 0 && (
            <div className="space-y-3 mb-6">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`flex items-start justify-between p-4 border border-fashionos-border bg-white transition-opacity ${
                    deletingId === addr.id ? 'opacity-40' : ''
                  }`}
                >
                  <div className="text-sm leading-relaxed min-w-0 flex-1">
                    <p className="font-medium">{addr.name}</p>
                    {addr.phone && <p className="text-fashionos-muted text-xs mt-0.5">{addr.phone}</p>}
                    <p className="text-fashionos-muted text-xs mt-0.5">
                      {[addr.street, addr.city].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <button
                      onClick={() => openEditForm(addr)}
                      disabled={deletingId === addr.id}
                      className="text-xs text-fashionos-muted hover:text-fashionos-black transition-colors underline underline-offset-2 disabled:opacity-40"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                      className="text-xs text-fashionos-muted hover:text-red-600 transition-colors underline underline-offset-2 disabled:opacity-40"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Inline form for add / edit */}
      {form && (
        <div className="border border-fashionos-border p-5 space-y-4 bg-white">
          <p className="text-xs tracking-widest uppercase font-medium">
            {form.mode === 'new' ? 'Địa chỉ mới' : 'Chỉnh sửa địa chỉ'}
          </p>

          {formError && <p className="text-red-600 text-xs">{formError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                Họ & tên *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
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
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
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
                value={form.street}
                onChange={(e) => updateForm('street', e.target.value)}
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
                value={form.city}
                onChange={(e) => updateForm('city', e.target.value)}
                placeholder="Quận 1, TP. Hồ Chí Minh"
                className="w-full border border-fashionos-border px-3 py-2.5 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-fashionos-black text-fashionos-white text-xs tracking-widest uppercase hover:bg-fashionos-accent transition-colors disabled:opacity-60"
            >
              {saving ? 'Đang lưu…' : form.mode === 'new' ? 'Lưu địa chỉ' : 'Cập nhật'}
            </button>
            <button
              onClick={closeForm}
              className="px-5 py-2.5 border border-fashionos-border text-xs tracking-widest uppercase hover:border-fashionos-black transition-colors"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Orders tab
// ---------------------------------------------------------------------------

const ORDER_STATE_LABELS: Record<string, { label: string; color: string }> = {
  draft:  { label: 'Nháp',              color: 'text-fashionos-muted' },
  sent:   { label: 'Đã gửi báo giá',    color: 'text-blue-600' },
  sale:   { label: 'Đang xử lý',        color: 'text-green-700' },
  done:   { label: 'Hoàn thành',        color: 'text-fashionos-black' },
  cancel: { label: 'Đã huỷ',            color: 'text-red-600' },
}

function OrdersTab() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const loadOrders = useCallback(async (p: number) => {
    const token = getToken()!
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await getOrders(token, { page: p, limit: 10 })
      if (res.success) {
        setOrders(res.data)
        setTotalPages(res.meta?.total_pages ?? 1)
      } else {
        setErrorMsg('Không thể tải đơn hàng. Vui lòng thử lại.')
      }
    } catch {
      setErrorMsg('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders(page)
  }, [loadOrders, page])

  if (selectedOrderId !== null) {
    return (
      <OrderDetail
        orderId={selectedOrderId}
        onBack={() => setSelectedOrderId(null)}
      />
    )
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-sm font-medium tracking-widest uppercase mb-6">Lịch sử đơn hàng</h2>

      {errorMsg && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-fashionos-surface animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-fashionos-border p-12 text-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-fashionos-muted mx-auto mb-4"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="text-fashionos-muted text-sm">Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => {
              const stateInfo = ORDER_STATE_LABELS[order.state] ?? {
                label: order.state_label,
                color: 'text-fashionos-muted',
              }
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="w-full text-left border border-fashionos-border p-4 hover:border-fashionos-black transition-colors bg-white group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-fashionos-accent transition-colors">
                        {order.name}
                      </p>
                      <p className="text-xs text-fashionos-muted mt-0.5">
                        {new Date(order.date_order).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                        {' · '}{order.item_count} sản phẩm
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium">{formatPrice(order.amount_total)}</p>
                      <p className={`text-xs mt-0.5 ${stateInfo.color}`}>{stateInfo.label}</p>
                    </div>
                  </div>
                  {order.coolcash_earned > 0 && (
                    <p className="text-xs text-fashionos-muted mt-2 border-t border-fashionos-border pt-2">
                      + {order.coolcash_earned.toLocaleString('vi-VN')} CoolCash tích lũy
                    </p>
                  )}
                </button>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs tracking-widest uppercase text-fashionos-muted hover:text-fashionos-black disabled:opacity-40 transition-colors"
              >
                ← Trước
              </button>
              <span className="text-xs text-fashionos-muted">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs tracking-widest uppercase text-fashionos-muted hover:text-fashionos-black disabled:opacity-40 transition-colors"
              >
                Tiếp →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Order detail (inline sub-view within Orders tab)
// ---------------------------------------------------------------------------

function OrderDetail({ orderId, onBack }: { orderId: number; onBack: () => void }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = getToken()!
    setLoading(true)
    getOrder(token, orderId)
      .then((res) => {
        if (res.success) setOrder(res.data)
        else setErrorMsg('Không thể tải chi tiết đơn hàng.')
      })
      .catch(() => setErrorMsg('Lỗi kết nối. Vui lòng thử lại.'))
      .finally(() => setLoading(false))
  }, [orderId])

  const stateInfo = order
    ? ORDER_STATE_LABELS[order.state] ?? { label: order.state_label, color: 'text-fashionos-muted' }
    : null

  return (
    <div className="max-w-2xl">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs text-fashionos-muted hover:text-fashionos-black transition-colors mb-6 tracking-widest uppercase"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Quay lại
      </button>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-fashionos-surface animate-pulse" />
          ))}
        </div>
      ) : errorMsg ? (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      ) : order ? (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-medium tracking-widest uppercase">{order.name}</h2>
              <p className="text-xs text-fashionos-muted mt-1">
                {new Date(order.date_order).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {stateInfo && (
              <span className={`text-xs font-medium tracking-widest uppercase ${stateInfo.color}`}>
                {stateInfo.label}
              </span>
            )}
          </div>

          {/* Order lines */}
          <div className="border border-fashionos-border divide-y divide-fashionos-border mb-6">
            {order.lines.map((line) => (
              <div key={line.id} className="p-4 flex gap-4">
                {line.image_url ? (
                  <img
                    src={line.image_url}
                    alt={line.product_name}
                    className="w-14 h-14 object-cover flex-shrink-0 bg-fashionos-surface"
                  />
                ) : (
                  <div className="w-14 h-14 bg-fashionos-surface flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{line.product_name}</p>
                  {line.variant_name && (
                    <p className="text-xs text-fashionos-muted mt-0.5">{line.variant_name}</p>
                  )}
                  <p className="text-xs text-fashionos-muted mt-1">SL: {line.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">{formatPrice(line.price_subtotal)}</p>
                  <p className="text-xs text-fashionos-muted mt-0.5">
                    {formatPrice(line.price_unit)} / cái
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border border-fashionos-border p-4 space-y-2 mb-6">
            <div className="flex justify-between text-xs text-fashionos-muted">
              <span>Tạm tính</span>
              <span>{formatPrice(order.amount_untaxed)}</span>
            </div>
            <div className="flex justify-between text-xs text-fashionos-muted">
              <span>Thuế VAT</span>
              <span>{formatPrice(order.amount_tax)}</span>
            </div>
            {order.coolcash_redeemed > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>CoolCash đã dùng</span>
                <span>−{order.coolcash_redeemed.toLocaleString('vi-VN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium pt-2 border-t border-fashionos-border">
              <span>Tổng cộng</span>
              <span>{formatPrice(order.amount_total)}</span>
            </div>
          </div>

          {/* CoolCash earned notice */}
          {order.coolcash_earned > 0 && (
            <div className="px-4 py-3 bg-fashionos-surface border border-fashionos-border text-xs text-fashionos-muted mb-6 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              + {order.coolcash_earned.toLocaleString('vi-VN')} CoolCash đã được cộng vào tài khoản
            </div>
          )}

          {/* Shipping address */}
          {order.shipping_address && (
            <div className="border border-fashionos-border p-4">
              <p className="text-xs tracking-widest uppercase font-medium mb-2">Địa chỉ giao hàng</p>
              <p className="text-sm">{order.shipping_address.name}</p>
              {order.shipping_address.phone && (
                <p className="text-xs text-fashionos-muted mt-0.5">{order.shipping_address.phone}</p>
              )}
              <p className="text-xs text-fashionos-muted mt-0.5">
                {[order.shipping_address.street, order.shipping_address.city]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          )}

          {/* Note */}
          {order.note && (
            <div className="border border-fashionos-border p-4 mt-4">
              <p className="text-xs tracking-widest uppercase font-medium mb-1">Ghi chú</p>
              <p className="text-sm text-fashionos-muted">{order.note}</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loyalty tab
// ---------------------------------------------------------------------------

const TIER_CONFIG: Record<string, { label: string; textColor: string; badgeBg: string; badgeText: string }> = {
  member: {
    label:     'Member',
    textColor: 'text-fashionos-muted',
    badgeBg:   'bg-white/20',
    badgeText: 'text-white/80',
  },
  silver: {
    label:     'Silver',
    textColor: 'text-slate-500',
    badgeBg:   'bg-slate-200',
    badgeText: 'text-slate-700',
  },
  gold: {
    label:     'Gold',
    textColor: 'text-amber-600',
    badgeBg:   'bg-amber-100',
    badgeText: 'text-amber-700',
  },
}

const TXN_TYPE_LABELS: Record<string, string> = {
  earn:       'Tích điểm',
  redeem:     'Đổi điểm',
  expire:     'Hết hạn',
  adjustment: 'Điều chỉnh',
}

const TIER_EARN_RATES: Record<string, string> = {
  member: '1%',
  silver: '2%',
  gold:   '3%',
}

const TIER_THRESHOLDS: Record<string, string> = {
  member: '0 đ',
  silver: '5.000.000 đ',
  gold:   '15.000.000 đ',
}

function LoyaltyTab() {
  const [status, setStatus] = useState<LoyaltyStatus | null>(null)
  const [history, setHistory] = useState<LoyaltyTransaction[]>([])
  const [histPage, setHistPage] = useState(1)
  const [histTotalPages, setHistTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [histLoading, setHistLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = getToken()!
    getLoyalty(token)
      .then((res) => {
        if (res.success) setStatus(res.data)
        else setErrorMsg('Không thể tải thông tin loyalty.')
      })
      .catch(() => setErrorMsg('Lỗi kết nối. Vui lòng thử lại.'))
      .finally(() => setLoading(false))
  }, [])

  const loadHistory = useCallback(async (p: number) => {
    const token = getToken()!
    setHistLoading(true)
    try {
      const res = await getLoyaltyHistory(token, { page: p, limit: 10 })
      if (res.success) {
        setHistory(res.data)
        setHistTotalPages(res.meta?.total_pages ?? 1)
      }
    } finally {
      setHistLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory(histPage)
  }, [loadHistory, histPage])

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-40 bg-fashionos-surface animate-pulse" />
        <div className="h-24 bg-fashionos-surface animate-pulse" />
        <div className="h-48 bg-fashionos-surface animate-pulse" />
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="max-w-2xl px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
        {errorMsg}
      </div>
    )
  }

  if (!status) return null

  const tierCfg = TIER_CONFIG[status.tier] ?? TIER_CONFIG.member

  return (
    <div className="max-w-2xl">
      <h2 className="text-sm font-medium tracking-widest uppercase mb-6">CoolCash & Hạng thành viên</h2>

      {/* Balance card */}
      <div className="border border-fashionos-border p-6 bg-fashionos-black text-fashionos-white mb-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs tracking-widest uppercase opacity-50 mb-1.5">Số dư CoolCash</p>
            <p
              className="text-5xl font-semibold leading-none"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {status.coolcash_balance.toLocaleString('vi-VN')}
            </p>
            <p className="text-xs opacity-50 mt-1.5">
              tương đương {formatPrice(status.coolcash_balance)}
            </p>
          </div>
          <span
            className={`text-xs tracking-widest uppercase font-medium px-3 py-1 ${tierCfg.badgeBg} ${tierCfg.badgeText}`}
          >
            {status.tier_label}
          </span>
        </div>

        {/* Progress bar */}
        {status.next_tier ? (
          <div>
            <div className="flex items-center justify-between text-xs opacity-50 mb-2">
              <span>Tích lũy: {formatPrice(status.lifetime_spend)}</span>
              <span>
                {TIER_CONFIG[status.next_tier.tier]?.label ?? status.next_tier.tier} tại{' '}
                {formatPrice(status.next_tier.threshold)}
              </span>
            </div>
            <div className="h-1 bg-white/20 overflow-hidden rounded-full">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, status.next_tier.progress_pct)}%` }}
              />
            </div>
            <p className="text-xs opacity-50 mt-2">
              Còn {formatPrice(status.next_tier.spend_remaining)} để lên hạng{' '}
              {TIER_CONFIG[status.next_tier.tier]?.label ?? status.next_tier.tier}
            </p>
          </div>
        ) : (
          <p className="text-xs opacity-50">
            Bạn đang ở hạng cao nhất — Gold Member 🎉
          </p>
        )}
      </div>

      {/* Tier comparison */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {(['member', 'silver', 'gold'] as const).map((tier) => {
          const cfg = TIER_CONFIG[tier]
          const isActive = status.tier === tier
          return (
            <div
              key={tier}
              className={`border p-4 text-center transition-colors ${
                isActive
                  ? 'border-fashionos-black bg-fashionos-black text-fashionos-white'
                  : 'border-fashionos-border'
              }`}
            >
              <p
                className={`text-xs tracking-widest uppercase font-medium mb-2 ${
                  isActive ? 'text-white opacity-70' : cfg.textColor
                }`}
              >
                {cfg.label}
              </p>
              <p
                className="text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {TIER_EARN_RATES[tier]}
              </p>
              <p className={`text-xs mt-1 ${isActive ? 'opacity-50' : 'text-fashionos-muted'}`}>
                ≥ {TIER_THRESHOLDS[tier]}
              </p>
            </div>
          )
        })}
      </div>

      {/* Transaction history */}
      <h3 className="text-xs tracking-widest uppercase font-medium mb-4">Lịch sử giao dịch</h3>

      {histLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-fashionos-surface animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="border border-dashed border-fashionos-border p-10 text-center">
          <p className="text-fashionos-muted text-sm">Chưa có giao dịch nào.</p>
        </div>
      ) : (
        <>
          <div className="border border-fashionos-border divide-y divide-fashionos-border">
            {history.map((txn) => {
              const isPositive =
                txn.type === 'earn' ||
                (txn.type === 'adjustment' && txn.amount > 0)
              return (
                <div key={txn.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{TXN_TYPE_LABELS[txn.type] ?? txn.type}</p>
                    {txn.description && (
                      <p className="text-xs text-fashionos-muted truncate mt-0.5">
                        {txn.description}
                      </p>
                    )}
                    <p className="text-xs text-fashionos-muted mt-0.5">
                      {new Date(txn.date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{txn.amount.toLocaleString('vi-VN')}
                    </p>
                    <p className="text-xs text-fashionos-muted">
                      Dư: {txn.balance_after.toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {histTotalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                disabled={histPage === 1}
                onClick={() => setHistPage((p) => p - 1)}
                className="text-xs tracking-widest uppercase text-fashionos-muted hover:text-fashionos-black disabled:opacity-40 transition-colors"
              >
                ← Trước
              </button>
              <span className="text-xs text-fashionos-muted">
                {histPage} / {histTotalPages}
              </span>
              <button
                disabled={histPage === histTotalPages}
                onClick={() => setHistPage((p) => p + 1)}
                className="text-xs tracking-widest uppercase text-fashionos-muted hover:text-fashionos-black disabled:opacity-40 transition-colors"
              >
                Tiếp →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

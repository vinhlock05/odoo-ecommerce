'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerUser } from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'

const REDIRECT_SECONDS = 3

function getFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts[parts.length - 1]
}

function buildGreeting(name: string, genderTitle: 'anh' | 'chi' | ''): string {
  const firstName = getFirstName(name)
  if (genderTitle === 'anh') return `Chào mừng Anh ${firstName}`
  if (genderTitle === 'chi') return `Chào mừng Chị ${firstName}`
  return `Chào mừng ${firstName}`
}

function buildSubtext(genderTitle: 'anh' | 'chi' | ''): string {
  if (genderTitle === 'anh') return 'Tài khoản của anh đã sẵn sàng.'
  if (genderTitle === 'chi') return 'Tài khoản của chị đã sẵn sàng.'
  return 'Tài khoản của bạn đã sẵn sàng.'
}

interface WelcomeUser {
  name: string
  gender_title: 'anh' | 'chi' | ''
}

// ---------------------------------------------------------------------------
// Success / Onboarding screen
// ---------------------------------------------------------------------------

function SuccessScreen({ user, onNavigate }: { user: WelcomeUser; onNavigate: () => void }) {
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          onNavigate()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [onNavigate])

  function handleCTA() {
    if (timerRef.current) clearInterval(timerRef.current)
    onNavigate()
  }

  return (
    <div className="min-h-screen bg-fashionos-surface flex items-center justify-center px-4 py-12">
      <style>{`
        @keyframes circle-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes check-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes ripple-expand {
          0%   { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes progress-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-white border border-fashionos-border p-10 shadow-sm text-center">

          {/* Brand */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-1">
              <span
                className="text-xl font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Fashion
              </span>
              <span className="text-xl font-light tracking-[0.2em] uppercase text-fashionos-accent">
                OS
              </span>
            </Link>
          </div>

          {/* Animated checkmark */}
          <div className="relative mx-auto mb-8 w-20 h-20 flex items-center justify-center">
            {/* Ripple ring */}
            <div
              className="absolute inset-0 rounded-full border border-fashionos-success"
              style={{ animation: 'ripple-expand 1.2s ease-out 0.5s infinite' }}
            />
            {/* SVG circle + check */}
            <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" aria-hidden="true">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#16A34A"
                strokeWidth="1.5"
                style={{
                  strokeDasharray: '214',
                  strokeDashoffset: '214',
                  animation: 'circle-draw 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards',
                }}
              />
              <polyline
                points="24,41 35,53 57,27"
                stroke="#16A34A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: '52',
                  strokeDashoffset: '52',
                  animation: 'check-draw 0.38s cubic-bezier(0.16, 1, 0.3, 1) 0.65s forwards',
                }}
              />
            </svg>
          </div>

          {/* Label + greeting */}
          <p className="text-xs tracking-[0.2em] uppercase text-fashionos-muted font-medium mb-3">
            Đăng ký thành công
          </p>
          <h1
            className="text-2xl font-semibold tracking-tight text-fashionos-black mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {buildGreeting(user.name, user.gender_title)}
          </h1>
          <p className="text-sm text-fashionos-muted max-w-xs mx-auto leading-relaxed">
            {buildSubtext(user.gender_title)}{' '}
            Khám phá bộ sưu tập mới nhất của FashionOS.
          </p>

          {/* Progress bar */}
          <div className="mt-8 mb-2">
            <div className="w-full h-[2px] bg-fashionos-border overflow-hidden">
              <div
                className="h-full bg-fashionos-black"
                style={{
                  width: '0%',
                  animation: `progress-fill ${REDIRECT_SECONDS}s linear forwards`,
                }}
              />
            </div>
          </div>
          <p className="text-xs text-fashionos-muted mb-6">
            Tự động chuyển hướng sau{' '}
            <span className="font-medium tabular-nums text-fashionos-black">{countdown}s</span>
          </p>

          {/* CTA */}
          <button
            onClick={handleCTA}
            className="w-full bg-fashionos-black text-fashionos-white py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-fashionos-accent transition-colors duration-300"
          >
            Bắt đầu mua sắm ngay
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Registration form
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    gender_title: '' as 'anh' | 'chi' | '',
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [welcomeUser, setWelcomeUser] = useState<WelcomeUser | null>(null)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (form.password !== form.confirm) {
      setErrorMsg('Mật khẩu xác nhận không khớp.')
      return
    }
    if (form.password.length < 8) {
      setErrorMsg('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (form.phone && !/^0\d{9,10}$/.test(form.phone)) {
      setErrorMsg('Số điện thoại không hợp lệ (bắt đầu bằng 0, 10–11 số).')
      return
    }

    setLoading(true)
    try {
      const payload: Parameters<typeof registerUser>[0] = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        ...(form.phone ? { phone: form.phone.trim() } : {}),
        ...(form.gender_title ? { gender_title: form.gender_title } : {}),
      }
      const res = await registerUser(payload)
      if (!res.success) {
        setErrorMsg('Đăng ký thất bại. Email có thể đã được sử dụng.')
        return
      }
      setToken(res.data.token)
      setUser({
        partner_id: res.data.partner_id,
        name: res.data.name,
        email: res.data.email,
      })
      setWelcomeUser({ name: res.data.name, gender_title: form.gender_title })
    } catch {
      setErrorMsg('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  if (welcomeUser) {
    return (
      <SuccessScreen
        user={welcomeUser}
        onNavigate={() => router.push('/products')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-fashionos-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border border-fashionos-border p-8 shadow-sm">
          {/* Brand */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-1">
              <span
                className="text-2xl font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Fashion
              </span>
              <span className="text-2xl font-light tracking-[0.2em] uppercase text-fashionos-accent">
                OS
              </span>
            </Link>
            <p className="mt-3 text-fashionos-muted text-sm">Tạo tài khoản để bắt đầu mua sắm</p>
          </div>

          {errorMsg && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label htmlFor="name" className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full border border-fashionos-border px-4 py-3 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="ten@email.com"
                className="w-full border border-fashionos-border px-4 py-3 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                Số điện thoại
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="0901234567"
                className="w-full border border-fashionos-border px-4 py-3 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full border border-fashionos-border px-4 py-3 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirm}
                onChange={(e) => update('confirm', e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full border border-fashionos-border px-4 py-3 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-fashionos-black text-fashionos-white py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-fashionos-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-fashionos-muted">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="text-fashionos-black underline underline-offset-2 hover:text-fashionos-accent transition-colors"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

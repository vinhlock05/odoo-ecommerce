'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginUser } from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionExpired = searchParams.get('session') === 'expired'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await loginUser(email.trim().toLowerCase(), password)
      if (!res.success) {
        setErrorMsg('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
        return
      }
      setToken(res.data.token)
      setUser({
        partner_id: res.data.partner_id,
        name: res.data.name,
        email: res.data.email,
      })
      router.push('/products')
    } catch {
      setErrorMsg('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-fashionos-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
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
            <p className="mt-3 text-fashionos-muted text-sm">Đăng nhập để tiếp tục mua sắm</p>
          </div>

          {/* Session expired banner */}
          {sessionExpired && !errorMsg && (
            <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded">
              Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@fashionos.vn"
                className="w-full border border-fashionos-border px-4 py-3 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs tracking-widest uppercase font-medium mb-1.5">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-fashionos-border px-4 py-3 text-sm focus:outline-none focus:border-fashionos-black transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-fashionos-black text-fashionos-white py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-fashionos-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-4 bg-fashionos-surface border border-fashionos-border text-xs text-fashionos-muted">
            <p className="font-medium text-fashionos-black mb-1">Demo account:</p>
            <p>Email: <span className="font-mono">demo@fashionos.vn</span></p>
            <p>Password: <span className="font-mono">Demo@12345</span></p>
          </div>

          <p className="mt-6 text-center text-sm text-fashionos-muted">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-fashionos-black underline underline-offset-2 hover:text-fashionos-accent transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

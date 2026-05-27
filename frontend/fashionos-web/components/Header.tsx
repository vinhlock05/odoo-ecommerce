'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { getToken, getUser, logout, type StoredUser } from '@/lib/auth'
import { fetchCart, logoutUser } from '@/lib/api'

const NAV_LINKS = [
  { href: '/products', label: 'Sản phẩm' },
  { href: '/products?tag=new', label: 'Hàng mới' },
  { href: '/products?tag=sale', label: 'Sale' },
  { href: '/coolclub', label: 'CoolClub' },
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on route change
  useEffect(() => {
    setMobileNavOpen(false)
    setMenuOpen(false)
  }, [pathname])

  async function refreshCartCount(token: string) {
    try {
      const res = await fetchCart(token)
      if (res.success) setCartCount(res.data.item_count)
    } catch { /* cart badge is non-critical */ }
  }

  useEffect(() => {
    function syncAuth() {
      const storedUser = getUser()
      setUser(storedUser)
      const token = getToken()
      if (token) {
        refreshCartCount(token)
      } else {
        setCartCount(0)
      }
    }

    function syncCart(e: Event) {
      const detail = (e as CustomEvent<{ count?: number }>).detail
      if (typeof detail?.count === 'number') {
        // fast path — no API call needed
        setCartCount(detail.count)
      } else {
        const token = getToken()
        if (token) refreshCartCount(token)
      }
    }

    syncAuth()
    window.addEventListener('fashionos:auth', syncAuth)
    window.addEventListener('fashionos:cart', syncCart)
    return () => {
      window.removeEventListener('fashionos:auth', syncAuth)
      window.removeEventListener('fashionos:cart', syncCart)
    }
  }, [])

  function handleLogout() {
    const token = getToken()
    logoutUser(token ?? undefined).catch(() => { })
    logout()
    setUser(null)
    setCartCount(0)
    router.push('/')
  }

  function openCartDrawer() {
    window.dispatchEvent(new CustomEvent('fashionos:cart-drawer'))
  }

  return (
    <header className="sticky top-0 z-50 bg-fashionos-white border-b border-fashionos-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1">
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

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm tracking-widest uppercase hover:text-fashionos-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* User */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm hover:text-fashionos-accent transition-colors"
                >
                  <UserIcon />
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name.split(' ').pop()}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-fashionos-border rounded shadow-lg text-sm z-50">
                    <div className="px-4 py-2 border-b border-fashionos-border text-fashionos-muted truncate">
                      {user.email}
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full text-left px-4 py-2 hover:bg-fashionos-surface transition-colors"
                    >
                      Tài khoản
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-fashionos-surface transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 p-2 text-sm hover:text-fashionos-accent transition-colors"
                aria-label="Đăng nhập"
              >
                <UserIcon />
                <span className="hidden sm:inline text-xs tracking-widest uppercase">
                  Đăng nhập
                </span>
              </Link>
            )}

            {/* Cart — opens slide-in drawer */}
            <button
              type="button"
              onClick={openCartDrawer}
              aria-label={`Giỏ hàng (${cartCount} sản phẩm)`}
              className="relative p-2 hover:text-fashionos-accent transition-colors flex"
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-fashionos-black text-fashionos-white text-[10px] rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              className="md:hidden p-2 hover:text-fashionos-accent transition-colors"
              aria-label={mobileNavOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-fashionos-border bg-fashionos-white">
          <nav className="section-wrap py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2 py-3 text-sm tracking-widest uppercase hover:text-fashionos-accent border-b border-fashionos-border/40 transition-colors last:border-0"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/account"
                  className="mt-2 px-2 py-3 text-sm tracking-widest uppercase hover:text-fashionos-accent transition-colors border-b border-fashionos-border/40"
                >
                  Tài khoản
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-2 py-3 text-left text-sm tracking-widest uppercase text-fashionos-muted hover:text-fashionos-danger transition-colors"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="mt-2 px-2 py-3 text-sm tracking-widest uppercase hover:text-fashionos-accent transition-colors"
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Close user dropdown when clicking outside */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  )
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
      <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
      <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}
